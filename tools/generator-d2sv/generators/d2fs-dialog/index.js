/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
          message: "Select plugin to add new D2FS dialog:",
          choices: _.values(this.pluginMap).map(p => ({
            name: `${p.desc || p.name} (${p.name})`,
            value: p.name
          }))
        }, {
          type: "input",
          name: "dialogName",
          message: "Enter name of the dialog(Should start with uppercase letter and can have only alpha-numeric characters):",
          validate: (value, answers) => {
            if (!this._validateName(value)) {
              return `Should start with uppercase letter and can have only alpha-numeric characters`;
            }
            return true;
          }
        }, {
          type: "input",
          name: "dialogTitle",
          message: "Title of the dialog:",
          validate: (value, answers) => {
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
          } ]
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
          } ]
        }, {
          type: "confirm",
          name: "menuTriggers",
          message: "Create a menu to open the dialog?",
          default: true
        }, {
          type: "input",
          name: "menuLabel",
          message: "Label for the menu:",
          default: answers => {
            return answers["dialogName"];
          },
          when: answers => {
            return answers["menuTriggers"] === true;
          },
          validate: (value, answers) => {
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
          })),
          when: answers => {
            return answers["menuTriggers"] === true;
          }
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
  _validateName(value) {
    if (value.length === 0) {
      return false;
    }
    return value.length === 1 && /^[A-Z]/.test(value) || /^[A-Z][0-9a-zA-Z]+$/.test(value);
  }
  writing() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    let module = this.pluginMap[this.prompts["plugin"]].module;
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:add-d2fs-dialog", `-Dmodule=${module}`, `-DdialogName=${this.prompts["dialogName"]}`, `-DdialogTitle=${this.prompts["dialogTitle"]}`, `-DdialogFormMode=${this.prompts["dialogFormMode"]}`, `-DdialogViewMode=${this.prompts["dialogViewMode"]}` ];
    if (this.prompts["menuTriggers"]) {
      options.push(`-DdialogMenuLabel=${this.prompts["menuLabel"]}`);
      options.push(`-DdialogMenuToolbar=${this.prompts["menuToolbar"]}`);
      options.push(`-DdialogMenuAnchor=${menuToolbars[this.prompts["menuToolbar"]].anchor}`);
      options.push(`-DdialogMenuSelectionMode=${this.prompts["menuSelectionMode"]}`);
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
    this.log(yosay(`Added new D2FS dialog to ${chalk.greenBright(this.prompts["plugin"])}.`));
  }
};