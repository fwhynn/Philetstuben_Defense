/* Transitional Node entry point for the existing script modules. No DOM stubs,
 * storage, renderer, browser controller or duplicate game rules. Each call gets
 * its own catalog context until the legacy modules migrate to native imports.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const classesDir = path.join(__dirname, 'classes');
module.exports = function loadCore() {
  const context = vm.createContext({});
  for (const name of ['random', 'biomes', 'data', 'map', 'heroes', 'waves', 'exploration', 'placement-commands', 'run-flow', 'run-session', 'buildings', 'tower-commands', 'deck', 'rewards', 'combat', 'run-runtime', 'run-snapshot', 'duo-session']) {
    vm.runInContext(fs.readFileSync(path.join(classesDir, name + '.js'), 'utf8'), context, { filename: name + '.js' });
  }
  return vm.runInContext('({runtime:HexRunRuntime,snapshot:HexRunSnapshot,random:HexRandom,data:HexData,map:HexMap,exploration:HexExploration,waves:HexWaves,rewards:HexRewards,towers:HexTowerCommands,placement:HexPlacementCommands,duo:HexDuoSession,session:HexRunSession,flow:HexRunFlow,buildings:HexBuildings})', context);
};
