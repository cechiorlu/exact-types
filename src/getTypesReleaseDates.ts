// import { exec as ex, spawn } from 'child_process';
// import { PackageManager } from 'src';
// import util from 'util';

// const exec = util.promisify(ex);

// async function getTypesReleaseDate(packageName: string, version: string, packageManager: PackageManager) {
//   // check types for package,
//   // check for match release date
//   let releaseLog, releaseDate;
//   // Get version release dates for packages
//   const { stdout, stderr } = await exec(`npm view ${packageName} time --json`);
//   releaseLog = await JSON.parse(stdout);
//   releaseDate = new Date(releaseLog[version]);

//   return { releaseDate, stderr };
// }



