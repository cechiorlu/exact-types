import { exec as ex, spawn } from 'child_process';
import { IMessage, PackageManager } from 'src';
import util from 'util';

const exec = util.promisify(ex);

type PackageVersions = {
  [version: string]: string | number | Date;
};

async function getDependencyReleaseDate(packageName: string, version: string) {
  let releaseLog: PackageVersions, releaseDate: Date;
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

async function getExactTypessPackage(packageName: string, packageReleaseDate: Date) {
  let releaseLog: PackageVersions, typesVersion: string;
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
  let command = 'install',
    done = false;

  if (packageManager === 'yarn') {
    command = 'add';
  }

  // lazy workaround, refactor
  if (packageName.includes('@types/typescript')) {
    done = true;
    return;
  }
  const installProcess = spawn(packageManager, [command, '-D', packageName]);

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

function getClosestPackageVersion(date: Date, packageVersions: PackageVersions) {
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

  if (closestVersion === 'modified') {
    closestVersion = 'latest';
  }

  return closestVersion;
}

process.on('message', async ({ packageName, packageVersion, packageManager }: IMessage) => {
  const releaseDate = await getDependencyReleaseDate(packageName, packageVersion);
  const typesPackage = releaseDate && (await getExactTypessPackage(packageName, releaseDate));
  const done = typesPackage && installPackage(typesPackage, packageManager);

  if (done) process.exit();
});
