'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const child_process_1 = require('child_process');
const util_1 = __importDefault(require('util'));
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
  const { stdout, stderr } = await exec(`npm view ${typesPackage} time --json`);
  if (stderr) {
    console.error(stderr);
    return;
  }
  releaseLog = await JSON.parse(stdout);
  typesVersion = getClosestPackageVersion(packageReleaseDate, releaseLog);
  return { typesPackage, typesVersion };
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
process.on('message', async ({ packageName, packageVersion }) => {
  const releaseDate = await getDependencyReleaseDate(packageName, packageVersion);
  const typesData = releaseDate && (await getExactTypesPackage(packageName, releaseDate));
  if (process.send && (typesData === null || typesData === void 0 ? void 0 : typesData.typesVersion)) {
    process.send(typesData);
  }
});
