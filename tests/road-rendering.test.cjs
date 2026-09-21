const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

test('procedural rescue roads face upwards on every possible edge combination', () => {
  const source = fs.readFileSync(path.join(__dirname, '../classes/three-renderer.js'), 'utf8');
  // Exercise the actual mesh builder without WebGL or a browser.
  const context = {
    THREE: {
      BufferGeometry: class { setAttribute(name, value) { this[name] = value; } setIndex(value) { this.indices = value; } computeVertexNormals() { } },
      Float32BufferAttribute: class { constructor(values) { this.array = values; } },
      Mesh: class { constructor(geometry) { this.geometry = geometry; } }
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/map.js'), 'utf8'), context);
  vm.runInNewContext(source.slice(source.indexOf('  function ribbon('), source.indexOf('  function tileSpec(')) + ';globalThis.build=ribbon;globalThis.map=HexMap;', context);
  for (let mask = 1; mask < 64; mask++) {
    const roads = Array.from({ length: 6 }, (_, i) => i).filter(i => mask & (1 << i));
    for (const points of context.map.roadGeometry({ q: 0, r: 0, type: 'rescue', roads }).legs.values()) {
      const { position, indices } = context.build(points, {}).geometry, p = position.array;
      for (let i = 0; i < indices.length; i += 3) {
        const [a, b, c] = indices.slice(i, i + 3).map(index => p.slice(index * 3, index * 3 + 3));
        const normalY = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
        assert.ok(normalY > 0, `road mask ${mask}: triangle must face the camera above the board`);
      }
    }
  }
});
