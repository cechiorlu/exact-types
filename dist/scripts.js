'use strict';
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
async function getDependencyReleaseDate(packageName, version) {
  let releaseLog, releaseDate;
  const { stdout, stderr } = await exec(`npm view ${packageName} time --json`);
  if (stderr) {
    console.error(stderr);
    return;
  }
  releaseLog = await JSON.parse(stdout);
  releaseDate = new Date(releaseLog[version]);
  return releaseDate;
}
async function getExactTypesPackage(packageName, packageReleaseDate) {
  let releaseLog, typesVersion;
  let typesPackage = `@types/${packageName}`;
  console.log(typesPackage);
  try {
    const response = await axios_1.default.get(`https://registry.npmjs.org/@types%2f${packageName}`);
    if (response.status === 200) {
      releaseLog = response.data.time;
      typesVersion = getClosestPackageVersion(packageReleaseDate, releaseLog);
      return { typesPackage, typesVersion };
    }
  } catch (error) {}
  return;
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
async function updateDevDependencies(typesPackage, typesVersion) {
  try {
    let devDependencies;
    const packageData = await (0, promises_1.readFile)('package.json', 'utf-8');
    const packageJSON = await JSON.parse(packageData);
    devDependencies = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.devDependencies;
    devDependencies[typesPackage] = typesVersion;
    await (0, promises_1.writeFile)('package.json', packageJSON, 'utf-8');
  } catch (err) {
    console.log(err);
  }
}
process.on('message', async ({ packageName, packageVersion }) => {
  const releaseDate = await getDependencyReleaseDate(packageName, packageVersion);
  const typesData = releaseDate && (await getExactTypesPackage(packageName, releaseDate));
  if (typesData) {
    const { typesPackage, typesVersion } = typesData;
    await updateDevDependencies(typesPackage, typesVersion);
    if (process.send) {
      process.send({ typesPackage, typesVersion });
    }
  }
  process.exit();
});
