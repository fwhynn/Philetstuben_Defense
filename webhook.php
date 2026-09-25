<?php
declare(strict_types=1);

const REPO_ROOT = __DIR__;
const APP_ROOT = __DIR__;
const REMOTE_NAME = 'origin';
const SECRET_FILE = REPO_ROOT . '/.deploy-webhook-secret';
const LOCK_FILE = '/tmp/autohextd-tag-webhook.lock';
const WEBHOOK_LOG_FILE = APP_ROOT . '/webhook.log';
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
            'message' => 'Send a signed GitHub tag-push webhook via POST to deploy.',
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
        // ignore non-tag pushes without writing to the deploy log
        http_response_code(202);
        echo json_encode(['ok' => true, 'message' => 'Ignored non-tag push', 'event' => $event], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
        exit;
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

    // Start a human-readable chapter for this tag
    try {
        appendWebhookLog('info', 'New Tag', ['tag' => $tag, 'actor' => $actor]);
    } catch (Throwable $_) {
        // ignore logging failures
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

        // Repos on server are kept on `main`; just pull latest
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
        try {
            appendWebhookLog('error', "STEP FAILED: $command", $result);
        } catch (Throwable $_) {
            // ignore
        }
        respond(500, [
            'ok' => false,
            'message' => $failureMessage,
            'command' => $result,
        ]);
    }
    try {
        appendWebhookLog('info', "STEP OK: $command", $result);
    } catch (Throwable $_) {
        // ignore
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
    $result = [
        'cwd' => $cwd,
        'command' => $command,
        'stdout' => trim(implode("\n", $output)),
        'exitCode' => $exitCode,
    ];

    try {
        appendWebhookLog('debug', 'command', $result);
    } catch (Throwable $_) {
        // ignore
    }

    return $result;
}

function appendWebhookLog(string $level, string $message, $data = null): void
{
    // Special: when starting a new tag chapter
    if ($message === 'New Tag' && is_array($data) && isset($data['tag'])) {
        $header = [];
        $header[] = str_repeat('=', 62);
        $header[] = date('Y-m-d H:i:s');
        $header[] = sprintf('New Tag %s', $data['tag']);
        $header[] = '';
        @file_put_contents(WEBHOOK_LOG_FILE, implode("\n", $header) . "\n", FILE_APPEND | LOCK_EX);
        return;
    }

    // Default: write an action block in the requested compact format
    $lines = [];
    // Action name
    $lines[] = sprintf('- Action: %s', $message);

    // Command (if available)
    if (is_array($data) && isset($data['command'])) {
        $lines[] = sprintf('- Command: %s', $data['command']);
    }

    // Output
    $lines[] = '- Output:';
    $lines[] = '';
    if (is_array($data) && isset($data['stdout'])) {
        $outLines = explode("\n", (string) $data['stdout']);
        foreach ($outLines as $ol) {
            $lines[] = $ol;
        }
    } elseif (is_string($data) || is_numeric($data)) {
        $lines[] = (string) $data;
    } elseif (is_array($data)) {
        $lines[] = trim(print_r($data, true));
    } elseif ($data !== null) {
        $lines[] = trim(print_r($data, true));
    }

    $lines[] = "\n";
    @file_put_contents(WEBHOOK_LOG_FILE, implode("\n", $lines), FILE_APPEND | LOCK_EX);
}

function respond(int $statusCode, array $payload): never
{
    // always append to human-readable webhook log
    try {
        appendWebhookLog($statusCode >= 400 ? 'error' : 'info', 'respond', ['status' => $statusCode, 'payload' => $payload]);
    } catch (Throwable $_) {
        // ignore
    }
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
    exit;
}

