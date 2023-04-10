#! /usr/bin/env node
'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const inquirer_1 = __importDefault(require('inquirer'));
const path_1 = __importDefault(require('path'));
const promises_1 = require('fs/promises');
const child_process_1 = require('child_process');
let dependencies;
const packageManagerOptions = ['npm', 'yarn', 'pnpm', 'bower'];
const defaultPackageManager = 'npm';
(async () => {
  const packageData = await (0, promises_1.readFile)('package.json', 'utf-8');
  const packageJSON = await JSON.parse(packageData);
  dependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.dependencies;
  const packageTypes = {};
  const useDefault = process.argv[2] === '-y';
  const { packageManager } = useDefault
    ? defaultPackageManager
    : await inquirer_1.default.prompt([
        {
          type: 'list',
          message: 'Pick your package manager:',
          name: 'packageManager',
          choices: packageManagerOptions,
        },
      ]);
  for (let dependency in dependencies) {
    if (!dependency.includes('@')) {
      let packageVersion = dependencies[dependency].replace('~', '').replace('^', '');
      const forked = (0, child_process_1.fork)(path_1.default.resolve(__dirname, './scripts.js'));
      forked.send({ packageName: dependency, packageVersion, packageManager });
      forked.on('message', async ({ typesPackage, typesVersion }) => {
        packageTypes[typesPackage] = typesVersion;
      });
    }
  }
  console.log(packageTypes);
})();
