const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute actual mobile logic; mock only native/network boundaries.
module.exports = function mobileLoader(mocks = {}) {
  const cache = new Map();
  const storage = new Map();
  function load(file) {
    const resolved = [file, file + '.ts', path.join(file, 'index.ts')]
      .find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!resolved) throw new Error('Missing mobile module: ' + file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} }; cache.set(resolved, module);
    const code = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, console,
      require(name) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name === '@react-native-async-storage/async-storage') return {
          getItem: async key => storage.get(key) ?? null,
          setItem: async (key, value) => { storage.set(key, value); },
          removeItem: async key => { storage.delete(key); },
        };
        if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
        throw new Error('Unexpected dependency: ' + name);
      },
    }, { filename: resolved });
    return module.exports;
  }
  return file => load(path.resolve(__dirname, '../../src/system2', file));
};
