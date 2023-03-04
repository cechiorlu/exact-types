#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
(async () => {
    console.log("starting");
    const packageData = await (0, promises_1.readFile)('package.json', 'utf-8');
    const packageJSON = JSON.parse(packageData);
    console.log(packageJSON.dependencies);
})();
