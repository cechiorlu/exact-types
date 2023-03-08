import { exec as ex } from "child_process";
import util from "util";

const exec = util.promisify(ex);

async function getDependencyReleaseDate(packageName: string, version: string) {
  let releaseLog, releaseDate;
  // Get version release dates for packages
  const { stdout, stderr } = await exec(`npm view ${packageName} time --json`);
  releaseLog = await JSON.parse(stdout);
  releaseDate = new Date(releaseLog[version]);

  return { releaseDate, stderr };
}

process.on("message", async (msg: { message: string }) => {
  const packageName = msg?.message?.split(":")[0];
  const version = msg?.message?.split(":")[1];
  const response = await getDependencyReleaseDate(packageName, version);
  if (process.send){
    process.send({ response });
  }
});
