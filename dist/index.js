#! /usr/bin/env node
'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const path_1 = __importDefault(require('path'));
const promises_1 = require('fs/promises');
const child_process_1 = require('child_process');
const inquirer_1 = __importDefault(require('inquirer'));
const packageManagerOptions = ['npm', 'yarn', 'pnpm', 'bower'];
const defaultPackageManager = 'npm';
let dependencies, devDependencies;
(() =>
  __awaiter(void 0, void 0, void 0, function* () {
    const packageData = yield (0, promises_1.readFile)('package.json', 'utf-8');
    const packageJSON = yield JSON.parse(packageData);
    dependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.dependencies;
    devDependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.devDependencies;
    const useDefault = process.argv[2] === '-y';
    const { packageManager } = useDefault
      ? defaultPackageManager
      : yield inquirer_1.default.prompt([
          {
            type: 'list',
            message: 'Pick your package manager:',
            name: 'packageManager',
            choices: packageManagerOptions,
          },
        ]);
    const hasDevDependencies = !!(devDependencies && Object.keys(devDependencies).length);
    if (!hasDevDependencies) {
      packageJSON['devDependencies'] = {};
      let packageData = JSON.stringify(packageJSON);
      yield (0, promises_1.writeFile)('package.json', packageData, 'utf-8');
    }
    for (let dependency in dependencies) {
      if (!dependency.includes('@')) {
        let packageVersion = dependencies[dependency].replace('~', '').replace('^', '');
        const forked = (0, child_process_1.fork)(path_1.default.resolve(__dirname, './scripts.js'));
        forked.send({ packageName: dependency, packageVersion });
        forked.on('message', ({ typesPackage, typesVersion }) =>
          __awaiter(void 0, void 0, void 0, function* () {
            console.log(`- ${typesPackage}:${typesVersion} successfully added`);
          })
        );
      }
    }
    let command = 'install';
    if (packageManager === 'yarn') {
      command = 'add';
    }
    const install = (0, child_process_1.spawn)(packageManager, [command]);
    install.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    install.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    install.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }))();
