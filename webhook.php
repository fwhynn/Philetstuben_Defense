<?php
declare(strict_types=1);

const REPO_ROOT = __DIR__;
const APP_ROOT = __DIR__;
const REMOTE_NAME = 'origin';
const SECRET_FILE = REPO_ROOT . '/.deploy-webhook-secret';
const LOCK_FILE = '/tmp/autohextd-tag-webhook.lock';
const ERROR_LOG_FILE = APP_ROOT . '/webhook-error.log';
const DEPLOY_BRANCH = 'main';
const NODE_BIN = '/usr/local/bin/node';
const NPM_BIN = '/usr/local/bin/npm';
const DUO_SERVICE = 'autohextd-duo.service';
const ALLOWED_ACTORS = ['autophil317', 'fwhynn', 'zlyfer'];

header('Content-Type: application/json; charset=utf-8');

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        respond(200, [
            'ok' => true,
            'message' => 'Send a signed GitHub tag-push webhook via POST to deploy. Only phil can deploy.',
            'repoRoot' => REPO_ROOT,
        ]);
    }
    if ($method !== 'POST') {
        respond(405, ['ok' => false, 'message' => 'Only GET and POST are allowed.']);
    }

    $payloadRaw = file_get_contents('php://input');
    if ($payloadRaw === false || $payloadRaw === '') {
        respond(400, ['ok' => false, 'message' => 'Missing request body.']);
    }

    $secret = loadSecret();
    if ($secret === '') {
        respond(500, [
            'ok' => false,
            'message' => 'Webhook secret missing. Create ../.deploy-webhook-secret next to the git repo root.',
        ]);
    }

    verifyGithubSignature($payloadRaw, $secret);

    $event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '';
    if ($event === 'ping') {
        respond(200, ['ok' => true, 'message' => 'Ping received.']);
    }

    $payload = json_decode($payloadRaw, true, 512, JSON_THROW_ON_ERROR);
    $tag = extractTagName($event, $payload);
    if ($tag === null) {
        respond(202, [
            'ok' => true,
            'message' => 'Webhook ignored because the event is not a tag push.',
            'event' => $event,
        ]);
    }

    $actor = extractActor($payload);
    if (!isAllowedActor($actor)) {
        respond(403, [
            'ok' => false,
            'message' => 'Deployment ignored because only phil may deploy tags.',
            'actor' => $actor,
            'tag' => $tag,
        ]);
    }

    ensureDeployPreconditions();

    $lockHandle = fopen(LOCK_FILE, 'c');
    if ($lockHandle === false) {
        respond(500, ['ok' => false, 'message' => 'Could not open deployment lock file.']);
    }
    if (!flock($lockHandle, LOCK_EX | LOCK_NB)) {
        respond(409, ['ok' => false, 'message' => 'Another deployment is already running.']);
    }

    try {
        $dirty = runCommand(gitCommand('status --porcelain --untracked-files=no'), REPO_ROOT);
        if ($dirty['exitCode'] !== 0) {
            respond(500, ['ok' => false, 'message' => 'Git status failed.', 'command' => $dirty]);
        }
        if (trim($dirty['stdout']) !== '') {
            respond(409, [
                'ok' => false,
                'message' => 'Deployment aborted because the repository has tracked local changes.',
                'details' => trim($dirty['stdout']),
            ]);
        }

        set_time_limit(300);
        $steps = [];

        // Der Tag-Push löst das Update nur aus; ausgeliefert wird immer der aktuelle Stand von main.
        $steps[] = runCheckedCommand(gitCommand('checkout ' . escapeshellarg(DEPLOY_BRANCH)), REPO_ROOT, 'Switching to ' . DEPLOY_BRANCH . ' failed.');
        $steps[] = runCheckedCommand(gitCommand('pull --ff-only ' . escapeshellarg(REMOTE_NAME) . ' ' . escapeshellarg(DEPLOY_BRANCH)), REPO_ROOT, 'git pull failed.');
        $steps[] = runCheckedCommand(NPM_BIN . ' ci --omit=dev', APP_ROOT, 'npm ci failed.');
        $steps[] = runCheckedCommand(NPM_BIN . ' run generate-assets-index', APP_ROOT, 'npm run generate-assets-index failed.');
        $steps[] = runCheckedCommand('/usr/bin/sudo -n /usr/bin/systemctl restart ' . DUO_SERVICE, REPO_ROOT, 'Duo restart failed. Check journalctl.');
        // Nicht fatal: Das Spiel ist zu diesem Zeitpunkt bereits aktualisiert.
        $health = runCommand(NODE_BIN . ' deploy/check-duo-health.cjs', APP_ROOT);
        $steps[] = $health;

        $head = runCheckedCommand(gitCommand('rev-parse HEAD'), REPO_ROOT, 'Could not read deployed commit.');

        respond(200, [
            'ok' => true,
            'message' => $health['exitCode'] === 0 ? 'Deployed successfully.' : 'Deployed, but Duo health check failed.',
            'actor' => $actor,
            'tag' => $tag,
            'branch' => DEPLOY_BRANCH,
            'commit' => trim($head['stdout']),
            'steps' => $steps,
        ]);
    } finally {
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
} catch (JsonException $exception) {
    respond(400, ['ok' => false, 'message' => 'Invalid JSON payload.', 'error' => $exception->getMessage()]);
} catch (RuntimeException $exception) {
    respond(500, ['ok' => false, 'message' => $exception->getMessage()]);
} catch (Throwable $exception) {
    respond(500, ['ok' => false, 'message' => 'Unhandled deployment error.', 'error' => $exception->getMessage()]);
}

function extractTagName(string $event, array $payload): ?string
{
    if ($event !== 'push' || !empty($payload['deleted'])) {
        return null;
    }

    $ref = (string) ($payload['ref'] ?? '');
    if (!str_starts_with($ref, 'refs/tags/')) {
        return null;
    }

    return normalizeTag(substr($ref, 10));
}

function extractActor(array $payload): string
{
    foreach ([$payload['sender']['login'] ?? null, $payload['pusher']['name'] ?? null] as $candidate) {
        if (is_string($candidate) && $candidate !== '') {
            return $candidate;
        }
    }
    return '';
}

function isAllowedActor(string $actor): bool
{
    return in_array(strtolower($actor), ALLOWED_ACTORS, true);
}

function normalizeTag(mixed $tag): ?string
{
    if (!is_string($tag) || $tag === '') {
        return null;
    }
    if (!preg_match('/\A[0-9A-Za-z._\/-]+\z/', $tag)) {
        return null;
    }
    return $tag;
}

function loadSecret(): string
{
    $envSecret = getenv('AUTOHEXTD_WEBHOOK_SECRET');
    if (is_string($envSecret) && $envSecret !== '') {
        return trim($envSecret);
    }
    if (!is_file(SECRET_FILE)) {
        return '';
    }
    $fileSecret = file_get_contents(SECRET_FILE);
    return $fileSecret === false ? '' : trim($fileSecret);
}

function verifyGithubSignature(string $payload, string $secret): void
{
    $signatureHeader = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
    if (!str_starts_with($signatureHeader, 'sha256=')) {
        respond(401, ['ok' => false, 'message' => 'Missing GitHub sha256 signature header.']);
    }
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    if (!hash_equals($expected, $signatureHeader)) {
        respond(401, ['ok' => false, 'message' => 'Signature verification failed.']);
    }
}

function ensureDeployPreconditions(): void
{
    if (!is_dir(REPO_ROOT . '/.git')) {
        throw new RuntimeException('Git repository not found at repo root.');
    }
    if (!is_writable(REPO_ROOT) || !is_writable(REPO_ROOT . '/.git')) {
        throw new RuntimeException('Repository is not writable for PHP-FPM. Grant the PHP user write access before using this webhook.');
    }
    if (!is_writable(APP_ROOT)) {
        throw new RuntimeException('App directory is not writable for npm ci. Grant the PHP user write access before using this webhook.');
    }
    foreach ([NODE_BIN, NPM_BIN] as $binary) {
        if (!is_executable($binary)) {
            throw new RuntimeException($binary . ' not found or not executable.');
        }
    }
}

function gitCommand(string $arguments): string
{
    return 'git -c safe.directory=' . escapeshellarg(REPO_ROOT) . ' ' . $arguments;
}

function runCheckedCommand(string $command, string $cwd, string $failureMessage): array
{
    $result = runCommand($command, $cwd);
    if ($result['exitCode'] !== 0) {
        respond(500, [
            'ok' => false,
            'message' => $failureMessage,
            'command' => $result,
        ]);
    }
    return $result;
}

function runCommand(string $command, string $cwd): array
{
    // npm startet per "#!/usr/bin/env node" und npm-Skripte rufen "node" auf: PHP-FPM hat /usr/local/bin oft nicht im PATH.
    $fullCommand = 'export PATH=' . escapeshellarg(dirname(NODE_BIN) . ':/usr/bin:/bin') . ' && cd ' . escapeshellarg($cwd) . ' && ' . $command . ' 2>&1';
    $output = [];
    $exitCode = 0;
    exec($fullCommand, $output, $exitCode);
    return [
        'cwd' => $cwd,
        'command' => $command,
        'stdout' => trim(implode("\n", $output)),
        'exitCode' => $exitCode,
    ];
}

function respond(int $statusCode, array $payload): never
{
    if ($statusCode >= 400) {
        logWebhookError($statusCode, $payload);
    }
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
    exit;
}

function logWebhookError(int $statusCode, array $payload): void
{
    $context = [
        'timestamp' => gmdate('c'),
        'statusCode' => $statusCode,
        'method' => $_SERVER['REQUEST_METHOD'] ?? '',
        'uri' => $_SERVER['REQUEST_URI'] ?? '',
        'remoteAddr' => $_SERVER['REMOTE_ADDR'] ?? '',
        'event' => $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '',
        'payload' => $payload,
    ];

    $encoded = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($encoded)) {
        $encoded = json_encode([
            'timestamp' => gmdate('c'),
            'statusCode' => $statusCode,
            'message' => 'Failed to encode webhook error payload.',
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    if (!is_string($encoded)) {
        return;
    }

    @file_put_contents(ERROR_LOG_FILE, $encoded . "\n", FILE_APPEND | LOCK_EX);
}