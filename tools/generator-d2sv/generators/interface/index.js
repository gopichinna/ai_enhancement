/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const Generator = require("yeoman-generator");

const chalk = require("chalk");

const fs = require("fs");

const path = require("path");

const yosay = require("yosay");

const _ = require("../../shared/lodash-complete");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }
  initializing() {
    const selfDirName = path.basename(__dirname);
    const genRootDir = path.resolve(path.join(this.templatePath(), "../.."));
    const files = fs.readdirSync(genRootDir), generatorsMap = {};
    files.forEach(file => {
      if (file !== selfDirName) {
        const iJsonPath = path.join(genRootDir, file, "interface.json");
        if (fs.existsSync(iJsonPath) && fs.statSync(iJsonPath).isFile()) {
          try {
            const iJSON = this.fs.readJSON(iJsonPath);
            const desc = iJSON.description;
            if (_.isString(desc) && !_.isEmpty(desc) && iJSON.skipListing !== true) {
              iJSON.id = file;
              generatorsMap[file] = iJSON;
            }
          } catch (e) {}
        }
      }
    });
    this.generatorsMap = generatorsMap;
  }
  async prompting() {
    this.log(yosay(`${chalk.greenBright("Welcome!")} I am your assistant in this workspace.`));
    let prompts = [ {
      type: "list",
      name: "genId",
      message: "What would you like to do?",
      choices: _.values(this.generatorsMap).map(g => ({
        name: g.description,
        value: g.id
      })).concat([ {
        name: "Nothing!",
        value: "quit"
      } ])
    } ];
    this.prompts = await this.prompt(prompts);
  }
  default() {
    const genId = this.prompts["genId"];
    if (genId !== "quit") {
      this.composeWith(require.resolve(`../${genId}`), {
        skipIntro: true
      });
    }
  }
  end() {
    if (this.prompts["genId"] === "quit") {
      this.log(yosay(`${chalk.greenBright("Bye bye!")}`));
    }
  }
};