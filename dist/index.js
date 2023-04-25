#! /usr/bin/env node
'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const path_1 = __importDefault(require('path'));
const promises_1 = require('fs/promises');
const child_process_1 = require('child_process');
let dependencies, devDependencies;
(async () => {
  const packageData = await (0, promises_1.readFile)('package.json', 'utf-8');
  const packageJSON = await JSON.parse(packageData);
  dependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.dependencies;
  devDependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.devDependencies;
  const hasDevDependencies = !!(devDependencies && Object.keys(devDependencies).length);
  if (!hasDevDependencies) {
    packageJSON['devDependencies'] = {};
  }
  await (0, promises_1.writeFile)('package.json', packageJSON, 'utf-8');
  for (let dependency in dependencies) {
    if (!dependency.includes('@')) {
      let packageVersion = dependencies[dependency].replace('~', '').replace('^', '');
      const forked = (0, child_process_1.fork)(path_1.default.resolve(__dirname, './scripts.js'));
      forked.send({ packageName: dependency, packageVersion });
      forked.on('message', async ({ typesPackage, typesVersion }) => {
        console.log(`- ${typesPackage}:${typesVersion} successfully added`);
      });
    }
  }
})();
