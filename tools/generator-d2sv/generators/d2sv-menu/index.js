/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete"), menuToolbars = {
  MenuContext: {
    name: "Doclist",
    anchor: "menuToolsMassUpdate"
  },
  MenuNewObject: {
    name: "New object",
    anchor: "menuNewObjNewCabinet"
  },
  MenuUser: {
    name: "User profile",
    anchor: "menuHelpAbout"
  },
  MenuContextVD: {
    name: "Virtual documents",
    anchor: "menuContextSVVDRemoveChild"
  },
  MenuContextTasksList: {
    name: "Task list",
    anchor: "menuContextAbortWorkflow"
  },
  MenuContextWorkflowOverview: {
    name: "Workflow list",
    anchor: "menuContextAbortWorkflow"
  },
  MenuContextTaskDocument: {
    name: "Task/Workflow attachments",
    anchor: "menuContextCancelCheckout"
  },
  MenuContextDetailRelations: {
    name: "Relation list",
    anchor: "menuContextRelationsDestroy"
  },
  MenuContextDetailRenditions: {
    name: "Rendition list",
    anchor: "menuContextRenditionsExport"
  },
  MenuContextDetailVersions: {
    name: "Version list",
    anchor: "menuContextProperties"
  },
  MenuContextCollection: {
    name: "Collections",
    anchor: "menuContextCollection"
  },
  MenuContextCollectionItems: {
    name: "Collection items action toolbar",
    anchor: "menuContextCollectionItems"
  }
}, menuDynamicActionTypes = {
  U4Generic: {
    name: "Calling service's method"
  },
  U4ShowDialog: {
    name: "Show dialog"
  }
};

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
          message: "Select plugin to add new menu:",
          choices: _.values(this.pluginMap).map(p => ({
            name: `${p.desc || p.name} (${p.name})`,
            value: p.name
          }))
        }, {
          type: "input",
          name: "menuId",
          message: "Id for the menu:",
          validate: value => {
            if (_.isEmpty(value)) {
              return `Can't be empty`;
            }
            return true;
          }
        }, {
          type: "input",
          name: "menuLabel",
          message: "Label for the menu:",
          default: answers => {
            return answers["menuId"];
          },
          validate: value => {
            if (_.isEmpty(value)) {
              return `Can't be empty`;
            }
            return true;
          }
        }, {
          type: "list",
          name: "menuToolbar",
          message: "Pick a toolbar to add this menu to:",
          choices: _.keys(menuToolbars).map(t => ({
            name: menuToolbars[t].name,
            value: t
          }))
        }, {
          type: "list",
          name: "menuDynamicActionType",
          message: "Select an appropriate menu action:",
          choices: _.keys(menuDynamicActionTypes).map(t => ({
            name: menuDynamicActionTypes[t].name,
            value: t
          }))
        }, {
          type: "input",
          name: "dialogName",
          message: "Specify dialog name:",
          when: answers => {
            return answers["menuDynamicActionType"] === "U4ShowDialog";
          },
          validate: value => {
            if (!this._validateJavaClassName(value)) {
              return `Dialog class name should start with uppercase letter and can have only alpha-numeric characters`;
            }
            return true;
          }
        }, {
          type: "confirm",
          name: "createSampleDialog",
          message: "Create sample dialog class and definition file ?",
          when: answers => {
            return answers["menuDynamicActionType"] === "U4ShowDialog";
          },
          default: false
        }, {
          type: "input",
          name: "dialogTitle",
          message: "Specify dialog title:",
          when: answers => {
            return answers["createSampleDialog"] === true;
          },
          validate: value => {
            if (_.isEmpty(value)) {
              return `Can't be empty`;
            }
            return true;
          },
          default: answers => {
            return answers["dialogName"];
          }
        }, {
          type: "list",
          name: "dialogFormMode",
          message: "Select form mode for the dialog:",
          choices: [ {
            name: "Editable",
            value: "create"
          }, {
            name: "Read-Only",
            value: "read"
          } ],
          when: answers => {
            return answers["createSampleDialog"] === true;
          }
        }, {
          type: "list",
          name: "dialogViewMode",
          message: "Select view mode for the dialog:",
          choices: [ {
            name: "Center Panel",
            value: "DIALOG"
          }, {
            name: "Side Panel",
            value: "SIDE_PANEL"
          } ],
          when: answers => {
            return answers["createSampleDialog"] === true;
          }
        }, {
          type: "input",
          name: "eService",
          message: "Specify service name:",
          when: answers => {
            return answers["menuDynamicActionType"] === "U4Generic";
          },
          validate: value => {
            if (!this._validateJavaClassName(value)) {
              return `Service class name should start with uppercase letter and can have only alpha-numeric characters`;
            }
            return true;
          }
        }, {
          type: "input",
          name: "eMethod",
          message: "Specify service method name:",
          when: answers => {
            return answers["menuDynamicActionType"] === "U4Generic";
          },
          validate: value => {
            if (!this._validateMethodName(value)) {
              return `Service method name should start with lowercase letter and can have only alpha-numeric characters`;
            }
            return true;
          }
        }, {
          type: "confirm",
          name: "createSampleService",
          message: "Create sample service class with method ?",
          when: answers => {
            return answers["menuDynamicActionType"] === "U4Generic";
          },
          default: false
        }, {
          type: "list",
          name: "eMode",
          message: "Specify selection:",
          choices: [ {
            name: "",
            value: ""
          }, {
            name: "Single",
            value: "SINGLE"
          }, {
            name: "Multiple",
            value: "MULTI"
          } ],
          when: answers => {
            return answers["menuDynamicActionType"] === "U4Generic";
          }
        }, {
          type: "list",
          name: "rType",
          message: "Specify return type:",
          choices: [ {
            name: "",
            value: ""
          }, {
            name: "Javascript",
            value: "JS"
          } ],
          when: answers => {
            return answers["menuDynamicActionType"] === "U4Generic";
          }
        }, {
          type: "input",
          name: "rAction",
          message: "Specify return action:",
          when: answers => {
            return answers["menuDynamicActionType"] === "U4Generic";
          },
          validate: (value, answers) => {
            return this._validateRActionName(value, answers);
          }
        }, {
          type: "confirm",
          name: "createSampleCallbackJS",
          message: "Create sample javascript file with callback function ?",
          when: answers => {
            return answers["rType"] === "JS" && answers["rAction"];
          },
          default: false
        }, {
          type: "list",
          name: "menuSelectionMode",
          message: "Specify selection mode for the menu:",
          choices: [ {
            name: "Single",
            value: "false"
          }, {
            name: "Multiple",
            value: "true"
          } ]
        } ];
        let answers = await this.prompt(prompts);
        _.extend(this.prompts, answers);
      }
    }
  }
  _validateJavaClassName(value) {
    if (value.length === 0) {
      return false;
    }
    return value.length === 1 && /^[A-Z]/.test(value) || /^[A-Z][0-9a-zA-Z]+$/.test(value);
  }
  _validateMethodName(value) {
    if (value.length === 0) {
      return false;
    }
    return value.length === 1 && /^[a-z]/.test(value) || /^[a-z][0-9a-zA-Z]+$/.test(value);
  }
  _validateRActionName(value, answers) {
    if (answers["rType"] === "JS" && value) {
      if (value.indexOf(":") === -1) {
        return `Specify javascript file name and callback function name seperated by colon`;
      }
      if (value.split(":")[0] !== value.split(":")[0].toLowerCase()) {
        return `Javascript file name should be in lowercase`;
      }
      if (!this._validateMethodName(value.split(":")[1])) {
        return `Callback function name should start with lowercase and can contain only`;
      }
    }
    return true;
  }
  writing() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    let module = this.pluginMap[this.prompts["plugin"]].module;
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:add-d2sv-menu", `-Dmodule=${module}`, `-DmenuId=${this.prompts["menuId"]}`, `-DmenuLabel=${this.prompts["menuLabel"]}`, `-DmenuToolbar=${this.prompts["menuToolbar"]}`, `-DmenuAnchor=${menuToolbars[this.prompts["menuToolbar"]].anchor}`, `-DmenuDynamicActionType=${this.prompts["menuDynamicActionType"]}`, `-DmenuSelectionMode=${this.prompts["menuSelectionMode"]}` ];
    switch (this.prompts["menuDynamicActionType"]) {
     case "U4Generic":
      options.push(`-DcreateSampleService=${this.prompts[`createSampleService`]}`);
      options.push(`-DeService=${this.prompts["eService"]}`);
      options.push(`-DeMethod=${this.prompts["eMethod"]}`);
      options.push(`-DeMode=${this.prompts["eMode"]}`);
      options.push(`-DrType=${this.prompts["rType"]}`);
      options.push(`-DrAction=${this.prompts["rAction"]}`);
      options.push(`-DcreateSampleCallbackJS=${this.prompts["createSampleCallbackJS"]}`);
      if (this.prompts["createSampleCallbackJS"] === true) {
        this.composeWith(require.resolve("../d2sv-menu-writer"), {
          prompts: this.prompts
        });
      }
      break;

     case "U4ShowDialog":
      options.push(`-DdialogName=${this.prompts["dialogName"]}`);
      if (this.prompts["createSampleDialog"] === true) {
        options.push(`-DcreateSampleDialog=${this.prompts[`createSampleDialog`]}`);
        options.push(`-DdialogTitle=${this.prompts["dialogTitle"]}`);
        options.push(`-DdialogFormMode=${this.prompts["dialogFormMode"]}`);
        options.push(`-DdialogViewMode=${this.prompts["dialogViewMode"]}`);
      }
      break;
    }
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
    this.log(yosay(`Added new menu to ${chalk.greenBright(this.prompts["plugin"])}.`));
  }
};