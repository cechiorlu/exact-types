import { exec as ex } from 'child_process';
import { IMessage } from 'src';
import util from 'util';
import axios from 'axios';
import { readFile, writeFile } from 'fs/promises';
import { json } from 'node:stream/consumers';

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

async function getExactTypesPackage(packageName: string, packageReleaseDate: Date) {
  let releaseLog: PackageVersions, typesVersion: string;
  let typesPackage = `@types/${packageName}`;

  console.log(typesPackage);
  // get request for release log
  try {
    const response = await axios.get(`https://registry.npmjs.org/@types%2f${packageName}`);
    if (response.status === 200) {
      releaseLog = response.data.time;
      typesVersion = getClosestPackageVersion(packageReleaseDate, releaseLog);
      return { typesPackage, typesVersion };
    }
  } catch (error) {}
  return;
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

async function updateDevDependencies(typesPackage: string, typesVersion: string) {
  try {
    let devDependencies;
    const packageData = await readFile('package.json', 'utf-8');
    const packageJSON = await JSON.parse(packageData);
    devDependencies = packageJSON?.devDependencies;
    devDependencies[typesPackage] = typesVersion;
    const updatedPackageData = JSON.stringify(packageJSON)
    await writeFile('package.json', updatedPackageData, 'utf-8');
  } catch (err) {
    console.log(err);
  }
}

process.on('message', async ({ packageName, packageVersion }: IMessage) => {
  const releaseDate = await getDependencyReleaseDate(packageName, packageVersion);
  const typesData = releaseDate && (await getExactTypesPackage(packageName, releaseDate));
  if (typesData) {
    const { typesPackage, typesVersion } = typesData;
    if(typesPackage && typesVersion){
      await updateDevDependencies(typesPackage, typesVersion);
    }
    if (process.send) {
      process.send({ typesPackage, typesVersion });
    }
  }
  process.exit();
});
