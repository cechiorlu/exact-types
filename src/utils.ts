import { exec as ex } from 'child_process';
import { PackageManager } from 'src';
import util from 'util';

const exec = util.promisify(ex);

type PackageVersions = {
  [version: string]: string;
}

async function getDependencyReleaseDate(packageName: string, version: string) {
  let releaseLog, releaseDate;
  // Get version release dates for packages
  const { stdout, stderr } = await exec(`npm view ${packageName} time --json`);
  if (stderr) {
    console.error(stderr);
    return;
  }
  releaseLog = await JSON.parse(stdout);
  releaseDate = new Date(releaseLog[version]);

  return releaseDate;
}

async function getTypesVersion(packageName: string, packageReleaseDate: Date) {
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

async function installPackage(packageName: string, packageManager: PackageManager) {
  let installCommand;

  switch (packageManager) {
    case 'bit':
      installCommand = 'bit install -D';
      break;
    case 'npm':
      installCommand = 'npm install -D';
      break;
    case 'pnpm':
      installCommand = 'pnpm install -D';
      break;
    case 'yarn':
      installCommand = 'yarn add -D';
      break;
    default:
      installCommand = 'npm install -D';
  }

  console.log('Starting Process...');
  console.log(installCommand + ' ' + packageName);
  console.log('installing ' + packageName);
}

function getClosestPackageVersion (date: Date, packageVersions: PackageVersions ){
  let closestVersion: string | null = null;
  let closestDateDiff: number | null = null;

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

  if(closestVersion === 'modified'){
    closestVersion = 'latest'
  }

  return closestVersion;
}

process.on('message', async ({ message, packageManager }: { message: string; packageManager: PackageManager }) => {
  const packageName = message.split(':')[0];
  const version = message.split(':')[1];
  const releaseDate = await getDependencyReleaseDate(packageName, version);
  const typesPackage = releaseDate && (await getTypesVersion(packageName, releaseDate));
  const response = typesPackage && (await installPackage(typesPackage, packageManager));

  if (process.send) {
    process.send({ response });
  }
  process.exit();
});
