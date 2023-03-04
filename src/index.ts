#!/usr/bin/env node
// import inquirer from "inquirer";
// import path from "path";
import { readFile } from "fs/promises";

let dependencies;

(async () => {
  console.log("starting")
  const packageData = await readFile('package.json', 'utf-8');
  const packageJSON = JSON.parse(packageData);
  dependencies = packageJSON.dependencies;
})();