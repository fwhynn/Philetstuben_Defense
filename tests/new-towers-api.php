<?php
// Pure account schema check; no database, credentials, real save or network.
declare(strict_types=1);
require ($argv[1] ?? dirname(__DIR__,2).'/api.autohextd').'/classes/SaveValidator.php';
$save=json_decode(file_get_contents($argv[2]),false,512,JSON_THROW_ON_ERROR);
Autohextd\Api\SaveValidator::validate($save);
foreach($save->profile->unlocks as $unlock){
    $parts=explode(':',$unlock);if(count($parts)!==3||$parts[0]!=='ultimate')continue;
    $variant=unserialize(serialize($save));$variant->profile->activeUltimates->{$parts[1]}=$parts[2];
    Autohextd\Api\SaveValidator::validate($variant);
}
foreach($save->profile->activeUltimates as $type=>$branch){
    $bad=unserialize(serialize($save));$bad->profile->activeUltimates->$type='unknownBranch';
    try {Autohextd\Api\SaveValidator::validate($bad);throw new RuntimeException('Accepted invalid branch: '.$type);}catch(InvalidArgumentException $expected){}
}
echo 'PASS all seven account tower selections, 14 unlocks, and invalid branch rejection'.PHP_EOL;
