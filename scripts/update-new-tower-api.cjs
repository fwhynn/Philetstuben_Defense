// Apply the matching account-validator catalog update to the companion API repo.
const fs=require('node:fs'),path=require('node:path');
const root=process.argv[2];if(!root)throw Error('API repository path required');
const file=path.join(root,'classes/SaveValidator.php');let source=fs.readFileSync(file,'utf8');
const anchor="'necromancer'=>['soulChoir','soulKeeper']";
const added=",'gravity'=>['gravityWell','gravityResonator'],'wind'=>['windCannon','windGuide'],'poison'=>['poisonThorn','poisonSpore'],'meteor'=>['meteorCaller','meteorEmber'],'laser'=>['laserFocus','laserSplitter'],'gamble'=>['gambleLoaded','gambleHigh'],'portal'=>['portalReturn','portalTime']";
if(!source.includes(anchor))throw Error('Validator catalog differs; review before editing');
if(!source.includes(added)){source=source.replace(anchor,anchor+added);fs.writeFileSync(file,source);}
console.log('Account validator recognizes all 14 new ultimate branches.');
