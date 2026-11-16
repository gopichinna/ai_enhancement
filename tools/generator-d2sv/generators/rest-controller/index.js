/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete");

module.exports = class extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.skipIntro = opts.skipIntro;
    this.prompts = _.clone(opts.prompts || {});
    this.selfInvocation = _.isEmpty(this.prompts);
  }
  async initializing() {
    await super.initializing();
  }
  async prompting() {
    if (Object.keys(this.pluginMap).length) {
      if (this.selfInvocation) {
        let prompts = [ {
          type: "list",
          name: "plugin",
          message: "Select plugin to add REST support:",
          choices: _.values(this.pluginMap).map(p => ({
            name: `${p.desc || p.name} (${p.name})`,
            value: p.name
          }))
        }, {
          type: "input",
          name: "controllerGroupName",
          message: "Group name of controller(the URL part right after repo name):",
          validate: (value, answers) => {
            if (!_.isEmpty(value) && !this._validateName(value)) {
              return `Can only have alpha-numeric characters along with '_' & '-'`;
            }
            return true;
          }
        }, {
          type: "input",
          name: "controllerEndpointName",
          message: "Endpoint name of controller(the URL part right after group name):",
          validate: (value, answers) => {
            if (_.isEmpty(value)) {
              if (!answers["controllerGroupName"]) {
                return `Can not be empty since 'controllerGroupName' is empty`;
              }
            } else {
              if (!this._validateName(value)) {
                return `Can only have alpha-numeric characters along with '_' & '-'`;
              }
            }
            return true;
          }
        }, {
          type: "input",
          name: "controllerServiceName",
          message: "Service name to use against the controller:",
          default: answers => {
            return this._calculateServiceName(answers["controllerEndpointName"] || answers["controllerGroupName"]);
          },
          validate: (value, answers) => {
            if (!_.isEmpty(value) && !this._validateName(value)) {
              return `Can only have alpha-numeric characters along with '_' & '-'`;
            }
            return true;
          }
        } ];
        let answers = await this.prompt(prompts);
        _.extend(this.prompts, answers);
      }
    }
  }
  _validateName(value) {
    return /^[0-9a-zA-Z_-]+$/.test(value);
  }
  _calculateServiceName(value) {
    const parts = value.split(/\W/);
    let serviceName = _.chain(parts).map(part => part.charAt(0).toUpperCase() + part.substring(1)).reduce((memo, part) => memo + part, "").value();
    return serviceName;
  }
  writing() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    let module = this.pluginMap[this.prompts["plugin"]].module;
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:add-rest-controller", `-Dmodule=${module}`, `-DcontrollerGroupName=${this.prompts["controllerGroupName"]}`, `-DcontrollerEndpointName=${this.prompts["controllerEndpointName"]}`, `-DcontrollerServiceName=${this.prompts["controllerServiceName"]}` ];
    this.spawnCommandSync("mvn", options);
  }
  end() {
    if (!this.selfInvocation) {
      return;
    }
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("Please create a plugin project first")));
      return;
    }
    this.log(yosay(`Added D2-REST controller to ${chalk.greenBright(this.prompts["plugin"])}.`));
  }
};