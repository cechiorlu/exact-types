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
async function getExactTypessPackage(packageName, packageReleaseDate) {
  let releaseLog, typesVersion;
  let typesPackage = `@types/${packageName}`;
  const { stdout, stderr } = await exec(`npm view ${typesPackage} time --json`);
  if (stderr) {
    console.error(stderr);
    return;
  }
  releaseLog = await JSON.parse(stdout);
  typesVersion = getClosestPackageVersion(packageReleaseDate, releaseLog);
  typesPackage += `@${typesVersion}`;
  return typesPackage;
}
async function installPackage(packageName, packageManager) {
  let command = 'install',
    done = false;
  if (packageManager === 'yarn') {
    command = 'add';
  }
  if (packageName.includes('@types/typescript')) {
    done = true;
    return;
  }
  const installProcess = (0, child_process_1.spawn)(packageManager, [command, '-D', packageName]);
  installProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  installProcess.stderr.on('data', (data) => {
    done = true;
    console.error(`stderr: ${data}`);
  });
  installProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    done = true;
  });
  return done;
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
process.on('message', async ({ packageName, packageVersion, packageManager }) => {
  const releaseDate = await getDependencyReleaseDate(packageName, packageVersion);
  const typesPackage = releaseDate && (await getExactTypessPackage(packageName, releaseDate));
  const done = typesPackage && installPackage(typesPackage, packageManager);
  if (done) process.exit();
});
