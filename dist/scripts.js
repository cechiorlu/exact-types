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
const child_process_1 = require('child_process');
const util_1 = __importDefault(require('util'));
const axios_1 = __importDefault(require('axios'));
const promises_1 = require('fs/promises');
const exec = util_1.default.promisify(child_process_1.exec);
function getDependencyReleaseDate(packageName, version) {
  return __awaiter(this, void 0, void 0, function* () {
    let releaseLog, releaseDate;
    const { stdout, stderr } = yield exec(`npm view ${packageName} time --json`);
    if (stderr) {
      console.error(stderr);
      return;
    }
    releaseLog = yield JSON.parse(stdout);
    releaseDate = new Date(releaseLog[version]);
    return releaseDate;
  });
}
function getExactTypesPackage(packageName, packageReleaseDate) {
  return __awaiter(this, void 0, void 0, function* () {
    let releaseLog, typesVersion;
    let typesPackage = `@types/${packageName}`;
    try {
      const response = yield axios_1.default.get(`https://registry.npmjs.org/@types%2f${packageName}`);
      if (response.status === 200) {
        releaseLog = response.data.time;
        typesVersion = getClosestPackageVersion(packageReleaseDate, releaseLog);
        return { typesPackage, typesVersion };
      }
    } catch (error) {}
    return;
  });
}
function getClosestPackageVersion(date, packageVersions) {
  let closestVersion = null;
  let closestDateDiff = null;
  for (const version in packageVersions) {
    const versionDate = new Date(packageVersions[version]);
    const dateDiff = Math.abs(date.getTime() - versionDate.getTime());
    if (closestDateDiff === null || dateDiff < closestDateDiff) {
      closestVersion = version;
      closestDateDiff = dateDiff;
    }
  }
  if (closestVersion === null || closestVersion === 'created') {
    throw new Error('No package versions found');
  }
  if (closestVersion === 'modified') {
    closestVersion = 'latest';
  }
  return closestVersion;
}
function updateDevDependencies(typesPackage, typesVersion) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      let devDependencies;
      const packageData = yield (0, promises_1.readFile)('package.json', 'utf-8');
      const packageJSON = yield JSON.parse(packageData);
      devDependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.devDependencies;
      devDependencies[typesPackage] = typesVersion;
      const updatedPackageData = JSON.stringify(packageJSON);
      yield (0, promises_1.writeFile)('package.json', updatedPackageData, 'utf-8');
    } catch (err) {
      console.log(err);
    }
  });
}
process.on('message', ({ packageName, packageVersion }) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const releaseDate = yield getDependencyReleaseDate(packageName, packageVersion);
    const typesData = releaseDate && (yield getExactTypesPackage(packageName, releaseDate));
    if (typesData) {
      const { typesPackage, typesVersion } = typesData;
      if (typesPackage && typesVersion) {
        yield updateDevDependencies(typesPackage, typesVersion);
      }
      if (process.send) {
        process.send({ typesPackage, typesVersion });
      }
    }
    process.exit();
  })
);
