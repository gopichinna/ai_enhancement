csui.define('d2/sdk/commands/create.folder.type.filters',[
  'nuc/lib/underscore',
  'd2/commands/create.folder.type.filter',
  'csui-ext!d2/sdk/commands/create.folder.type.filters'
], function(_, folderTypeFilters, extFilters){
  'use strict';

  /**
   * Type filter collection. Defines which Documentum types should be considered while creating a folder.
   *
   * This collection augments the default functionality of `D2-CreateFolder` command.
   *
   * `dm_folder` is the root Documentum type that represents a folder, any sub-type of it can also represent a folder.
   *
   * New types could be introduced by extension
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/create.folder.type.filters": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.folder.type.filter"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.folder.type.filter.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return function(typeData) {
   *      // This is the function that implements a custom filter condition
   *      return typeData.name === 'my_dctm_custom_folder_type';
   *    };
   * });
   *
   * @module {d2/sdk/commands/create.folder.type.filters} d2/sdk/commands/"create.folder.type.filters"
   * @name CreateFolderTypeFilter
   * @extends Object
   *
   */

  if(extFilters) {
    folderTypeFilters.addFilters(_.flatten(extFilters, true));
  }

  /**
   * This is a callback type that implements the condition of a filter.
   *
   * @callback FolderTypeFilterCondition
   * @param {object} typeData - Data representing a Documentum type
   * @param {string} typeData.name - Name of the documentum type
   * @returns {boolean} Should return `true` if the type should be included, `false` otherwise.
   */

  /**
   * @name addFilters
   * @function
   * @memberof module:CreateFolderTypeFilter
   * @description To manually register new type filters without using the 'extension' way.
   * @param {FolderTypeFilterCondition[]} newFilters - Array of callbacks that returns `true` or `false` to include or exclude a type respectively.
   */

  /**
   * @name filter
   * @function
   * @memberof module:CreateFolderTypeFilter
   * @description To retrieve the list of filtered types that can be used while creating a folder.
   * @param {object[]} types - Documentum types.
   * @param {string} types[].name - Name of a Documentum type.
   * @returns {object[]} The filtered types.
   */

  return folderTypeFilters;
});




csui.define('d2/sdk/commands/default.actions.rules',[
  'nuc/lib/underscore',
  'csui/utils/defaultactionitems',
  'csui-ext!d2/sdk/commands/default.actions.rules'
], function(_, defaultActionsRules, extRules){
  'use strict';

  /**
   * Default action rules collection. It is an association of command signatures with predicate conditions
   * such that when a condition is met, a command implementing the corresponding signature is identified as an action.
   * Collectively these set of rules define what happens when end user clicks on an item
   * in a list or tabular display of data. Usually an item indicates with a pointer cursor when a default
   * action is matched against the item.
   *
   * NOTE: Actual availability of a default action for an item depends on matching a rule from this default actions rules collection
   * as well as it depends on actual availability of the command in the item's own action collection.
   *
   * D2SV application runtime pre-defines a bunch of rules that opens a document preview, opens details of a task/workflow
   * etc.
   *
   * One or more rules, to define default action for an item type, could be added to this collection by means of extension
   *
   * @see {@link ../../nuc/models/mixins/rules.matching/rules.matching.mixin|RulesMatchingMixin} for a complete guide on how to write rules.
   *
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/default.actions.rules": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.default.actions.rules"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.default.actions.rules.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {
   *        signature: 'D2-OpenTask', //`signature` from a CommandModel implementation
   *        type: constants.Types.TASK
   *      },
   *      {
   *        signature: 'D2-OpenVDocSnapshot',
   *        decides: function(node) {
   *          return node.get('r_object_type') === 'd2c_snapshot';
   *        }
   *      }
   *    ];
   * });
   *
   *
   * @module {d2/sdk/commands/default.actions.rules} d2/sdk/commands/"default.actions.rules"
   * @name DefaultActionsRules
   * @extends Array
   */

  if (extRules) {
    defaultActionsRules.add(_.flatten(extRules, true));
  }

  return defaultActionsRules;
});



csui.define('d2/sdk/commands/node.actions.rules',[
  'nuc/lib/underscore',
  'd2/commands/node.actions.rules',
  'csui-ext!d2/sdk/commands/node.actions.rules'
],function(_, nodeActionsRules, extRules){
  'use strict';

  var ckBlacklist = _.chain(nodeActionsRules)
    .reject(function(defaultRule){
      return (defaultRule.prioritisePluginImpl === true);
    })
    .map(function(defaultRule){
      return defaultRule.command_key;
    })
    .value();

  /**
   * Action rules collection. Each rule binds a D2SV menu action to a [CommandModel]{@link ./command} by mapping through it's signature.
   * So that when the menu action is selected by end user from a menu toolbar, business logic from the mapped `CommandModel` is executed.
   * If a `NodeModel` is found to have a menu action that is not mapped to any `CommandModel`'s signature, the menu action is ignored.
   *
   * D2SV application runtime pre-defines many such mappings for OOTB business actions.
   *
   * One or more rules, to map new actions, could be added to this collection by means of extension.
   *
   * @see {@link ../../nuc/models/mixins/rules.matching/rules.matching.mixin|RulesMatchingMixin} for a complete guide on how to write rules.
   *
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/node.actions.rules": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.node.actions.rules"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.node.actions.rules.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {
   *        command_key: 'D2-OpenUrl', //`signature` from a CommandModel implementation
   *        equals: {action: 'D2_ACTION_OPEN_URL'},
   *        iconName: 'd2_action_open_url'
   *      },
   *      {
   *        command_key: 'Delete',
   *        decides: function(item) {
   *          return item.action === 'D2_ACTION_EXECUTE_MANAGER' &&
   *            item.actionParameters && item.actionParameters.MANAGER === 'DestroyManager';
   *        },
   *        iconName: 'd2_action_delete' // The icon to use when this action is shown in a toolbar with icon.
   *      }
   *    ];
   * });
   *
   * @module {d2/sdk/commands/node.actions.rules} d2/sdk/commands/"node.actions.rules"
   * @name NodeActionsRules
   * @extends Array
   *
   */

  if(extRules) {
    extRules = _.chain(_.flatten(extRules, true))
      .reject(function(rule){
        return _.includes(ckBlacklist, rule.command_key);
      })
      .sortBy('order')
      .value();

    Array.prototype.unshift.apply(nodeActionsRules, extRules);
  }

  return nodeActionsRules;
});



csui.define('d2/sdk/controls/action.icons/action.icons',[
  'nuc/lib/underscore',
  'smart/controls/icons.v2/icons.v2',
  'csui-ext!d2/sdk/controls/action.icons/action.icons'
], function(_, IconRegistryImpl, extraIcons){
  'use strict';

  if (extraIcons) {
    if (_.isArray(extraIcons)) {
      for (var i = 0; i < extraIcons.length; i++) {
        var iconsMap = extraIcons[i];
        IconRegistryImpl.registerIcons(iconsMap);
      }
    } else {
      IconRegistryImpl.registerIcons(extraIcons);
    }
  }

  /**
   * Action icon registry. Allows registering new action icons through extension.
   * Also provides managed API to look up a registered action icon given its name.
   *
   * New action icons can be registered through extension
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/controls/action.icons/action.icons": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/theme/action.icons"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas action.icons.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return {
   *      'mybundle_action_1': '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2__d2_action_abort_workflow"><path d="M16,30c7.732,0,14-6.268,14-14c0-7.732-6.268-14-14-14C8.268,2,2,8.268,2,16 C2,23.732,8.268,30,16,30z" fill="none" class="csui-icon-v2-state"/><path d="M16,8c-4.418,0-8,3.582-8,8c0,4.418,3.582,8,8,8s8-3.582,8-8C24,11.582,20.418,8,16,8z M9.778,16 c0-3.436,2.786-6.222,6.222-6.222c1.373,0,2.641,0.444,3.67,1.197l-8.695,8.695C10.222,18.641,9.778,17.372,9.778,16z M16,22.222 c-1.423,0-2.734-0.478-3.783-1.281l8.724-8.724c0.804,1.049,1.281,2.36,1.281,3.783C22.222,19.436,19.436,22.222,16,22.222z" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M16,31.5c8.56,0,15.5-6.94,15.5-15.5c0-8.56-6.94-15.5-15.5-15.5C7.44,0.5,0.5,7.44,0.5,16 C0.5,24.56,7.44,31.5,16,31.5z" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
   *      'mybunle_action_2': '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2__d2_action_view_notes"><circle cx="16" cy="16" r="14" fill="none" class="csui-icon-v2-state"/><g><path d="M20,7h-9C9.897,7,9,7.888,9,8.98v13.859c0,1.092,0.897,1.979,2,1.979h10c1.103,0,2-0.888,2-1.979V9.97L20,7z M22,22.839c0,0.54-0.448,0.979-1,0.979H11c-0.551,0-1-0.439-1-0.979V8.98C10,8.439,10.449,8,11,8h8.588L22,10.387V22.839z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M12.5,11.75c-0.414,0-0.75,0.336-0.75,0.75s0.336,0.75,0.75,0.75h7c0.414,0,0.75-0.336,0.75-0.75 s-0.336-0.75-0.75-0.75H12.5z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M19.5,15.75h-7c-0.414,0-0.75,0.336-0.75,0.75s0.336,0.75,0.75,0.75h7c0.414,0,0.75-0.336,0.75-0.75 S19.914,15.75,19.5,15.75z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M18,19.75h-5.5c-0.414,0-0.75,0.336-0.75,0.75s0.336,0.75,0.75,0.75H18c0.414,0,0.75-0.336,0.75-0.75 S18.414,19.75,18,19.75z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/></g><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>'
   *    };
   * });
   *
   * @module {d2/sdk/controls/action.icons/action.icons} d2/sdk/controls/action.icons/"action.icons"
   * @name ActionIconRegistry
   * @extends external:Backbone.Collection
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  return {
    /**
     * Register action icons.
     * @param {object} icons - A hash of key value pairs, such that key represents an icon name and value is the string serialized svg content.
     * @return {void}
     * @throws Error If an icon name matches with any of already registered icons.
     * @static
     */
    registerIcons: function (icons) {
      return IconRegistryImpl.registerIcons(icons);
    },

    /**
     * Find an action icon by name.
     * @param {string} iconName - Name of the action icon being looked up.
     * @return {string} Matched icon content or a generalized missing icon if given name is not found in the registry.
     * @static
     */
    getIconByName: function(iconName) {
      return IconRegistryImpl.getIconByName(iconName);
    },

    /**
     * Find an icon and return decored copy with supplied options
     * @param {object} iconOptions
     * @param {string} iconOptions.iconName - Find the icon by this name.
     * @param {string} iconOptions.theme - Decorate found icon with css class `csui-icon-v2-theme-<theme>`
     * @param {boolean} iconOptions.allStateByElement - Whether to decorate icon with all possible state CSS classes.
     * @param {boolean} iconOptions.hoverStateByElement - Decorate with mouse hover state CSS class.
     * @param {boolean} iconOptions.activeStateByElement - Decorate with mouse left button down state CSS class.
     * @param {boolean} iconOptions.focusStateByElement - Decorate with keyboard focus state CSS class.
     * @param {boolean} iconOptions.disabledStateByElement - Decorate with disabled state CSS class.
     * @param {boolean} iconOptions.states - Whether the icon is capable of showing different states.
     * @param {boolean} iconOptions.handleRTL - Whether the icon is capable of handling RTL.
     * @param {boolean} iconOptions.on - Decorate icon with on state CSS class.
     * @param {string} iconOptions.filter - Apply filter. Only supported value is `grayscale`. `theme`, `states` & `on` must be false.
     * @param {string} iconOptions.colorTheme - Apply a coloring scheme. Applies only when `theme`, `states` & `on` are `false`. Possible values are
     * `'tree', 'outline-light', 'outline-dark', 'ot-navy', 'ot-indigo', 'ot-plum', 'ot-teal', 'ot-light-blue', 'ot-steal', 'ot-cloud'`.
     * @return {string} Matched icon content or the missing icon after decorating it with given options.
     * @static
     */
    getIconByNameWithOptions: function (iconOptions) {
      return IconRegistryImpl.getIconByNameWithOptions(iconOptions);
    }
  };
});

csui.define('d2/sdk/controls/dialogs/generic/dialog.action',["nuc/lib/marionette"], function (_nucLibMarionette) {
  let MarionetteObject = _nucLibMarionette.Object;
  class DialogAction extends MarionetteObject {
    constructor(options = {}) {
      super(options);
    }
    async execute(options = {}) {
      const {button} = options;
      throw new Error(`A suitable implementation could not be matched for '${button.label || button.id}'`);
    }
  }
  Object.defineProperty(DialogAction.prototype.constructor, "name", {
    value: "DialogAction"
  });
  return DialogAction;
});


csui.define('d2/dialogs/generic/impl/actions/action.valid.dialog',["d2/sdk/controls/dialogs/generic/dialog.action"], function (DialogAction) {
  class ActionValidDialog extends DialogAction {
    execute(options = {}) {
      const {formView, dialogState, dialog} = options;
      return formView.validateForm(true).then(isValid => {
        if (isValid) {
          const formValues = formView.getFlatFormValueMap(formView.getValues());
          return dialogState.validateForm(formValues).then(formData => {
            const {formName, formSchema: {generalConfig}} = formData;
            if (generalConfig) {
              dialog.gotoStep(formName);
            } else {
              dialog.close(formData);
            }
          });
        } else {
          return false;
        }
      });
    }
  }
  Object.defineProperty(ActionValidDialog.prototype.constructor, "name", {
    value: "ActionValidDialog"
  });
  return ActionValidDialog;
});


csui.define('d2/dialogs/generic/impl/actions/action.cancel.dialog',["d2/sdk/controls/dialogs/generic/dialog.action"], function (DialogAction) {
  class ActionCancelDialog extends DialogAction {
    execute(options = {}) {
      const {formView, dialogState, nodes, dialog} = options, formValues = formView?.getFlatFormValueMap(formView.getValues());
      return dialogState.cancelForm(formValues, nodes).then(formData => {
        const {formName, formSchema: {generalConfig}} = formData;
        if (generalConfig) {
          dialog.gotoStep(formName);
        } else {
          dialog.cancel();
        }
      });
    }
  }
  Object.defineProperty(ActionCancelDialog.prototype.constructor, "name", {
    value: "ActionCancelDialog"
  });
  return ActionCancelDialog;
});


csui.define('d2/dialogs/generic/impl/actions/action.back.dialog',["d2/sdk/controls/dialogs/generic/dialog.action"], function (DialogAction) {
  class ActionBackDialog extends DialogAction {
    execute(options = {}) {
      const {dialog, dialogState} = options;
      return dialogState.previousForm().then(formData => {
        const {formName} = formData;
        dialog.gotoStep(formName);
      });
    }
  }
  Object.defineProperty(ActionBackDialog.prototype.constructor, "name", {
    value: "ActionBackDialog"
  });
  return ActionBackDialog;
});


csui.define('d2/dialogs/generic/dialog.action.collection',["d2/sdk/controls/dialogs/generic/dialog.action", "d2/sdk/controls/dialogs/generic/dialog.action", "dctmw/utils/rule.matcher.collection", "d2/dialogs/generic/impl/actions/action.valid.dialog", "d2/dialogs/generic/impl/actions/action.cancel.dialog", "d2/dialogs/generic/impl/actions/action.back.dialog"], function (DialogAction, DefaultDialogAction, RuleMatcherCollection, ActionValidDialog, ActionCancelDialog, ActionBackDialog) {
  class DialogActionRule extends RuleMatcherCollection.prototype.model {
    #actionInstance;
    constructor(attr, options = {}) {
      super(attr, options);
    }
    getAction() {
      if (!this.#actionInstance) {
        const ActionClass = this.get("action");
        if (ActionClass) {
          try {
            this.#actionInstance = new ActionClass();
          } catch (e) {
            console.warn(e);
            this.#actionInstance = new DefaultDialogAction();
          }
        }
      }
      return this.#actionInstance;
    }
  }
  Object.assign(DialogActionRule.prototype, {
    defaults: {
      sequence: 10000,
      action: null
    }
  });
  class DialogActionRules extends RuleMatcherCollection {
    constructor(models = [], options = {}) {
      super(models, options);
    }
    findAction(formName, buttonAttributes) {
      const rule = this.find(model => {
        return model.matchRules({
          formName,
          button: buttonAttributes
        }, model.attributes);
      });
      if (rule) {
        const action = rule.getAction();
        if (action instanceof DialogAction) {
          return action;
        }
      }
      return new DefaultDialogAction();
    }
  }
  Object.assign(DialogActionRules.prototype, {
    model: DialogActionRule,
    comparator: "sequence"
  });
  const defaultActionRules = [{
    equals: {
      "button.id": "buttonOk"
    },
    action: ActionValidDialog
  }, {
    includes: {
      "button.id": ["buttonCancel", "cancel"]
    },
    action: ActionCancelDialog
  }, {
    equals: {
      "button.id": "previous"
    },
    action: ActionBackDialog
  }];
  const dialogActions = new DialogActionRules(defaultActionRules);
  return dialogActions;
});




csui.define('d2/sdk/controls/dialogs/generic/dialog.actions',["nuc/lib/underscore", "d2/dialogs/generic/dialog.action.collection", "dctm-ext!d2/sdk/controls/dialogs/generic/dialog.actions"], function (_, dialogActions, extDialogActions) {
  if (extDialogActions) {
    const actions = [].concat(_.flatten(extDialogActions, true));
    dialogActions.add(actions, {
      merge: true
    });
  }
  return dialogActions;
});


csui.define('d2/sdk/controls/dialogs/generic/dialog.state.method',["nuc/lib/marionette"], function (_nucLibMarionette) {
  let MarionetteObject = _nucLibMarionette.Object;
  class DialogStateMethod extends MarionetteObject {
    constructor(options = {}) {
      super(options);
    }
    async execute() {
      return true;
    }
  }
  Object.defineProperty(DialogStateMethod.prototype.constructor, "name", {
    value: "DialogStateMethod"
  });
  return DialogStateMethod;
});


csui.define('d2/dialogs/generic/impl/state.methods/d2fs.state.method',["nuc/lib/underscore", "nuc/lib/jquery", "nuc/contexts/factories/connector", "nuc/utils/url", "dctmw/lib/uri-templates", "d2/sdk/controls/dialogs/generic/dialog.state.method", "dctmw/utils/authenticators/session", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils"], function (_, $, ConnectorFactory, _nucUtilsUrl, UriTemplate, DialogStateMethod, Session, RestResources, RestLinkrels, _d2UtilsConstants, _dctmwUtilsUtils) {
  let combine = _nucUtilsUrl.combine;
  let combineQueryString = _nucUtilsUrl.combineQueryString;
  let appendQuery = _nucUtilsUrl.appendQuery;
  let MediaTypes = _d2UtilsConstants.MediaTypes;
  let parseAjaxError = _dctmwUtilsUtils.parseAjaxError;
  const METHOD_TO_ACTION_MAP = {
    "GET": "GET",
    "VALIDATE": "SUBMIT",
    "CANCEL": "CANCEL"
  };
  class D2FSStateMethod extends DialogStateMethod {
    constructor(options = {}) {
      super(options);
      this.connector = Session.get().getContext().getObject(ConnectorFactory);
      this.baseUrlTemplate = new UriTemplate(RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_GENERIC_DIALOG));
    }
    execute(options, result) {
      return new Promise((res, rej) => {
        const {dialogId, formName, method, nodes, actionParams, formData} = options, action = METHOD_TO_ACTION_MAP[method] || method, additionalParams = this.getDialogAdditonalParams(options), rBody = {};
        this.setDialogContextForm(dialogId, action, formName);
        const url = appendQuery(combine(this.baseUrlTemplate.fillFromObject({
          "dialog-name": this.getDialogContextForm(dialogId, action) || formName
        })), combineQueryString({
          action: action,
          "object_ids": nodes.length ? nodes.pluck("id") : "0000000000000000"
        }));
        if (_.isObject(actionParams) && !_.isEmpty(actionParams)) {
          rBody["action_params"] = actionParams;
        }
        if (_.isObject(additionalParams) && !_.isEmpty(additionalParams)) {
          rBody["additional_params"] = additionalParams;
        }
        if (_.isObject(formData) && !_.isEmpty(formData)) {
          rBody["properties"] = formData;
        }
        $.ajax(this.connector.extendAjaxOptions({
          type: "POST",
          url: url,
          data: JSON.stringify(rBody),
          contentType: MediaTypes.DCTM_JSON,
          success: resp => {
            let pageContent = resp["page-content"] || ({});
            options.formData ??= {};
            _.extend(options.formData, _.isObject(pageContent["success"]) ? this.extractMergeableFormDataFromResponse(pageContent["success"]) : {});
            let nextDialogName = this._findNextDialog(pageContent);
            if (nextDialogName) {
              this.execute({
                ...options,
                method: "GET",
                formName: nextDialogName
              }, result).then(res, rej);
              return;
            }
            if (pageContent["success"] === "") {
              this.clearDialogContextForm(dialogId);
            }
            _.extend(result, resp);
            res(result);
          },
          error: (xhr, status, error) => {
            const e = parseAjaxError(xhr, status, error, true);
            rej(e);
          }
        }));
      });
    }
    setDialogContextForm(dialogId, action, currentFormName) {
      this._checkAndInitDlgContext();
      if (action === "GET") {
        this.DLG_ACTIVE_CONTEXT[dialogId] = currentFormName;
      }
    }
    getDialogContextForm(dialogId) {
      this._checkAndInitDlgContext();
      return this.DLG_ACTIVE_CONTEXT[dialogId];
    }
    clearDialogContextForm(dialogId) {
      this._checkAndInitDlgContext();
      delete this.DLG_ACTIVE_CONTEXT[dialogId];
    }
    getDialogAdditonalParams(options) {
      const {formName, formResponseSet} = options;
      return _.omit(formResponseSet?.[formName]?.["page-content"]?.dialog, function (value) {
        if (_.isObject(value)) {
          return true;
        }
        if (_.isArray(value) && value.length > 0) {
          for (let i = 0; i < value.length; i++) {
            if (_.isObject(value[i]) || _.isArray(value[i])) {
              return true;
            }
          }
        }
        return false;
      });
    }
    extractMergeableFormDataFromResponse(success) {
      return _.omit(success, function (value, key) {
        if (_.includes(["nextDialogName", "message"], key)) {
          return true;
        }
        if (_.isObject(value)) {
          return true;
        }
        if (_.isArray(value) && value.length > 0) {
          for (let i = 0; i < value.length; i++) {
            if (_.isObject(value[i]) || _.isArray(value[i])) {
              return true;
            }
          }
        }
        return false;
      });
    }
    _checkAndInitDlgContext() {
      this.DLG_ACTIVE_CONTEXT = _.isObject(this.DLG_ACTIVE_CONTEXT) ? this.DLG_ACTIVE_CONTEXT : {};
    }
    _findNextDialog(dlg) {
      let nextDialogName;
      Object.keys(dlg).find(k => {
        nextDialogName = dlg[k]["nextDialogName"];
        return !!nextDialogName;
      });
      return nextDialogName;
    }
  }
  Object.defineProperty(D2FSStateMethod.prototype.constructor, "name", {
    value: "D2FSStateMethod"
  });
  return D2FSStateMethod;
});


csui.define('d2/dialogs/generic/dialog.state.methods',["d2/sdk/controls/dialogs/generic/dialog.state.method", "d2/dialogs/generic/impl/state.methods/d2fs.state.method", "dctmw/utils/rule.matcher.collection"], function (DialogStateMethod, D2FSStateMethod, RuleMatcherCollection) {
  class DialogStateMethodModel extends RuleMatcherCollection.prototype.model {
    #methodInstance;
    constructor(attr, options = {}) {
      super(attr, options);
    }
    getMethod() {
      if (!this.#methodInstance) {
        const MethodClass = this.get("methodClass");
        if (typeof MethodClass === "function") {
          try {
            this.#methodInstance = new MethodClass();
          } catch (e) {
            console.warn(e);
          }
        }
        if (!(this.#methodInstance instanceof DialogStateMethod)) {
          this.#methodInstance = new DialogStateMethod();
        }
      }
      return this.#methodInstance;
    }
    execute(options = {}, result = {}) {
      return new Promise((res, rej) => {
        const retVal = this.getMethod().execute(options, result);
        if (retVal instanceof Promise) {
          retVal.then(res, rej);
          return;
        }
        res(retVal);
      });
    }
  }
  Object.assign(DialogStateMethodModel.prototype, {
    defaults: {
      sequence: 10000,
      methodClass: null
    }
  });
  class DialogStateMethods extends RuleMatcherCollection {
    constructor(models = [], options = {}) {
      super(models, options);
    }
    execute(options = {}, result = {}) {
      const rules = this.filter(model => {
        return model.matchRules({
          ...options
        }, model.attributes);
      });
      let lastPromise = Promise.resolve(true);
      for (const rule of rules) {
        const cbSuccess = (function (retVal) {
          if (retVal === false) {
            return false;
          }
          return this.execute({
            ...options
          }, result);
        }).bind(rule);
        lastPromise = lastPromise.then(cbSuccess);
      }
      return lastPromise.then(() => result);
    }
  }
  Object.assign(DialogStateMethods.prototype, {
    model: DialogStateMethodModel,
    comparator: "sequence"
  });
  const defaultMethodRules = [{
    includes: {
      "method": ["GET", "VALIDATE", "CANCEL"]
    },
    methodClass: D2FSStateMethod
  }];
  const dialogStateMethods = new DialogStateMethods(defaultMethodRules);
  return dialogStateMethods;
});




csui.define('d2/sdk/controls/dialogs/generic/dialog.state.methods',["nuc/lib/underscore", "d2/dialogs/generic/dialog.state.methods", "dctm-ext!d2/sdk/controls/dialogs/generic/dialog.state.methods"], function (_, dialogStateMethods, extMethods) {
  if (extMethods) {
    let methods = [].concat(_.flatten(extMethods, true));
    dialogStateMethods.add(methods, {
      merge: false
    });
  }
  return dialogStateMethods;
});


csui.define('d2/sdk/controls/alerts/modal.alert',[
  'csui/dialogs/modal.alert/modal.alert'
], function (ModalAlertImpl) {
  'use strict';

  /**
   * Shows a modal alert.
   *
   * Different static methods could be used to show different type of modal alerts.
   *
   * @example <caption>A sample invocation to show a confirmation alert</caption>
   * define([
   *  'd2/sdk/controls/modal.alert'
   * ], function(ModalAlert){
   *  'use strict';
   *
   *  var buttonOptions = {
   *    showYes: true,
   *    labelYes: 'Ok',
   *    showNo: false,
   *    showCancel: true,
   *    labelCancel: 'Cancel'
   *  };
   *
   *  ModalAlert.confirmQuestion(function(result){
   *    if(result) {
   *      console.log('Clicked OK');
   *    } else {
   *      console.log('Clicked Cancel');
   *    }
   *  }, 'sample message', 'Sample Title', {
   *     buttons: buttonOptions
   *  });
   * });
   *
   * @module {d2/sdk/controls/modal.alert} d2/sdk/controls/"modal.alert"
   * @name ModalAlert
   * @extends {external:Marionette.View}
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */
  function showModal(options) {
    var alert = new ModalAlert(options);
    return alert.show();
  }

  var ModalAlert = ModalAlertImpl.extend({
    constructor: function ModalAlert(options) {
      options = options || {};
      ModalAlert.__super__.constructor.call(this, options);
    }
  }, {
    _show: showModal,

    /**
     * A few pre-configured button options to ease up modal creation with preset
     * @memberOf module:ModalAlert
     * @todo Describe different button options
     */
    ButtonOptions: Object.freeze(ModalAlertImpl.buttons),

    /**
     * Callback type invoked, when the modal dissolves.
     *
     * @callback AlertDissolveCallback
     * @param {boolean|undefined} result - `true` indicates 'Yes' button, `false` indicates 'No' and `undefined` indicates the modal was cancelled.
     * @returns {void}
     */

    /**
     * Return type. Associated `jQuery.Promise` instance is  `resolve()`-ed or `reject()`-ed to indicate whether user pressed 'Yes' or some other button respectively.
     * @typedef {jQuery.Promise} PromiseReturnType
     */

    /**
     * Customize modal's title, message, button labels and configuration
     * @typedef {Object} OptionsType
     * @todo Enumerate different properties
     */

    /**
     * Shows a success modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showSuccess: function (callback, message, title, options) {
      return ModalAlertImpl.showSuccess(callback, message, title, options);
    },

    /**
     * Shows a info modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showInformation: function (callback, message, title, options) {
      return ModalAlertImpl.showInformation(callback, message, title, options);
    },

    /**
     * Shows a warning modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showWarning: function (callback, message, title, options) {
      return ModalAlertImpl.showWarning(callback, message, title, options);
    },

    /**
     * Shows an error modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showError: function (callback, message, title, options) {
      return ModalAlertImpl.showError(callback, message, title, options);
    },

    /**
     * Shows a generic modal alert without associating with a type
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showMessage: function (callback, message, title, options) {
      return ModalAlertImpl.showMessage(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing success
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmSuccess: function (callback, message, title, options) {
      return ModalAlertImpl.confirmSuccess(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing information
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmInformation: function (callback, message, title, options) {
      return ModalAlertImpl.confirmInformation(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing warning
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmWarning: function (callback, message, title, options) {
      return ModalAlertImpl.confirmWarning(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing error
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmError: function (callback, message, title, options) {
      return ModalAlertImpl.confirmError(callback, message, title, options);
    },

    /**
     * Shows a generic interrogative modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmQuestion: function (callback, message, title, options) {
      return ModalAlertImpl.confirmQuestion(callback, message, title, options);
    },

    /**
     * Shows a generic interrogative modal alert representing a message
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmMessage: function (callback, message, title, options) {
      return ModalAlertImpl.confirmMessage(callback, message, title, options);
    }
  });

  return ModalAlert;
});

csui.define('d2/sdk/controls/dialogs/generic/dialog.content.view',["nuc/lib/marionette", "d2/sdk/controls/alerts/modal.alert"], function (_nucLibMarionette, ModalAlert) {
  let MarionetteObject = _nucLibMarionette.Object;
  class DialogContentView extends MarionetteObject {
    constructor(options = {}) {
      super(options);
    }
    async resolveView(options = {}) {
      throw new Error(`A suitable dialog content view implementation could not be matched for '${options.formName}'`);
    }
    handleError(e, options = {}) {
      console.error(e);
      ModalAlert.showError(e instanceof Error ? e.message : e, options);
    }
  }
  Object.defineProperty(DialogContentView.prototype.constructor, "name", {
    value: "DialogContentView"
  });
  return DialogContentView;
});


csui.define('d2/sdk/controls/form/form.model',[
  'csui/models/form'
], function(FormModelImpl){
  'use strict';

  /**
   * FormModel. Data holder for {@link ./form.view|FormView}.
   *
   * Raw dialog-like response from D2-REST API or literal JSON form data could be passed {@link ./form.converter|FormConverter} to transform it into
   * a compatible format and then the same could be used to instantiate/set into a `FormModel` instance which is later used by a `FormView` to render
   * an HTML form.
   *
   * @example <caption>Sample to create FormModel</caption>
   * define([
   *  'nuc/lib/jquery',
   *  'd2/sdk/controls/form/form.model',
   *  'd2/sdk/controls/form/form.converter',
   *  'd2/sdk/utils/contexts/context.util',
   *  'd2/sdk/utils/contexts/factories/connector'
   * ], function($, FormModel, formConverter, contextUtil, ConnectorFactory){
   *  'use strict';
   *
   * //To instantiate FormModel from a literal schema
   *  var literalSchema = {
   *    id: 'sample_form',
   *    data: {
   *      field1: 'Hello world!'
   *    },
   *    schema: {
   *      id: 'sample_form',
   *      properties: {
   *        field1: {
   *          title: 'Greeting',
   *          type: 'string',
   *          required: false
   *        }
   *      }
   *    },
   *    options: {
   *      fields: {
   *        field1: {
   *          label: 'Greeting',
   *          type: 'dctmwlabel'
   *        }
   *      }
   *    }
   *  };
   *
   *  formConverter.generateFormModelConfig([literalSchema]);
   *
   *  var literalFormModel = new FormModel(literalSchema);
   *
   *
   *  //To instantiate FormModel from a dialog-like REST API response
   *  var context = contextUtil.getPerspectiveContext(),
   *    connector = context && context.getObject(ConnectorFactory);
   *
   *  $.ajax(connector.extendAjaxOptions({
   *    url: '/D2-Smartview/repositories/d2repo/objects/090015fa80002d49/property-page',
   *    success: function(resp) {
   *      var formSchema = formConverter.convertConfig(resp['page-content'], {
   *        actionMode: 'create',
   *        layoutMode: 'single'
   *      });
   *
   *      var dialogFormModel = new FormModel(formSchema.propertiesConfig[0]);
   *    },
   *    error: function() {
   *      console.log('Fetching form failed');
   *    }
   *  }));
   * });
   *
   * @module {d2/sdk/controls/form/form.model} d2/sdk/controls/form/"form.model"
   * @name FormModel
   * @extends {external:Backbone.Model}
   *
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */


  var FormModel = FormModelImpl.extend({
    constructor: function FormModel(attr, options) {
      FormModel.__super__.constructor.call(this, attr, options);
    }
  });

  return FormModel;
});

csui.define('d2/sdk/models/node.model',[
  'nuc/models/node/node.model'
], function(NodeModelImpl){
  'use strict';

  /**
   * NodeModel. Represents a Documentum object. Holds data attributes that correspond to equivalent Documentum object properties.
   *
   * Smartview core framework uses a similar interface. See {@link ../../nuc/models/node/node.model|NodeModel}
   *
   * @example
   *
   * define([
   *    'd2/sdk/models/node.model',
   *    'd2/sdk/utils/contexts/context.utils',
   *    'd2/sdk/utils/contexts/factories/factory'
   * ], function(NodeModel, contextUtils, ConnectorFactory){
   *  'use strict';
   *
   *  //To instantiate a NodeModel and fetch details of a Documentum object with id '090015fa8000441a'
   *  var context = contextUtils.getPerspectiveContext(),
   *    connector = context.getObject(ConnectorFactory);
   *
   *  var node = new NodeModel({id: '090015fa8000441a'}, {connector: connector});
   *  //connector instance must be passed in the constructor options for all fetchable nodes.
   *
   *  node.fetch().done(function(){
   *    console.log('Node name: ' + node.get('name');
   *  }).fail(function(){
   *    console.log('Failed fetching node with id:' + node.get('id'));
   *  });
   *
   *
   *  //NodeModel could also be extended to suit particular Docuemntum type specific usage
   *  var TaskModel = NodeModel.extend({
   *    constructor: function TaskModel(attr, options) {
   *      TaskModel.__super__.constructor.call(this, attr, options);
   *    },
   *
   *    parse: function(response, options) {
   *      var data = TaskModel.__super__.parse.call(this, response, options);
   *
   *      //Custom logic to parse task specific attributes
   *
   *      return data;
   *    }
   *  });
   * });
   *
   * @module {d2/sdk/models/node.model} d2/sdk/models/"node.model"
   * @name NodeModel
   * @extends {external:Backbone.Model}
   *
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external ResourceMixin
   * @see ./mixins/resource.mixin
   */

  /**
   * @external CommandableMixin
   * @see ./mixins/commandable.mixin
   */

  /**
   * @constructs
   * @alias module:NodeModel
   * @param {object} [attributes] - An object hash containing set of initial attributes for the NodeModel.
   * @param {object} [options] - Constructor options. Mixin specific options are supported as-is through constructor options.
   * @param {Connector} [options.connector] - Mandatory if the NodeModel is to be synced with server.
   * @param {Boolean} [options.ignoreObjectData] - Whether to fetch additional data like menu actions, favorited status etc. when this node syncs with server.
   * Defaults to `false`. This flag acts as a master flag for other additional data specific flags like `fetchAction`, `fetchFavorites`, `fetchPreviewFormats`,
   * `fetchRelationsCount` & `fetchExternalShare`.
   * @param {Boolean} [options.fetchActions] - Whether to fetch menu actions after this node syncs with server. Defaults to `true`.
   * @param {Boolean} [options.fetchFavorites] - Whether to fetch 'favorited' status for this nodes after sync with server. Defaults to `true`.
   * @param {Boolean} [options.fetchPreviewFormats] - Whether to fetch preview formats for the node after it has synced with server. Defaults to `true`.
   * @param {Boolean} [options.fetchRelationsCount] - Whether to fetch relations count for the node after it has synced with server. Defaults to `true`.
   * @param {Boolean} [options.fetchExternalShare] - Whether to fetch external share status for the node after it has synced with server. Defaults to `true`.
   * @mixes external:ResourceMixin
   * @mixes external:CommandableMixin
   */
  var NodeModel = NodeModelImpl.extend({
    constructor: function NodeModel(attributes, options) {
      options = options || {};

      options.delayedActionsOptions = options.delayedActionsOptions || options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.nonPromotedActionsOptions || options.d2ActionsOptions;
      options.additionalActionsOptions = options.additionalActionsOptions || options.d2ActionsOptions;

      NodeModel.__super__.constructor.call(this, attributes, options);
    }
  });

  return NodeModel;
});

csui.define('d2/dialogs/generic/dialog.form.collection.view',["nuc/lib/underscore", "nuc/lib/jquery", "d2/sdk/models/node.model", "d2/widgets/metadata/metadata.properties.view", "d2/widgets/metadata/general.panels/d2/d2.general.form.view", "dctmw/utils/authenticators/session"], function (_, $, NodeModel, MetadataPropertiesView, D2GeneralFormView, Session) {
  class DialogFormCollectionView extends MetadataPropertiesView {
    className() {
      let superClass = _.isFunction(super.className) ? super.className.apply(this, arguments) : super.className;
      return `${superClass} d2-dialog-form-collection`;
    }
    constructor(options = {}) {
      options.node = options.node || new NodeModel();
      options.context = Session.get().getContext();
      super(options);
    }
    contentView() {
      return D2GeneralFormView;
    }
    contentViewOptions(model) {
      const cvOptions = super.contentViewOptions(model);
      let mode = this.options.formMode || "create";
      return {
        ...cvOptions,
        ...{
          mode: mode,
          layoutMode: this.options.layoutMode
        }
      };
    }
    validateForm(refreshState, validateOnlyRequiredFields) {
      if (this.allFormsRendered === true) {
        return new Promise(res => {
          let allFormsValid = true;
          let promises = this.tabContent.children.map(tab => tab.content.validateForm(refreshState, validateOnlyRequiredFields));
          $.whenAll.apply($, promises).done(function (states) {
            states.forEach(v => {
              allFormsValid = allFormsValid && v;
            });
            res(allFormsValid);
          }).fail(() => {
            res(false);
          });
        });
      } else {
        return Promise.resolve(false);
      }
    }
    getValues() {
      return this.getFormsValues();
    }
    getFlatFormValueMap(map) {
      var me = this, properties = {};
      _.each(map, function (value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            _.each(_.keys(value[0]), function (k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          _.extend(properties, me.getFlatFormValueMap(value));
        }
      });
      return properties;
    }
  }
  Object.defineProperty(DialogFormCollectionView.prototype.constructor, "name", {
    value: "DialogFormCollectionView"
  });
  return DialogFormCollectionView;
});


csui.define('d2/dialogs/generic/default.dialog.content.view',["nuc/lib/backbone", "d2/sdk/controls/form/form.model", "d2/dialogs/generic/dialog.form.collection.view", "d2/sdk/controls/dialogs/generic/dialog.content.view"], function (_nucLibBackbone, FormModel, DialogFormCollectionView, DialogContentView) {
  let Collection = _nucLibBackbone.Collection;
  class FormCollection extends Collection {
    constructor(models, options) {
      super(models, options);
      this.fetched = true;
    }
  }
  Object.assign(FormCollection.prototype, {
    model: FormModel
  });
  class DefaultDialogContentView extends DialogContentView {
    constructor(options = {}) {
      super(options);
    }
    resolveView(options = {}) {
      return new Promise(res => {
        let formMode = options["originalResponse"] && options["originalResponse"]["page-content"] && options["originalResponse"]["page-content"]["dialog"] && options["originalResponse"]["page-content"]["dialog"]["form_mode"] && options["originalResponse"]["page-content"]["dialog"]["form_mode"] === "read" ? "update" : "create";
        let formView = new DialogFormCollectionView({
          formMode: formMode,
          layoutMode: options.layoutMode,
          collection: new FormCollection(options.formSchema.propertiesConfig)
        });
        res(formView);
      });
    }
  }
  Object.defineProperty(DefaultDialogContentView.prototype.constructor, "name", {
    value: "DefaultDialogContentView"
  });
  return DefaultDialogContentView;
});


csui.define('d2/dialogs/generic/dialog.content.view.resolver',["nuc/lib/marionette", "d2/sdk/controls/dialogs/generic/dialog.content.view", "d2/dialogs/generic/default.dialog.content.view", "dctmw/utils/rule.matcher.collection"], function (_nucLibMarionette, DialogContentView, DefaultDialogContentView, RuleMatcherCollection) {
  let View = _nucLibMarionette.View;
  class DialogContentViewRule extends RuleMatcherCollection.prototype.model {
    #viewInstance;
    constructor(attr, options = {}) {
      super(attr, options);
    }
    getView() {
      if (!this.#viewInstance) {
        const ViewClass = this.get("viewClass");
        if (typeof ViewClass === "function") {
          try {
            this.#viewInstance = new ViewClass();
          } catch (e) {
            console.warn(e);
          }
        }
      }
      return this.#viewInstance;
    }
  }
  Object.assign(DialogContentViewRule.prototype, {
    defaults: {
      sequence: 10000,
      action: null
    }
  });
  class DialogContentViewResolver extends RuleMatcherCollection {
    constructor(models = [], options = {}) {
      super(models, options);
    }
    findView(options) {
      const rule = this.find(model => {
        return model.matchRules({
          ...options
        }, model.attributes);
      }), dialogContentView = rule && rule.getView();
      return dialogContentView;
    }
    resolveView(options) {
      return new Promise((res, rej) => {
        try {
          let dialogContentView = this.findView(options), retVal = dialogContentView && dialogContentView instanceof DialogContentView && dialogContentView.resolveView(options);
          if (retVal) {
            if (retVal instanceof Promise) {
              retVal.then(dialogContentView => {
                this._resolveDialogContentView(dialogContentView, options).then(res, rej);
              }, e => {
                console.warn("Unable to resolve the dialog view from extension. Resolving dialog view with default view", e);
                this._resolveDefaultDialogContentView(options).then(res, rej);
              });
            } else {
              this._resolveDialogContentView(retVal, options).then(res, rej);
            }
          } else {
            this._resolveDefaultDialogContentView(options).then(res, rej);
          }
        } catch (e) {
          console.warn("Unable to resolve the dialog view from extension. Resolving dialog view with default view", e);
          this._resolveDefaultDialogContentView(options).then(res, rej);
        }
      });
    }
    _resolveDialogContentView(dialogContentView, options) {
      return new Promise((res, rej) => {
        if (dialogContentView) {
          if (dialogContentView instanceof View) {
            res(dialogContentView);
          } else if (typeof dialogContentView === "function") {
            try {
              var view = new dialogContentView(options);
              res(view);
            } catch (e) {
              console.warn("Unable to resolve the dialog view from extension. Resolving dialog view with default view", e);
              this._resolveDefaultDialogContentView(options).then(res, rej);
            }
          }
        } else {
          this._resolveDefaultDialogContentView(options).then(res, rej);
        }
      });
    }
    _getDefaultContentView(options) {
      return new DefaultDialogContentView(options);
    }
    _resolveDefaultDialogContentView(options) {
      return this._getDefaultContentView(options).resolveView(options);
    }
    handleError(e, options) {
      let dialogContentView = this.findView(options);
      if (!dialogContentView || !(dialogContentView instanceof DialogContentView)) {
        dialogContentView = this._getDefaultContentView(options);
      }
      dialogContentView.handleError(e);
    }
  }
  Object.assign(DialogContentViewResolver.prototype, {
    model: DialogContentViewRule,
    comparator: "sequence"
  });
  const dialogContentViewResolver = new DialogContentViewResolver();
  return dialogContentViewResolver;
});




csui.define('d2/sdk/controls/dialogs/generic/dialog.content.views',["nuc/lib/underscore", "d2/dialogs/generic/dialog.content.view.resolver", "dctm-ext!d2/sdk/controls/dialogs/generic/dialog.content.views"], function (_, dialogContentViewResolver, extDialogContentViews) {
  if (extDialogContentViews) {
    const views = [].concat(_.flatten(extDialogContentViews, true));
    dialogContentViewResolver.add(views, {
      merge: true
    });
  }
  return dialogContentViewResolver;
});




csui.define('d2/sdk/controls/icon.sprites/tree.icon.sprites',[
  'nuc/lib/underscore',
  'dctmw/controls/tree/tree.sprites',
  'csui-ext!d2/sdk/controls/icon.sprites/tree.icon.sprites'
], function(_, treeIconSprites, extIcons){
  'use strict';

  /**
   * Tree icons collection. Used to visually represent a {@link ../../models/node.model|NodeModel} within a `TreeView`.
   *
   * The collection can be looked up to discover possible representation or it can be augmented by extension
   *
   * See {@link ./node.icon.sprites|NodeIconSprites} for sample extension definition. Registering the extension is also
   * similar except the target module
   *
   * @example <caption>To register an extension</caption>
   * // Assuming that mybundle/extensions/tree.icons.js is the extension
   * // Add to extension.json as shown below
   *
   * "d2/sdk/controls/icon.sprites/tree.icon.sprites": {
   *    "extensions": {
   *      "mybundle": [
   *        "mybundle/extensions/tree.icons"
   *      ]
   *    }
   *  }
   *
   * @module {d2/sdk/controls/icon.sprites/tree.icon.sprites} d2/sdk/controls/icon.sprites/"tree.icon.sprites"
   * @name TreeIconSprites
   * @extends {external:Backbone.Collection}
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  if(extIcons) {
    treeIconSprites.add(_.flatten(extIcons, true));
  }

  return treeIconSprites;
});




csui.define('d2/sdk/controls/icon.sprites/node.icon.sprites',[
  'nuc/lib/underscore',
  'csui/utils/nodesprites',
  'csui-ext!d2/sdk/controls/icon.sprites/node.icon.sprites'
], function(_, nodeIconSprites, extIcons){
  'use strict';

  /**
   * Node icons collection. Used to visually represent a {@link ../../models/node.model|NodeModel} within a `NodeIconView`.
   *
   * The collection can be looked up to discover possible representation or it can be augmented by extension
   *
   * @example <caption>To extend the node icons collection</caption>
   * //In mybundle/extensions/node.icons.js
   * define([], function(){
   *  'use strict';
   *
   *  return [
   *    {
   *      decides: function(node) {
   *        return node.get('type') === 'group';
   *      },
   *      className: 'csui-icon d2-icon-type-group-user',
   *      mimeType: 'Group',
   *      sequence: 20
   *    },
   *    {
   *      decides: function(node) {
   *        return node.get('type') === 'user';
   *      },
   *      className: 'csui-icon d2-icon-type-single-user',
   *      mimeType: 'User',
   *      sequence: 20
   *    }
   *  ];
   * });
   *
   * //To register the extension, put in extensions.json
   *  "d2/sdk/controls/icon.sprites/node.icon.sprites": {
   *    "extensions": {
   *      "mybundle": [
   *        "mybundle/extensions/node.icons"
   *      ]
   *    }
   *  }
   *
   * @module {d2/sdk/controls/icon.sprites/node.icon.sprites} d2/sdk/controls/icon.sprites/"node.icon.sprites"
   * @name NodeIconSprites
   * @extends {external:Backbone.Collection}
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  if(extIcons) {
    nodeIconSprites.add(_.flatten(extIcons, true));
  }

  return nodeIconSprites;
});




csui.define('d2/sdk/controls/table/cells/cell.factory',[
  'csui-ext!d2/sdk/controls/table/cells/cell.factory'
], function (/*extCellFactory*/) {
  'use strict';
});



csui.define('d2/sdk/integration/folder.browser.id.rules',[
  'nuc/lib/underscore',
  'd2/integration/folderbrowser/folder.browser.id.rules',
  'csui-ext!d2/sdk/integration/folder.browser.id.rules'
], function(_, idRulesImpl, extRules){
  'use strict';

  /**
   * A rule collection that defines how to parse id attribute for the FolderBrowser widget in D2SV embedded mode.
   *
   * This collection allows extension registrations and each of those extensions are treated as root object's id provider
   * for the FolderBrowser widget.
   *
   * @note Each rule is supposed to define a `fetcher` callback function that should return a `jquery.Promise` object. See `IDRuleFetcher` below.
   * The returned promise should be resolved with a Documentum ID which will be used as the root container for FolderBrowser. Or, alternatively
   * the returned promise could be rejected to indicate an error.
   *
   * @see {@link ../../nuc/models/mixins/rules.matching/rules.matching.mixin|RulesMatchingMixin} for a complete guide on how to write rules.
   *
   * @example <caption>To register a new type of id provider</caption>
   * //in src/extensions/embed/folder.browser.id.rules.js
   * define([
   *  'nuc/lib/jquery'
   * ], function($){
   *  'use strict';
   *
   *  return [{
   *    equals: {
   *      id_source: 'abcd' //Match this rule when id_source=abcd is present as part of query parameters while accessing FolderBrowser widget using iURL
   *    },
   *    fetcher: function(options) {
   *      var dfd = $.Deferred();
   *
   *      var nodeId = options.params.my_id;
   *      if(!!nodeId) {
   *        dfd.resolve(nodeId);
   *        //This example shows a very trivial case where 'my_id' parameter itself holds the Documentum ID.
   *        //However, depending on requirement complex business integration logic could also be written here to
   *        //retrieve the Documentum ID from an external system
   *      } else {
   *        dfd.reject('my_id is missing from url');
   *      }
   *
   *      return dfd.promise();
   *    }
   *  }];
   * });
   *
   * @module {d2/sdk/integration/folder.browser.id.rules} d2/sdk/integration/"folder.browser.id.rules"
   * @name FolderBrowserIDRules
   * @extends Array
   *
   */

  if(extRules) {
    idRulesImpl.add(_.flatten(extRules, true));
  }

  /**
   * @callback IDRuleFetcher
   * @property {Object} options
   * @property {Object} options.params - JSON object representing query params.
   * @returns {jQuery.Promise} The promise should be either resolved with a Documentum ID(r_object_id) or rejected with an error string.
   */

  return idRulesImpl;
});




csui.define('d2/sdk/utils/landingpage/default.widget.types.map',[
  'nuc/lib/underscore',
  'd2/utils/landingpage/default.widget.types.map',
  'csui-ext!d2/sdk/utils/landingpage/default.widget.types.map'
], function(_, defaultWidgetTypesMap, extraTypeMaps){
  'use strict';

  /**
   * An extensible map that assigns a D2-Config widget type to a D2 Smart View default widget type
   *
   * New mapping entries could be added using extension
   * @example <caption>to register an extension, add in extension.json</caption>
   * {
   *   "d2/sdk/utils/landingpage/default.widget.types.map": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/landingpage/my.default.widget.types"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.default.widget.types.js is defined as</caption>
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {defaultType: 'svcustomtype1', d2WidgetType: 'FavoritesWidget'}, // uses default error if the widget configuration can't be resolved
   *      {defaultType: 'svcustomtype2', d2WidgetType: 'FavoritesWidget', errMissingWidgetConfig: 'Widget for svcustomtype2 is not found'}, //custom error
   *      // Got more maps ? keep appending here.
   *    ];
   * });
   *
   * @module {d2/sdk/utils/landingpage/default.widget.types.map} d2/sdk/utils/landingpage/"default.widget.types.map"
   * @name DefaultWidgetsMap
   * @extends Object
   *
   */

  var typesMap = [];

  if (extraTypeMaps) {
    typesMap = typesMap.concat(_.flatten(extraTypeMaps, true));
    defaultWidgetTypesMap.addMaps(typesMap);
  }

  /**
   * @typedef {Object} MapEntry
   * @property {string} defaultType - Name of D2 Smart View default widget type
   * @property {string} d2WidgetType - Name of D2-Config widget type
   * @property {string} errMissingWidgetConfig - Error to be shown in the UI if the mapped widget type from D2-Config is not resolved.
   */

  /**
   * Return type. Each key in this object represents a default widget type name in D2 Smart View.
   * @typedef {Object} MapEntryReturnType
   * @property {string} key - Default widget type name
   * @property {Object} value - The map
   * @property {string} value.type - D2 widget type name
   * @property {string} value.errMissingWidgetConfig - Error to be shown if widget config is not resolved
   */

  /**
   * @name addMaps
   * @function
   * @memberOf module:DefaultWidgetsMap
   * @description Add new mapping entries. Recommended way is to get it added via extension mechanism, see example from above.
   * @param {MapEntry[]} newEntries - Entries to be added
   * @returns void
   *
   * @example <caption>New types could be added as</caption>
   * // It has to be made sure that this AMD module is loaded by some other module.
   * define(['d2/sdk/utils/landingpage/default.widget.types.map'], function(widgetTypesMap){
   *    'use strict';
   *
   *    widgetTypesMap.addMaps([
   *      {defaultType: 'svcustomtype1', d2WidgetType: 'FavoritesWidget'},
   *      {defaultType: 'svcustomtype2', d2WidgetType: 'FavoritesWidget', errMissingWidgetConfig: 'Widget for svcustomtype2 is not found'}
   *      // More entries could be added.
   *    ]);
   *
   *    // some other code
   * });
   */

  /**
   * @name getMaps
   * @function
   * @memberOf module:DefaultWidgetsMap
   * @description Get existing map entries
   * @returns {MapEntryReturnType}
   */

  return defaultWidgetTypesMap;
});



csui.define('d2/sdk/utils/landingpage/tiles',[
  'dctmw/utils/load-extensions/ext.utils',
  'd2/utils/landingpage/tiles',
  'dctm-ext!d2/sdk/utils/landingpage/tiles'
], function (extUtil, tileCollection, extraTileDefinitions) {
  'use strict';

  /**
   * Tile definition collection. Each tile definition describes its priority, association type, pre-requisite and finally a view that is used as the
   * representation of the tile. Based on priority a particular definition is picked from this collection to finally render D2 Smart View landing page.
   *
   * @see {@link ../widget.constants|WidgetConstants} for some related pre-defined constants.
   *
   * New definitions could be added to this collection by means of extension.
   * @example <caption>to register an extension, add in extension.json</caption>
   * {
   *   "d2/sdk/utils/landingpage/tiles": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/landingpage/my.tiles"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.tiles.js is defined as</caption>
   * define(['d2/sdk/utils/widget.constants', 'i18n!mybundle/utils/landingpage/impl/nls/lang'], function(widgetConstants, lang){
   *    'use strict';
   *
   *    function validateURLShortcutConfig(widgetConfig, options) {
   *        var validation = {status: true};
   *        if (!widgetConfig.widgetParams && !widgetConfig.widgetParams.open_url) {
   *          validation.status = false; // It will be considered as a validation error
   *          validation.errorMessage = lang.openUrlWidgetMissing;
   *        }
   *        return validation;
   *    }
   *
   *    // See 'LandingTile' documentation for all possible properties with their usage
   *    return [
   *      {type: 'CreateFile', icon: 'icon-new', isShortcut: true, tileConfigType: widgetConstants.TileConfigTypes.NONE}, // widget configuration-less shortcut tile
   *      {type: 'OpenURLWidget', icon: 'icon-url', isShortcut: true, validateConfig: validateURLShortcutConfig}, // shortcut tile that needs & validates a widget configuration
   *      {
   *        // A widget tile that relies on the default widget validation
   *        type: 'CheckoutDocumentWidget',
   *        icon: 'title-checkout',
   *        tileView: 'mybundle/widgets/newcheckout',
   *        errMissingWidgetConfig: lang.checkoutWidgetMissing,
   *        applicationScope: 'checkedout'
   *      }
   *      // Any other definition
   *    ];
   * });
   *
   * @module {d2/sdk/utils/landingpage/tiles} d2/sdk/utils/landingpage/tiles
   * @name TileCollection
   * @extends {external:Backbone.Collection}
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var tileDefinitions = [];

  if (extraTileDefinitions) {
    tileDefinitions = tileDefinitions.concat(extUtil.parseExtensions(extraTileDefinitions));
    tileCollection.add(tileDefinitions, {merge: true});
  }

  /**
   * @typedef {Object} LandingTile
   * @property {number} [sequence=1000] - Priority of this definition. For matching `type` property values, the definition with least value for `sequence` will be used.
   * @property {string} type - Association type of this tile. It should be set with a value from the enumeration `ShortcutType`, or any D2 widget type name.
   * Additional shortcut types or widget types declared by a D2 plugin also could be used.
   * @property {string} icon - CSS class name of the icon to be shown on the tile. For non-shortcut tiles, the icon is shown in the tile header.
   * @property {boolean} [isShortcut=false] - Whether it's shortcut tile or widget tile? `true` indicates a shortcut.
   * @property {TileConfigTypes} [tileConfigType=TileConfigTypes.WIDGET] - Tiles that don't require a widget config should set it to `TileConfigTypes.NONE`. See {@link ../widget.constants#TileConfigTypes|TileConfigTypes}.
   * @property {string} [tileView] - Not required for shortcut tiles. For other tiles it should point to a folder implementing the view to be associated with this tile. E.g For a path `mybundle/widget/somefolder` the runtime
   * will look for a `somefolder.view.js` within the `somefolder` directory. Alternatively it can be specified as just a name like `mytile`, in that case the tile's view will be resolved as
   * `<bundle_src_folder>/widgets/mytile/mytile.view.js`.
   * @property {ShortcutClickHandler} [clickHandler] - Callback to be executed only for those shortcut tiles that neither specifies an `applicationScope` (see below) nor a matching shortcut behavior
   * is found in the registry. See {@link ../../widgets/shortcut.tile/shortcut.tile.behaviors|ShortcutBehaviors}.
   * @property {ConfigValidatorCallback} [validateConfig] - Callback to validate the resolved widget config.
   * @property {TileOptionBuilderCallback} [buildTileOptions] - Callback to build tile options that would be passed to the `tileView` while constructing.
   * @property {string} [errMissingWidgetName] - The error to be shown if a tile definition requires a widget config but the corresponding D2 Smart View landing page configuration
   * fails to specify a name for it. If unspecified, a generic error message is shown.
   * @property {string} [errMissingWidgetConfig] - The error to be shown if a tile definition requires a widget config but a suitable widget configuration could not be resolved for some reason.
   * @property {string} [applicationScope] - The application scope in which this tile will expand into. Tile expansion is enabled only if this value matches one of the registered application scope perspective's id.
   * See {@link ../perspectives/app.scope.perspectives|ApplicationScopePerspectives}. For shortcut tiles, clicking anywhere in the tile activates the expansion. For list type of tiles, the tile header or
   * a dedicated 'Expand' button could be clicked to activate the expansion.
   *
   *
   */

  /**
   * OOTB D2SV shortcut types
   * @enum {string}
   * @name ShortcutType
   * @property CreateFile - New file shortcut
   * @property UploadFile - Import files shortcut
   * @property CreateUploadFile - Combined New/Import file shortcut
   * @property UploadFolder - Import folder shortcut
   * @property QueryFormObject - Query form shortcut
   * @property QueryObject - Saved query/search shortcut
   */

  /**
   * Callback function that validates a widget configuration for a tile
   *
   * @callback ConfigValidatorCallback
   * @param {Object} widgetConfig - The widget configuration being validated
   * @param {Object} [options] - Any additional context specific data that is not part of `widgetConfig` but might be relevant for validation
   * @returns {ConfigValidatorReturnType}
   */

  /**
   * @typedef {Object} ConfigValidatorReturnType
   * @property {boolean} status - `true` indicates validation succeeded, `false` otherwise.
   * @property {string} [errorMessage] - Error message to be shown in UI if the validation failed.
   */

  /**
   * Callback function that builds options for a tile
   *
   * @callback TileOptionBuilderCallback
   * @param {Object} tile - Parsed tile object from D2 Smart View landing page configuration. New properties could be attached to this object as part of forming additional option.
   * @param {Object} [widgetConfig] - Any relevant widget configuration, applicable only if the tile requires a widget configuration.
   * @returns {void}
   */

  /**
   * Callback to handle click event for a shortcut tile
   *
   * @callback ShortcutClickHandler
   * @param {object} options - The options container.
   * @param {Context} options.context - `context` object associated with the runtime. See {@link ../contexts/context.utils#Context|Context}.
   * @param {string} options.widgetName - Name of the widget configuration if the shortcut is of type `TileConfigTypes.WIDGET`. See {@link ../widget.constants#module_WidgetConstants.TileConfigTypes|TileConfigTypes}.
   * @param {object} options.widgetParams - Any parameters associated with the resolved widget configuration. Applicable only if the shortcut is of type `TileConfigTypes.WIDGET`. See {@link ../widget.constants#TileConfigTypes|TileConfigTypes}.
   * @returns {void}
   */

  return tileCollection;
});




csui.define('d2/sdk/utils/perspectives/app.scope.perspectives',[
  'dctmw/utils/load-extensions/ext.utils',
  'd2/utils/perspectives/app.scope.perspectives',
  'dctm-ext!d2/sdk/utils/perspectives/app.scope.perspectives'
], function (extUtil, appScopePerspectivesImpl, extraPerspectives) {
  'use strict';

  /**
   * Application scope collection. Each navigable area within the D2 Smart View application page is called a perspective.
   * E.g the area shown immediate after a user login is called landing perpsective.
   *
   * An application scope is the immediate next navigable area from the landing perspective. It can be activated by user interacting with a tile
   * in landing perspective or by direct URL. Once activated, depending on how the application scope is defined, one or several view components are going to take over
   * the screen space and provide a holistic UI with related functional features for the perspective.
   *
   * This collection is a registry of all such scope definitions and could be extended by extension
   * @example <caption>to register an extension, add in extension.json</caption>
   * {
   *   "d2/sdk/utils/perspectives/app.scope.perspectives": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/perspectives/my.app.scopes"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.app.scopes.js is defined as</caption>
   * define(['i18n!mybundle/utils/landingpage/impl/nls/lang'], function(lang){
   *    'use strict';
   *
   *    function openURLWidgetConfigValidator(widgetConfig, options) {
   *        var validation = {status: true};
   *        if (!widgetConfig.widgetParams && !widgetConfig.widgetParams.open_url) {
   *          validation.status = false; // It will be considered as a validation error
   *          validation.errorMessage = lang.openUrlWidgetValidationFailed;
   *        }
   *        return validation;
   *    }
   *
   *    // See 'AppScope' documentation for all possible properties with their usage
   *    return [
   *      {applicationScope: 'sample1'}, // widget-less application scope where the perspective descriptor location is inferred
   *      {applicationScope: 'sample2', perspectiveJson: 'sample2.perspective.json'}, // widget-less application scope where the perspective descriptor location is partially inferred
   *      {
   *        // scope that requires widget config and declares explicit location of perspective descriptor
   *        applicationScope: 'sample3',
   *        perspectiveJson: 'mybundle/utils/perspectives/sample3.perspective.json',
   *        widgetType: 'OpenURLWidget',
   *        validateConfig: openURLWidgetConfigValidator
   *      }
   *      // Any other definition
   *    ];
   * });
   *
   * @module {d2/sdk/utils/perspectives/app.scope.perspectives} d2/sdk/utils/perspectives/"app.scope.perspectives"
   * @name ApplicationScopePerspectives
   * @extends external:Backbone.Collection
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var appScopePerspectives = [];

  if (extraPerspectives) {
    appScopePerspectives = appScopePerspectives.concat(extUtil.parseExtensions(extraPerspectives));
    appScopePerspectivesImpl.add(appScopePerspectives, {merge: true});
  }

  /**
   * @typedef {Object} AppScope
   * @property {number} [sequence=1000] - Priority of this definition. For matching `applicationScope` property values, the definition with least value for `sequence` will be used.
   * @property {string} applicationScope - ID of this scope. Also used in forming the URL that links to this application scope directly.
   * @property {string} [perspectiveJson] - Path to the descriptor JSON file for this perspective. It can be specified explicitly as `mybundle/utils/perspectives/abc.json` or partially as `a.perspective.json`.
   * If specified partially then the complete path is resolved as `<bundle_src_folder>/utils/perspectives/a.perspective.json`. As another alternative, this property can be omitted altogether, in that case
   * the value of `applicationScope` property is used to resolve e.g if `applicationScope` is specified as `sample` then, `perspectiveJson` defaults to `sample.json` and that in-turn gets expanded
   * into the complete path `<bundle_src_folder>/utils/perspectives/sample.json`.
   * @property {string} [defaultTitle] - The value to be passed as `title` to the outermost view component of this perspective. Ignored if this application scope is driven by a widget configuration, in that
   * case the label/name of the widget config is used as title.
   * @property {string} [defaultWidgetType] - If activating this application scope demands a default widget configuration, then specify the type in this property. This should be specified
   * only if an application scope requires a widget configuration and allows direct URL navigation. A value from the OOTB default widget types could be used, see {@link ../widget.constants#DEFAULT|DEFAULT} or
   * any new default widget types introduced by a D2 plugin could be used.
   * @property {string} [widgetType] - Type of the D2-Config widget associated with this application scope. Needs to be specified only if this scope requires a widget configuration. If omitted even
   * when this scope requires a widget configuration, value for this property is deduced from `defaultWidgetType` property. A value from the OOTB widget types could be used, {@link ../widget.constants#D2|D2} or
   * any valid widget type from D2-Config could be used.
   * @property {ConfigValidatorCallback} [validateConfig] - Callback to validate the resolved config for this scope. Applicable only if this scope has specified one of `defaultWidgetType` or `widgetType`.
   * @property {callback} [beforeActivateScope] - A no-argument callback invoked right before this application scope is just about to get activated. The callback should return `false` if it does not want to
   * get activated.
   * @property {callback} [afterDeactivateScope] - A no-argument callback invoked if this application scope was enabled earlier and now being swapped out because a different application scope has been activated.
   *
   */

  /**
   * Callback function that validates widget configuration for an application scope
   *
   * @callback ConfigValidatorCallback
   * @param {Object} widgetConfig - The widget configuration being validated
   * @param {Object} [options] - Any additional context specific data that is not part of `widgetConfig` but might be relevant for validation
   * @returns {ConfigValidatorReturnType}
   */

  /**
   * @typedef {Object} ConfigValidatorReturnType
   * @property {boolean} status - `true` indicates validation succeeded, `false` otherwise.
   * @property {string} [errorMessage] - Error message to be shown in UI if the validation failed.
   */

  return appScopePerspectivesImpl;
});




csui.define('d2/sdk/utils/commands',[
  'nuc/lib/underscore',
  'csui/utils/commands',
  'csui-ext!d2/sdk/utils/commands'
], function(_, csuiCommands, extCommands){
  'use strict';

  /**
   * CommandCollection. A collection of all the registered commands, used by a toolbar to link executable actions for menus.
   * can also be used to look up and run the executable code in a particular context without a backing toolbar.
   *
   * To implement a business logic as command and get it registered with this collection, see -
   *
   * * {@link ../commands/command|CommandModel}
   * * {@link ../commands/progressive.nodes.command|ProgressiveNodesCommand}
   *
   * @example <caption>A particular command within this collection could be looked up, tried and executed as</caption>
   *
   * define([
   *    'd2/sdk/utils/commands',
   *    'd2/sdk/models/node.model',
   *    'd2/sdk/models/node.collection',
   *    'd2/sdk/utils/contexts/context.utils',
   *    'd2/sdk/utils/contexts/factories/connector'
   * ], function(commands, NodeModel, NodeCollection, contextUtil, ConnectorFactory){
   *    'use strict';
   *
   *    var node = new NodeModel({
   *      id: '0b0015fa80005598'
   *    },{
   *      connector: contextUtil.getPerspectiveContext().getObject(ConnectorFactory)
   *    });
   *
   *    node.fetch().done(function(){
   *      var status = {
   *        nodes: [node]
   *      };
   *
   *      var myCommand = commands.get('MyCommand');
   *      if(myCommand && myCommand.enabled(status)) {
   *        myCommand.execute(status)
   *          .then(function(){
   *            console.log('MyCommand completed successfully');
   *          })
   *          .catch(function(){
   *            console.log('MyCommand has failed to execute');
   *          });
   *      }
   *    });
   *
   * });
   *
   *
   * @module {d2/sdk/utils/commands} d2/sdk/utils/commands
   * @name CommandCollection
   * @extends external:Backbone.Collection
   *
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var commands = csuiCommands;

  if (extCommands) {
    commands.add(
      _.chain(extCommands)
        .flatten(true)
        .map(function (CommandModel) {
          return new CommandModel();
        })
        .value()
    );
  }

  return commands;
});

csui.define('d2/utils/sdk.ext.loader',[
  'd2/sdk/models/module.collection',
  'd2/sdk/commands/create.folder.type.filters',
  'd2/sdk/commands/default.actions.rules',
  'd2/sdk/commands/node.actions.rules',
  'd2/sdk/controls/action.icons/action.icons',
  'd2/sdk/controls/dialogs/generic/dialog.actions',
  'd2/sdk/controls/dialogs/generic/dialog.state.methods',
  'd2/sdk/controls/dialogs/generic/dialog.content.views',
  'd2/sdk/controls/icon.sprites/tree.icon.sprites',
  'd2/sdk/controls/icon.sprites/node.icon.sprites',
  'd2/sdk/controls/table/cells/cell.factory',
  'd2/sdk/integration/folder.browser.id.rules',
  'd2/sdk/utils/landingpage/default.widget.types.map',
  'd2/sdk/utils/landingpage/tiles',
  'd2/sdk/utils/perspectives/app.scope.perspectives',
  'd2/sdk/utils/commands'
],{});

csui.define('d2/utils/sdk.startup',[
  'module',
  'require',
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/utils/log',
  'd2/sdk/models/module.collection',
  'dctmw/utils/utils',
  'd2/utils/sdk.ext.loader'
], function (module, require, _, $, log, ServerModuleCollection, utils) {
  'use strict';

  var logger = log(module.id);
  var pluginModuleModels = new ServerModuleCollection().getPluginModules();

  function createChainedExecutor(relativeModulePath, functionName) {
    if (!relativeModulePath.startsWith('/')) {
      relativeModulePath = ('/' + relativeModulePath);
    }

    return function () {
      var context = this,
        args = arguments,
        modulePaths = pluginModuleModels.map(function (model) {
          return model.get('id') + relativeModulePath;
        });

      return _.reduce(modulePaths, function (promise, moduleId) {
        var dfd = $.Deferred();
        promise.always(function () {
          logger.debug('Loading : ' + moduleId) && console.log(logger.last);
          require([moduleId], function (module) {
            logger.debug('Loaded : ' + moduleId) && console.log(logger.last);
            if (module && _.isFunction(module[functionName])) {
              var retVal = module[functionName].apply(context, args);
              if (utils.isJqueryPromise(retVal)) {
                logger.debug('Async ' + functionName + '() in module ' + moduleId) && console.log(logger.last);
                retVal.done(dfd.resolve).fail(dfd.reject);
              } else {
                logger.debug('Sync ' + functionName + '() in module ' + moduleId) && console.log(logger.last);
                dfd.resolve(retVal);
              }
            } else {
              logger.warn('No ' + functionName + '() in module ' + moduleId) && console.log(logger.last);
              dfd.resolve();
            }
          }, function(e){
            logger.warn('Failed to load : ' + moduleId) && console.log(logger.last);
            dfd.reject(e);
          });
        });

        return dfd.promise();
      }, $.Deferred().resolve().promise());
    };
  }

  return {
    beforeStartup: createChainedExecutor('utils/startup', 'beforeStartup'),
    afterStartup: createChainedExecutor('utils/startup', 'afterStartup')
  };
});

csui.define('d2/sdk/controls/form/form.converter',[
  'd2/widgets/metadata/utils/form.converter'
], function(FormConverterImpl){
  'use strict';

  /**
   * Form converter. Utility to transform D2 Form metadata.
   *
   * @module {d2/sdk/controls/form/form.converter} d2/sdk/controls/form/"form.converter"
   * @name FormConverter
   * @extends {Object}
   */

  /**
   * @typedef {Object} ConversionReturnType
   * @property {Object} propertiesConfig - Alpaca schema for the main form
   * @property {Object} signOffConfig - Alpaca schema for D2 Electronic signature form
   */

  /**
   * @see {@link http://www.alpacajs.org/docs/api/forms.html|Alpaca Forms}
   * @typedef {Object} AlpacaSchema
   * @property {object} data - Object hash of initial values for each field property
   * @property {object} schema - Container of schema properties
   * @property {object} schema.properties - Object hash defining schema for each field property.
   * @property {object} options - Container of additional options
   * @property {object} options.fields - Object hash defining options for each field property.
   *
   * @example
   * var form = {
   *    data: {
   *      field1: 'Hello world!'
   *    },
   *    schema: {
   *      properties: {
   *        field1: {
   *          type: 'string',
   *          required: true
   *        }
   *      }
   *    },
   *    options: {
   *      fields: {
   *        field1: {
   *          type: 'text',
   *          label: 'Greetings'
   *        }
   *      }
   *    }
   * };
   */

  return {
    /**
     * Convert a D2 Form metadata into an Alpaca form schema.
     * @see {@link http://www.alpacajs.org/docs/api/forms.html|Alpaca Forms}
     *
     * @note Alpaca form schema generated through this method does not have to go through `generateFormModelConfig()` method below.
     *
     * @param {JSON} formJSON - Raw dialog-like response received from a D2-REST API or an equivalent object constructed literally.
     * @param {Object} options - Holder of transformer parameters
     * @param {string} [options.actionMode] - How to process the fields. Can be one of 'create', 'read', 'edit'. 'read' is for readonly mode, other two are editable. Value of this option
     * influences the list of fields and their conditions processed as per equivalent D2-config property page field modes.
     * @param {string} [options.layoutMode] - By default fields are laid out in a double column fashion, if a single-column is desired instead set this option to 'singleCol'.
     *
     * @returns {ConversionReturnType} `propertiesConfig` & `signOffConfig` are two separate alpaca form schema to collect properties and user's electronic signature.
     * @static
     */
    convertConfig: function (formJSON, options) {
      return FormConverterImpl.convertConfig(formJSON, options);
    },

    /**
     * Inject additional data into an Alpaca form schema and make it compatible for {@link ./form.model|FormModel} & {@link ./form.view|FormView}.
     * If more than one form is passed in the input, the method also generates cross-reference data if one form uses value from other, for any reason.
     * @param {AlpacaSchema[]} formArray - Array of Alpaca form schemas. The parameter is also the output parameter, each element in the array
     * is modified with additional data.
     * @param {object} [options] - Additional data/control flag used during the conversion.
     * @param {object} [options.initialFieldValueMap] - Initial data reference for all the fields across forms.
     * @returns {void}
     * @static
     */
    generateFormModelConfig: function(formArray, options) {
      return FormConverterImpl.generateFormModelConfig(formArray, options);
    }


  };
});


csui.define('d2/sdk/controls/dialogs/generic/dialog.schema.builder',["nuc/lib/marionette"], function (_nucLibMarionette) {
  let MarionetteObject = _nucLibMarionette.Object;
  class DialogSchemaBuilder extends MarionetteObject {
    constructor(options = {}) {
      super(options);
    }
    async buildSchema(formName, formData) {
      return formData;
    }
  }
  Object.defineProperty(DialogSchemaBuilder.prototype.constructor, "name", {
    value: "DialogSchemaBuilder"
  });
  return DialogSchemaBuilder;
});




csui.define('d2/sdk/controls/dialogs/generic/dialog.schema.builders',["nuc/lib/underscore", "nuc/lib/backbone", "d2/sdk/controls/dialogs/generic/dialog.schema.builder", "dctm-ext!d2/sdk/controls/dialogs/generic/dialog.schema.builders"], function (_, _nucLibBackbone, DialogSchemaBuilder, extSchemaBuilders) {
  let Collection = _nucLibBackbone.Collection;
  let Model = _nucLibBackbone.Model;
  class SchemaBuilderModel extends Model {
    #builderInstance;
    constructor(attr, options) {
      super(attr, options);
    }
    getBuilder() {
      if (!this.#builderInstance) {
        const BuilderClass = this.get("builderClass");
        if (typeof BuilderClass === "function") {
          try {
            this.#builderInstance = new BuilderClass();
          } catch (e) {
            console.warn(e);
          }
        }
        if (!(this.#builderInstance instanceof DialogSchemaBuilder)) {
          this.#builderInstance = new DialogSchemaBuilder();
        }
      }
      return this.#builderInstance;
    }
    buildSchema(formName, formData) {
      return new Promise((res, rej) => {
        let retVal = this.getBuilder().buildSchema(formName, formData);
        if (retVal instanceof Promise) {
          retVal.then(res, rej);
          return;
        } else if (retVal === undefined || retVal === null) {
          retVal = formData;
        }
        res(retVal);
      });
    }
  }
  class SchemaBuilderCollection extends Collection {
    constructor(models, options = {}) {
      super(models, options);
    }
    buildSchema(formName, formData) {
      let lastPromise = Promise.resolve(formData);
      this.each(model => {
        const callBack = (function (formData) {
          return this.buildSchema(formName, formData);
        }).bind(model);
        lastPromise = lastPromise.then(callBack, callBack);
      });
      return lastPromise;
    }
  }
  Object.assign(SchemaBuilderModel.prototype, {
    defaults: {
      sequence: 10000
    }
  });
  Object.assign(SchemaBuilderCollection.prototype, {
    model: SchemaBuilderModel,
    comparator: "sequence"
  });
  Object.defineProperty(SchemaBuilderModel.prototype.constructor, "name", {
    value: "SchemaBuilderModel"
  });
  Object.defineProperty(SchemaBuilderCollection.prototype.constructor, "name", {
    value: "SchemaBuilderCollection"
  });
  const schemaBuilders = new SchemaBuilderCollection();
  if (extSchemaBuilders) {
    let builders = [].concat(_.flatten(extSchemaBuilders, true));
    schemaBuilders.add(builders, {
      merge: false
    });
  }
  return schemaBuilders;
});


csui.define('d2/dialogs/generic/dialog.schema.builder',["nuc/lib/underscore", "nuc/lib/marionette", "nuc/models/nodes", "d2/sdk/controls/form/form.converter", "d2/sdk/controls/dialogs/generic/dialog.schema.builders", "d2/utils/constants"], function (_, _nucLibMarionette, NodeCollection, _d2SdkControlsFormFormConverter, extSchemaBuilders, constants) {
  let MarionetteObject = _nucLibMarionette.Object;
  let convertConfig = _d2SdkControlsFormFormConverter.convertConfig;
  class DialogSchemaBuilder extends MarionetteObject {
    #nodes;
    #data;
    constructor(options = {}) {
      super(options);
      this.#nodes = options.nodes instanceof NodeCollection ? options.nodes : new NodeCollection();
      this.#data = options.data || ({});
    }
    buildSchema(dialogName, formData) {
      return new Promise(res => {
        if (_.isObject(formData.dialog)) {
          let actionMode = formData.dialog.mode || this.#data?.mode;
          if (!["create", "import", "edit"].find(m => m === actionMode)) {
            actionMode = "edit";
          }
          const schema = convertConfig(formData, {
            actionMode: actionMode,
            layoutMode: this.options.viewMode === constants.WizardType.SIDE_PANEL ? "singleCol" : null,
            d2FormNodeIds: this.#nodes.pluck("id"),
            enableNonFieldExpression: true,
            dialogName: dialogName
          });
          schema.generalConfig = {
            buttons: _.deepClone(formData?.dialog?.buttons?.button) || [],
            id: formData?.dialog.id,
            title: formData?.dialog.label,
            mode: actionMode
          };
          res(schema);
        } else {
          res(formData);
        }
      }).then(data => {
        return extSchemaBuilders.buildSchema(dialogName, data);
      });
    }
  }
  Object.defineProperty(DialogSchemaBuilder.prototype.constructor, "name", {
    value: "DialogSchemaBuilder"
  });
  return DialogSchemaBuilder;
});


csui.define('d2/dialogs/generic/dialog.state',["nuc/lib/underscore", "nuc/lib/marionette", "nuc/models/nodes", "d2/dialogs/generic/dialog.schema.builder", "d2/dialogs/generic/dialog.state.methods"], function (_, _nucLibMarionette, NodeCollection, DialogSchemaBuilder, dialogStateMethods) {
  let MarionetteObject = _nucLibMarionette.Object;
  class DialogState extends MarionetteObject {
    #actionParams;
    #nodes;
    #formSet = {};
    #formNames = [];
    #formIndex = -1;
    #id;
    constructor(options = {}) {
      super(options);
      this.#nodes = options.nodes instanceof NodeCollection ? options.nodes : new NodeCollection();
      this.#actionParams = options.data || ({});
      this.schemaBuilder = new DialogSchemaBuilder(options);
    }
    previousForm() {
      if (this.#formIndex < 1) {
        return Promise.reject("Previous form does not exist");
      }
      const previousFormName = this.#formNames[this.#formIndex - 1];
      return this.gotoForm(previousFormName);
    }
    nextForm() {
      if (this.#formIndex + 1 < this.#formNames.length) {
        return Promise.reject("Next form does not exist");
      }
      const nextFormName = this.#formNames[this.#formIndex + 1];
      return this.gotoForm(nextFormName);
    }
    getRelativeFormPosition(srcForm, destForm) {
      const srcFormIndex = this.#formNames.indexOf(srcForm), destFormIndex = this.#formNames.indexOf(destForm);
      if (destFormIndex !== -1) {
        return srcFormIndex === -1 || destFormIndex >= srcFormIndex;
      }
      return null;
    }
    getCurrentFormName() {
      return this.#formIndex !== -1 ? this.#formNames[this.#formIndex] : null;
    }
    gotoForm(formName) {
      return new Promise((res, rej) => {
        if (!formName) {
          rej("Form name is missing");
          return;
        }
        const existIndex = this.#formNames.indexOf(formName);
        if (existIndex !== -1) {
          if (existIndex > this.#formIndex) {
            this.#formNames[this.#formIndex++] = this.#formNames[existIndex];
            this.#formNames.length = this.#formIndex + 1;
          } else if (existIndex < this.#formIndex) {
            this.#formIndex = existIndex;
          }
          return res(this.#formSet[this.getCurrentFormName()]);
        } else {
          this.applyFormStateMethod({
            formName,
            method: "GET"
          }).then(res, rej);
        }
      });
    }
    validateForm(formData) {
      return this._invokeDialogService("VALIDATE", formData);
    }
    cancelForm(formData) {
      return this._invokeDialogService("CANCEL", formData);
    }
    _invokeDialogService(method, formData) {
      return this.applyFormStateMethod({
        method: method,
        formData
      });
    }
    applyFormStateMethod(options = {}) {
      let {formName, method, formData} = options;
      if (!formName) {
        formName = this.getCurrentFormName();
      }
      if (!_.isString(formName) || _.isEmpty(formName)) {
        return Promise.reject("Unknown current state of the dialog.");
      }
      if (!_.isString(method) || _.isEmpty(method)) {
        return Promise.reject("Missing method name");
      }
      if (this.#formIndex === -1) {
        this.#id = _.uniqueId(formName);
      }
      if (this.#formSet[formName]) {
        this.#formSet[formName].formData = formData;
      }
      const resp = {}, formResponseSet = _.reduce(this.#formSet, function (map, value, key) {
        map[key] = value.originalResponse;
        return map;
      }, {});
      return dialogStateMethods.execute({
        dialogId: this.#id,
        formName,
        nodes: this.#nodes,
        actionParams: {
          ...this.#actionParams
        },
        formResponseSet,
        ...options
      }, resp).then(() => {
        return new Promise((res, rej) => {
          this.schemaBuilder.buildSchema(formName, _.deepClone(resp["page-content"])).then(formSchema => {
            const result = {
              formName,
              originalResponse: resp,
              formSchema
            };
            if (formSchema.generalConfig) {
              const nextFormName = formSchema.generalConfig.id;
              result["formName"] = nextFormName;
              this.#formSet[nextFormName] = result;
              let matchIndex = this.#formNames.indexOf(nextFormName);
              if (matchIndex !== -1) {
                if (matchIndex > this.#formIndex) {
                  this.#formIndex++;
                  this.#formNames.length = this.#formIndex + 1;
                  this.#formNames[this.#formIndex] = nextFormName;
                } else {
                  this.#formIndex = matchIndex;
                }
              } else {
                this.#formNames.push(nextFormName);
                this.#formIndex = this.#formNames.length - 1;
              }
            }
            res(result);
          }).catch(rej);
        });
      }).catch(e => {
        console.error(e.errorDetails || e.details || e.message);
        throw e;
      });
    }
  }
  Object.defineProperty(DialogState.prototype.constructor, "name", {
    value: "DialogState"
  });
  return DialogState;
});


csui.define('d2/dialogs/generic/dynamic.dialog',["nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/utils/non-emptying.region/non-emptying.region", "csui/controls/form/pub.sub", "csui/utils/commandhelper", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/generic/dialog.state", "d2/dialogs/generic/dialog.content.view.resolver", "d2/dialogs/generic/dialog.action.collection", "d2/utils/constants", "i18n!d2/controls/stepper.wizard/impl/nls/lang"], function (_, $, _nucLibMarionette, NonEmptyingRegion, PubSub, CommandHelper, StepperWizard, DialogState, dialogContentViewResolver, dialogActions, constants, lang) {
  let View = _nucLibMarionette.View;
  class DynamicDialog extends StepperWizard {
    constructor(options = {}) {
      super(options);
    }
    initialize() {
      this.dialogState = new DialogState(this.options);
      this.steps = {};
      this.previousStepMappings = {};
      this.stepTitleStack = [];
      this.listenTo(PubSub, "d2:form:expression:executed", this._formExpressionExecuted);
    }
    _validateStepId(stepId) {
      return _.isString(stepId) && !_.isEmpty(stepId);
    }
    show(stepId) {
      if (!this.isVisible) {
        if (!this._validateStepId(stepId)) {
          stepId = this?.options?.name;
        }
        if (!this._validateStepId(stepId)) {
          throw new Error("Unknown beginning step, either pass a 'stepId' or set 'name' in constructor options");
        }
        this.currentStep = stepId;
        this._hideButton(this.currentStep, "previous");
        var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
          el: container
        });
        region.show(this);
      }
      return this;
    }
    gotoStep(stepId) {
      if (stepId) {
        if (stepId === "finish") {
          this.close();
          return;
        }
        const lastStep = this.steps[this.currentStep];
        this.currentStep = stepId;
        this._hideCurrentView();
        this._renderCurrentStep(this.dialogState.getRelativeFormPosition(lastStep.id, this.currentStep), lastStep);
      }
    }
    _renderCurrentStep(isAnimationDirectionFromEnd, lastStep) {
      this.blockActions();
      this.dialogState.gotoForm(this.currentStep).then(formData => {
        formData.layoutMode = this.options.viewMode === constants.WizardType.SIDE_PANEL ? "singleCol" : null;
        return new Promise((res, rej) => {
          dialogContentViewResolver.resolveView(formData).then(view => res({
            formData,
            view
          })).catch(rej);
        });
      }).then(this._buildDynamicStep.bind(this)).then(() => {
        this._adoptCurrentStep(isAnimationDirectionFromEnd, lastStep);
        this._showCurrentView(isAnimationDirectionFromEnd);
      }).catch(e => {
        this.cancel();
        this.handleError(e);
      }).finally(this.unblockActions.bind(this));
    }
    _buildDynamicStep(options) {
      let {formData: {formName, formSchema}, view} = options;
      return new Promise((res, rej) => {
        if (typeof view === "function") {
          view = new view(options.formData);
        }
        if (!(view instanceof View)) {
          rej("A marionette view was not found");
          return;
        }
        this.currentStep = formName;
        this.steps[this.currentStep] = {
          id: this.currentStep,
          title: formSchema?.generalConfig.title,
          buttons: formSchema?.generalConfig.buttons || [],
          view,
          formData: options.formData
        };
        res(options);
      });
    }
    _adoptCurrentStep(isAnimationDirectionFromEnd, lastStep) {
      let step = this.steps[this.currentStep], lastStepTitle;
      if (this.headerView) {
        lastStepTitle = this.headerView.getTitle();
        this.headerView.setStep(step);
        this._triggerDomRefreshOnView(this.headerView);
      }
      if (isAnimationDirectionFromEnd === true) {
        if (lastStep) {
          if (lastStep.transient === false) {
            this.stepTitleStack.push(lastStepTitle);
            this.previousStepMappings[step.id] = lastStep.id;
          } else {
            let fallbackStepId = lastStep.id;
            while (fallbackStepId && this.steps[fallbackStepId].transient === true) {
              fallbackStepId = this.previousStepMappings[fallbackStepId];
            }
            this.previousStepMappings[step.id] = fallbackStepId;
          }
        }
      } else {
        this.stepTitleStack.pop();
      }
      if (this.footerView) {
        var backButton = _.find(step.buttons, function (button) {
          return button.id === "previous";
        });
        if (backButton) {
          backButton.defaultTooltip = this.usePreviousStepTitleAsBackButtonTooltip && _.last(this.stepTitleStack) || lang.labelPrevious;
        }
        this.footerView.setStep(step);
        this._triggerDomRefreshOnView(this.footerView);
      }
      this.currentView = step.view;
    }
    _onModalShown() {
      if (!this.isMinimized) {
        this.trigger("wizard:shown");
        this._triggerEventOnChannel("wizard:shown");
      } else {
        this.isMinimized = false;
        this.trigger("wizard:restored");
        this._triggerEventOnChannel("wizard:restored");
      }
      this._triggerDomRefreshOnView(this.headerView);
      this._triggerDomRefreshOnView(this.footerView);
      this.currentStep && this.steps[this.currentStep] && this._triggerDomRefreshOnView(this.steps[this.currentStep].view);
    }
    _onButtonClick(buttonAttributes) {
      const formName = this.dialogState.getCurrentFormName();
      this.blockActions();
      dialogActions.findAction(formName, buttonAttributes).execute({
        formName,
        button: buttonAttributes,
        formView: this.currentView,
        dialogState: this.dialogState,
        nodes: this.options.nodes,
        dialog: this
      }).catch(e => {
        this.handleError(e, {
          button: buttonAttributes,
          formData: this.steps[this.currentStep]?.formData
        });
      }).finally(() => {
        if (!this._isDestroyed) {
          this.unblockActions();
        }
      });
    }
    handleError() {
      dialogContentViewResolver.handleError.apply(dialogContentViewResolver, arguments);
    }
    minimize(promise, notificationTooltip) {
      return super.minimize(promise, notificationTooltip);
    }
    restore() {
      return super.restore();
    }
    cancel() {
      if (this.isVisible && !this.isClosing) {
        this.isClosing = true;
        super._cancel.apply(this, arguments);
      }
    }
    close(data) {
      var refreshWidget = false, refreshCheckoutState = false, locateAndRefresh = false;
      if (data?.formSchema?.success !== undefined) {
        var dialoigResult = data?.formSchema?.success;
        refreshWidget = dialoigResult?.refreshWidget === true ? true : this.options?.data?.refreshWidget === "true";
        refreshCheckoutState = dialoigResult?.refreshCheckoutState === true ? true : this.options?.data?.refreshCheckoutState === "true";
        locateAndRefresh = dialoigResult?.locateAndRefresh === true ? true : this.options?.data?.locateAndRefresh === "true";
      }
      CommandHelper.postCommandOperation({
        refreshWidget: refreshWidget,
        refreshCheckoutState: refreshCheckoutState,
        locateAndRefresh: locateAndRefresh,
        selectedNodes: this.options?.nodes,
        collection: this.options?.collection,
        context: this.options?.context,
        originatingView: this.options?.originatingView
      });
      this._processForAlertAndToastMessage(dialoigResult, this.options?.data?.DIALOG_NAME);
      return super.close();
    }
    _processForAlertAndToastMessage(dialoigResult, defaultTitle) {
      var message = dialoigResult?.message;
      if (message !== undefined && message?.type !== undefined) {
        csui.require(["dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/controls/globalmessage/globalmessage"], function (ModalAlert, GlobalMessage) {
          if (message?.type === constants.ModelAlertTypes.ALERT) {
            var buttonOptions = {
              showYes: true,
              labelYes: lang.labelYes,
              showNo: false,
              showCancel: false
            };
            ModalAlert.showMessage(function () {}, message?.content, message?.title === undefined ? defaultTitle : message?.title, {
              buttons: buttonOptions
            });
          } else if (message?.type === constants.ModelAlertTypes.TOAST) {
            GlobalMessage.showMessage(lang.labelSuccess, message?.content);
          }
        });
      }
    }
    _formExpressionExecuted(control, methodName, value) {
      var buttonModel = this.footerView?.collection.findWhere({
        "id": control
      });
      if (buttonModel) {
        switch (methodName) {
          case "setEnabled":
            buttonModel.set("disabled", !value);
            break;
          case "setVisible":
            buttonModel.set("hidden", !value);
            break;
          default:
            return;
        }
      }
      this.footerView?.refresh([control]);
    }
  }
  Object.defineProperty(DynamicDialog.prototype.constructor, "name", {
    value: "DynamicDialog"
  });
  return DynamicDialog;
});


csui.define('d2/sdk/commands/command',[
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'csui/models/command',
  'd2/overrides/csui/models/command'
], function(_, $, CommandModelImpl){
  'use strict';

  /**
   * Interface for classes that implement a business action over one or more {@link ../models/node.model|NodeModel}.
   *
   * @see {@link ./progressive.nodes.command|ProgressiveNodesComamnd}
   *
   * An implementation should be registered with the {@link ../utils/commands|CommandCollection} by an extension configuration.
   * @example
   * <caption>module mybundle/commands/my.command.js can be defined as</caption>
   *
   * define([
   *    'nuc/lib/jquery',
   *    'd2/sdk/commands/command'
   * ], function($, CommandModel){
   *  var MyCommandModel = CommandModel.extend({
   *     defaults: {
   *        signature: 'MyCommand',
   *        name: 'Example name',
   *        scope: 'single' // Indicates that this action could be executed on a selection of atmost one node, other possible value is 'multiple'
   *     },
   *
   *     enabled: function(status, options) {
   *        return true; // enabled always
   *     },
   *
   *     execute: function(status, options) {
   *        var firstNode = status.nodes.get(0);
   *        console.log("The first node object is: " + firstNode.get('name');
   *        return $.Deferred().resolve().promise(); // Here this command execution will be considered complete as soon as execute() returns
   *     }
   *  });
   *
   *  return MyCommandModel;
   * });
   *
   * @example
   * <caption> to register the command with command collection, in extension.json </caption>
   * {
   *   "d2/sdk/utils/commands": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/commands/my.command"
   *        }
   *      }
   *    }
   * }
   *
   * @module {d2/sdk/commands/command} d2/sdk/commands/command
   * @name CommandModel
   * @extends {external:Backbone.Model}
   * 
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * Type of data passed as first argument for any command execution.
   * @typedef {Object} CommandStatus
   * @property {boolean} [suppressSuccessMessage=false] - Setting it to `true` suppresses display of a success toast when this command execution completes successfully.
   * @property {boolean} [suppressFailMessage=false] - Setting it to `true` suppresses display of any error toast even if the command completes with error.
   * @property {NodeCollection} nodes - instance of {@link ../models/node.collection|NodeCollection}, on which node object(s) this command is being executed.
   * @property {Context} [context] - Active application context
   * @property {ToolitemModel} [toolitem] - The menu behind this action, if any.
   * @property {Marionette.View} [originatingView] - The associated UI component where this command is being executed.
   */

  /*
   * Create a new CommandModel. Does not usually require an instantiation though, it can be looked up from the [CommandCollection]{@link ../utils/commands}
   * @class
   * @extends Backbone.Model
   * @alias module:CommandModel
   */
  var CommandModel = CommandModelImpl.extend({
    constructor: function CommandModel(attributes, options) {
      CommandModel.__super__.constructor.call(this, attributes, options);
    },

    /**
     * Get key associated with this command instance.
     * @returns {string} The key/signature of this command.
     * @instance
     *
     */
    getCommandKey: function() {
      return CommandModel.__super__.getCommandKey.call(this);
    },

    /**
     * Whether this command is non-promoted.
     * @returns {boolean} `true` if non-promoted, `false` otherwise.
     * @instance
     *
     */
    isNonPromoted: function(status) {
      return CommandModel.__super__.isNonPromoted.call(this, status);
    },

    /**
     * Whether this command should be enabled for a particular toolbar.
     * @param {CommandStatus} status - Object hash containing the contextual data
     * @param {object} [options] - Additional options that are not part of contextual data like settings
     * @returns {boolean} `true` if the command should be considered as enabled, `false` otherwise
     * @instance
     *
     */
    enabled: function(status, options) {
      return CommandModel.__super__.enabled.call(this, status, options);
    },

    /**
     * Business logic that executes as part of user interacting with this command (usually through a toolbar action).
     *
     * A toast message is usually (unless suppressed) shown in the UI when execution completes and based on the state of the returned promise it can either be a success or an error toast.
     * @param {CommandStatus} status - Object hash containing the contextual data
     * @param {object} [options] - Additional options that are not part of contextual data like settings
     * @returns {jQuery.Promise} The return promise object should be resolved to mark completion of the command execution successfully, whereas a rejection would indicate otherwise
     * @abstract
     * @instance
     *
     * @example <caption>Sample implementation of `execute` could look like</caption>
     * var MyCommand = CommandModel.extend({
     *  ...
     *
     *  execute: function(status, options) {
     *    var promise = $.Deferred().promise();
     *    if(status.say === 'hello') {
     *      console.log('I completed successfully');
     *      promise.resolve();
     *    } else {
     *      console.log('I completed with failure');
     *      promise.reject();
     *    }
     *
     *    return promise;
     *  }
     * });
     */
    execute: function(/*status, options*/) {
      return $.Deferred().resolve().promise();
    }
  });

  /**
   * Attribute types.
   * @typedef {Object} AttributeType
   * @property {string} signature - A unique identifier.
   * @property {string} name - Display name. Usually gets overriden by menu item's label if this `CommandModel` is bound to a toolbar menu item.
   * @property {string} [scope=single] - How many `NodeModel`s this command can execute on simultaneously. Possible values `single` and `multi`.
   */

  /**
   * @name attributes
   * @type {AttributeType}
   * @description Required attributes. Can be defined using `defaults` hash, checkout the example.
   * @see {@link https://backbonejs.org/#Model-attributes|Backbone.Model#attributes} for more details.
   * @memberOf module:CommandModel
   * @instance
   */

  /**
   * @name extend
   * @function
   * @memberof module:CommandModel
   * @description To define a derived type from `CommandModel`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return CommandModel;
});

csui.define('d2/sdk/commands/call.service.command',[
  'd2/commands/call.service'
], function(CallServiceImpl){
  'use strict';

  /**
   * Base class for implementing command/menu that invokes a D2FS service method. D2 Smartview runtime already provides an OOTB binding
   * for such a command implementation. However, to suit particular business needs where an OOTB binding does not suffice, a new implementation
   * extending from this module can be used to define such custom bindings.
   *
   * @see {@link ./command|CommandModel}
   * @see {@link ./node.actions.rules|NodeActionsRules}
   *
   * @example <caption>to register binding for a custom implementation, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/node.actions.rules": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.node.actions.rules"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.node.actions.rules.js is defined similar to</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {
   *        command_key: 'D2-CustomCallService',
   *        decides: function(item) {
   *          return item.action === 'D2_ACTION_EXECUTE' &&
   *            item.actionParameters && item.actionParameters.eService === 'PermissionActionService';
   *        }
   *        iconName: 'some_icon'
   *      }
   *    ];
   * });
   *
   * @example
   * <caption> to register an implementation with command collection, in extension.json </caption>
   * {
   *   "d2/sdk/utils/commands": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/commands/my.custom.call.service"
   *        }
   *      }
   *    }
   * }
   *
   * @example
   * <caption>module mybundle/commands/my.custom.call.service can be defined as</caption>
   *
   * define([
   *    'nuc/lib/jquery',
   *    'd2/sdk/commands/call.service.command'
   * ], function($, CallServiceCommandImpl){
   *  var MyCustomCallService = CallServiceCommandImpl.extend({
   *     defaults: {
   *        command_key: 'D2-CustomCallService',
   *        signature: 'D2-CustomCallService',
   *        name: 'Custom call service'
   *     },
   *
   *     constructor: function MyCustomCallService(attr, options) {
   *        MyCustomCallService.__super__.constructor.call(this, attr, options);
   *     }
   *
   *     beforeServiceCall: function(nodes, commandData) {
   *        var requestProperties = {};
   *        //Custom logic to populate
   *        return requestProperties; //It will be mixed with other default properties as part of request body while sending d2-generic-action-service
   *     },
   *
   *     afterServiceCall: function(nodes, commandData, responseProperties) {
   *        //Custom logic to modify responseProperties
   *        //Later this modified responseProperties becomes input for final JS action invocation.
   *     }
   *  });
   *
   *  return MyCustomCallService;
   * });
   *
   * @module {d2/sdk/commands/call.service.command} d2/sdk/commands/"call.service.command"
   * @name CallServiceCommand
   * @extends {CommandModel}
   */

  var CallServiceCommand = CallServiceImpl.extend({
    constructor: function CallServiceCommand(attr, options) {
      CallServiceCommand.__super__.constructor.call(this, attr, options);
    },

    /**
     * Make changes to the request properties sent out for underlying D2-REST API call.
     * @param {NodeModel[]} nodes - Selected NodeModel objects upon which the command is being run.
     * @param {Object} commandData - Object hash containing the default invocation properties
     * @return {Object} Returns the final properties set to be used as part of request body. Will also be mixed with the default properties.
     */
    beforeServiceCall: function(nodes, commandData) {
      return CallServiceCommand.__super__.beforeServiceCall.call(this, nodes, commandData);
    },

    /**
     * Change invocation data for final JS action
     * @param {NodeModel[]} nodes - Selected NodeModel objects upon which the command is being run.
     * @param {Object} commandData - Object hash containing the default invocation properties
     * @param {Object} responseProperties - Raw response from underlying D2-REST API call. The same object is also used to invoke final JS action.
     * @return void
     */
    afterServiceCall: function(nodes, commandData, responseProperties) {
      CallServiceCommand.__super__.afterServiceCall.call(this, nodes, commandData, responseProperties);
    }
  });

  return CallServiceCommand;
});

csui.define('d2/sdk/commands/progressive.nodes.command',[
  'd2/commands/node.progress.command'
], function(NodeProgressCommandImpl){
  'use strict';

  /**
   * Interface for classes that implements business actions over one or more {@link ../models/node.model|NodeModel} such that
   * progress of the action is collectively portrayed on a UI component called ProgressPanel.
   *
   * Normal behavior flow is as follows:
   * 1. The progress panel is displayed, and progress gets updated based on the completion of individual node processing.
   * 2. In case the processing for any node fails, or if user aborts the processing (either using *Stop* button for all pending items, or using Cancel icon against each item), or if `doneCommand` options are enabled and there are multiple nodes and at least one node is not within the `commandContainer`, then the progress panel will remain visible after all processing is complete. User can expand it to see individual item status.
   * 3. In case the processing is successful, then progress panel is removed, and toast message is displayed with success details. If it was a single node and `doneCommand` was applicable, then the toast message will also include done command link.
   *
   * An implementation should be registered with the command collection.
   *
   * @example <caption>A sample implementation delete.js could look like</caption>
   * define([
   *    'nuc/lib/jquery',
   *    'd2/sdk/commands/progressive.nodes.command',
   *    'i18n!mybundle/commands/commands.lang'
   * ], function($, ProgressiveNodesCommand, lang){
   *    var DeleteCommand = ProgressiveNodesCommand.extend({
   *      defaults: {
   *        signature: 'Delete',
   *        command_key: 'Delete',
   *        name: lang.CommandNameDelete,
   *        pageLeavingWarning: lang.DeletePageLeavingWarning,
   *        scope: 'multiple'
   *      },
   *
   *      preProcess: function (status, options) {
   *        options || (options = {});
   *        var me = this,
   *        deferred = $.Deferred();
   *
   *        // Do something...
   *
   *        me._confirmAction(status, options).done(function (deleteOptions) {
   *          options.deleteOptions = deleteOptions;
   *          deferred.resolve();
   *        }).fail(function () {
   *          deferred.reject();
   *        });
   *
   *        return deferred.promise();
   *     },
   *
   *     doAction: function (node, options) {
   *        var deferred = $.Deferred();
   *        node.destroy({
   *          wait: true,
   *          deleteOptions: options.deleteOptions,
   *          container: options.container
   *        }).done(function () {
   *          deferred.resolve(node);
   *        }).fail(deferred.reject);
   *
   *        return deferred.promise();
   *      },
   *
   *      handleResults: function (results, options) {
   *        var sourceCollection = options.originatingView && options.originatingView.collection,
   *        deletedIds = _.compact(_.map(results || [], function (result) {
   *          if (result instanceof Backbone.Model) {
   *            return result.get('id');
   *          }
   *        }));
   *
   *        if (deletedIds.length > 0) {
   *          options.context.trigger('d2:objects:deleted', deletedIds);
   *        }
   *
   *        return sourceCollection.fetch({reload: true});
   *      },
   *
   *      getMessageOptions: function () {
   *        return {
   *          oneFilePending: lang.DeletingOneItem,
   *          multiFilePending: lang.DeletingManyItems,
   *          oneFileSuccess: lang.DeleteOneItemSuccessMessage,
   *          multiFileSuccess: lang.DeleteManyItemsSuccessMessage,
   *          oneFileFailure: lang.DeleteOneItemFailMessage,
   *          multiFileOneFailure: lang.DeleteManyItemsOneFailMessage,
   *          multiFileFailure: lang.DeleteManyItemsFailMessage,
   *          someItemsStopped: lang.DeleteStopped,
   *          actionType: 'DELETE'
   *        };
   *      },
   *
   *      // Other methods...
   *    });
   * });
   *
   * @example
   * <caption> to register the command with command collection, in extension.json </caption>
   * {
   *   "d2/sdk/utils/commands": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/commands/delete"
   *        }
   *      }
   *    }
   * }
   *
   *
   * @module {d2/sdk/commands/progressive.nodes.command} d2/sdk/commands/"progressive.nodes.command"
   * @name ProgressiveNodesCommand
   * @extends {external:CommandModel}
   *
   */

  /**
   * @external CommandModel
   * @see ./command
   */

  /**
   * @typedef {Object} DoneCommandOption
   * @property {string} signature - Signature of command to execute on click
   * @property {string} label - Label to be shown for the link.
   * @property {string} tooltip - Tooltip for the link.
   */

  /**
   * Type of data passed as first argument for any command execution.
   * @typedef {Object} CommandStatus
   * @property {boolean} [hideSuccessMessage=false] - Setting it to `true` suppresses display of a success toast when this command execution completes successfully.
   * @property {boolean} [hideFailureMessage=false] - Setting it to `true` suppresses display of any error toast even if the command completes with error.
   * @property {boolean} [suppressProgress=false] - Setting it to `true` hides the progress panel UI.
   * @property {DoneCommandOption} [doneCommand] - To show additional link on the success toast message upon command completion.
   * @property {NodeModel} [commandContainer] - This must be provided if `doneCommand` link has to be shown. The link is displayed if given node is not within this container.
   * @property {NodeCollection} nodes - Instance of {@link ../models/node.collection|NodeCollection}, on which node object(s) this command is being executed.
   * @property {Context} [context] - Active application context
   * @property {ToolitemModel} [toolitem] - The menu behind this action, if any.
   * @property {Marionette.View} [originatingView] - The associated UI component where this command is being executed.
   */

  /**
   * Return type. Associated `jQuery.Promise` instance should be `resolve()`-ed or `reject()`-ed to mark either successful completion or failed completion respectively.
   * @typedef {jQuery.Promise} PromiseReturnType
   */

  /**
   * Formattable message to be used in progress panel.
   * @typedef {Object} MessageOptionsType
   * @property {string} oneFilePending - Message to be shown for `single` scoped command during processing, &#x7B;0&#x7D; is substituted with node name.
   * @property {string} actionType - To group several executions of the same command into a single progress panel UI wherever applicable. It is a future scoped option.
   */

  var ProgressiveNodesCommand = NodeProgressCommandImpl.extend({
    /**
     * Apply a preprocessing logic before starting off the actual business action to any node
     * @see {@link external:CommandModel#execute|CommandModel#execute}
     * @param {CommandStatus} status - Object hash containing the contextual data
     * @param {object} options - Additional options that are not part of contextual data like settings
     * @returns {PromiseReturnType}
     * @instance
     * @abstract
     */
    preProcess: function(status, options) {
      return ProgressiveNodesCommand.__super__.preProcess.call(this, status, options);
    },

    /**
     * Execute the business action on a single `node` from within the `status.nodes` of {@link module:ProgressiveNodesCommand#preProcess}
     * @param {NodeModel} node - The current NodeModel being processed
     * @param {object} options - Combined `status` and `options` from {@link module:ProgressiveNodesCommand#preProcess}
     * @returns {PromiseReturnType}
     * @instance
     * @abstract
     */
    doAction: function(node, options) {
      return ProgressiveNodesCommand.__super__.doAction.call(this, node, options);
    },

    /**
     * Apply post processing
     * @param {object[]} results - Elements of the argument correspond to each input node. The element is of type `NodeModel` if the command execution for this node was successful.
     * It is `undefined` if the command execution was aborted. In case of failure the type depends on whatever type was used to `reject()` the associated `jQuery.Promise` from {@link module:ProgressiveNodesCommand#doAction}
     * @param {object} options - Combined `status` and `options` from {@link module:ProgressiveNodesCommand#preProcess}
     * @returns {PromiseReturnType}
     * @instance
     * @abstract
     */
    handleResults: function(results, options) {
      return ProgressiveNodesCommand.__super__.handleResults.call(results, options);
    },

    /**
     * Customize different messages shown in the progress panel UI.
     * @param {object} options - Combined `status` and `options` from {@link module:ProgressiveNodesCommand#preProcess}
     * @returns {MessageOptionsType}
     * @instance
     * @abstract
     */
    getMessageOptions: function(options) {
      return ProgressiveNodesCommand.__super__.getMessageOptions.call(this, options);
    }
  });

  /**
   * @name extend
   * @function
   * @memberof module:ProgressiveNodesCommand
   * @description To define a derived type from `ProgressiveNodesCommand`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return ProgressiveNodesCommand;
});

csui.define('d2/sdk/controls/alerts/customizable.content.modal.alert',[
  'dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert'
], function(CustomModalAlertImpl){
  'use strict';

  /**
   * Shows a modal alert with customized body content.
   *
   * The `options` parameter can contain a property `contentView` that is used as the modal's body. If the `contentView` is not present then
   * in it's all sense it behaves like a regular {@link ./modal.alert|ModalAlert}
   *
   * @see {@link ./modal.alert|ModalAlert} for a list of static methods available to instantiate a modal alert with custom content.
   *
   * @example <caption>To show a ModalAlert with another Marionette.View as content</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/controls/alerts/customizable.content.modal.alert'
   * ], function(Marionette, ModalAlert){
   *  'use strict';
   *
   *  var ContentView = Marionette.LayoutView.extend({
   *    template: false,
   *    className: 'sample-modal-content',
   *    constructor: function ContentView(options) {
   *      options = options || {};
   *      ContentView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      this.$el.text('Hello World!');
   *    }
   *  });
   *
   *  ModalAlert.showInformation(function(result){
   *    console.log(result);
   *  }, '' , 'Greetings', {
   *    buttons: {
   *      showYes: true,
   *      labelYes: 'OK',
   *      showNo: false,
   *      showCancel: false
   *    },
   *    contentView: new ContentView(),
   *    modalClass: 'my-sample-greeting-modal'
   *  });
   * });
   *
   * @module {d2/sdk/controls/customizable.content.modal.alert} d2/sdk/controls/"customizable.content.modal.alert"
   * @name CustomizableContentModalAlert
   * @extends {external:ModalAlert}
   */

  /**
   * @external ModalAlert
   * @see ./modal.alert
   */

  function showModal(options) {
    var alert = new CustomContentModalAlert(options);
    return alert.show();
  }

  var CustomContentModalAlert = CustomModalAlertImpl.extend({
    constructor: function CustomContentModalAlert(options) {
      CustomContentModalAlert.__super__.constructor.call(this, options);
    }
  },{
    _show: showModal
  });

  return CustomContentModalAlert;
});

csui.define('d2/sdk/controls/behaviors/open.app.scope.behavior',[
  'dctmw/controls/behaviors/open.app.scope.behavior'
], function(OpenAppScopeBehaviorImpl){
  'use strict';

  /**
   * A `Marionette.view` behavior to navigate to an application scope perspective. Whichever view uses
   * this behavior, waits for a click event to happen. As a response to the click event, it opens the application
   * scope perspective.
   *
   * A view that has already mixed this behavior, can set a Boolean flag `disableAppScopeBehavior=true` to disable the behavior.
   *
   * @example <caption>To use this behavior in a sample view</caption>
   *
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/behaviors/open.app.scope.behavior',
   *  'd2/sdk/utils/contexts/context.utils'
   * ], function(Marionette, OpenAppScopeBehavior, contextUtil){
   *  'use strict';
   *
   *  var context = contextUtil.getPerspectiveContext();
   *
   *  var MyView = Marionette.LayoutView.extend({
   *    behaviors: {
   *      AppScope: {
   *        behaviorClass: OpenAppScopeBehavior,
   *        context: context,
   *        applicationScope: 'favorites'
   *      }
   *    },
   *    template: false,
   *    onRender: function() {
   *      this.$el.text('Click me to open favorites');
   *    }
   *  });
   * });
   *
   * @module {d2/sdk/controls/behaviors/open.app.scope.behavior} d2/sdk/controls/behaviors/"open.app.scope.behavior"
   * @name OpenAppScopeBehavior
   * @extends {external:Marionette.Behavior}
   */

  /**
   * @external "Marionette.Behavior"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.behavior.html
   */
  var OpenAppScopeBehavior = OpenAppScopeBehaviorImpl.extend({

    /**
     * @constructs
     * @name OpenAppScopeBehavior
     * @alias module:OpenAppScopeBehavior
     * @param {object} options - Constructor options, automatically passed by Marionette from behavior configuration of a view
     * @param {string} options.applicationScope - Name of the application scope to be opened on click.
     * @param {Context} options.context - Reference to the runtime context. See {@link ../../utils/contexts/context.utils#Context|Context}.
     * @param {Boolean} [options.registerClickEventListener] - Whether the view should add a separate `click` event listener. Defaults to `true`.
     * Some views which has already added a click event listener on self element for some purpose, can be reused automatically for this behavior, in that case
     * this flag needs to be set to `false` explicitly.
     * @param {Marionette.View} view - The view instance associated with this behavior instance. Automatically set by Marionette.
     */
    constructor: function OpenAppScopeBehavior(options, view) {
      OpenAppScopeBehavior.__super__.constructor.call(this, options, view);
    }
  });

  return OpenAppScopeBehavior;
});

csui.define('d2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior',[
  'dctmw/controls/behaviors/clientside.infinite.scrolling.behavior'
], function(ClientsideInfiniteScrollingBehaviorImpl){
  'use strict';

  /**
   * A `Marionette.view` behavior to implement infinite scrolling for views operating on `Backbone.Collection`.
   * The collection prototype has to be mixed with {@link ../../models/mixins/browsable.collection.mixin|BrowsableCollectionMixin}
   *
   * @example <caption>To use the behavior on a CompositeView</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior',
   *  'hbs!mybundle/some/path/template.hbs'
   * ], function(Marionette, InfiniteScrollingBehavior, template){
   *  'use strict';
   *
   *  var ChildView = Marionette.ItemView.extend({
   *    className: 'child-view'
   *  });
   *
   *  var MyListView = Marionette.CompositeView.extend({
   *    template: template, //template content simply is <div class="child-container"></div>
   *    childViewContainer: '.child-container',
   *    childView: ChildView,
   *    behaviors: {
   *      IScroll: {
   *        behaviorClass: InfiniteScrollingBehavior,
   *        contentParent: '.child-container', //The scroll parent element
   *        content: '.child-view', // outermost element of each item view
   *        fetchMoreItemsThreshold: 95, //Offset percentage in integer value that indicates when to consider a potential end of the visible list
   *        fetchMoreItemLength: 10 //How many more items to be fetched when scroll position has reached potential end
   *      }
   *    }
   *  });
   * });
   *
   * @module {d2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior} d2/sdk/controls/behaviors/"clientside.infinite.scrolling.behavior"
   * @name ClientsideInfiniteScrollingBehavior
   * @extends {external:Marionette.Behavior}
   */

  /**
   * @external "Marionette.Behavior"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.behavior.html
   */
  var ClientsideInfiniteScrollingBehavior = ClientsideInfiniteScrollingBehaviorImpl.extend({

    /**
     * @constructs
     * @name ClientsideInfiniteScrollingBehavior
     * @alias module:ClientsideInfiniteScrollingBehavior
     * @param {object} options - Constructor options, automatically passed by Marionette from behavior configuration of a view
     * @param {string} options.contentParent - CSS selector to find the scrollable parent element
     * @param {string} options.content - CSS selector to find children of scrollable parent
     * @param {number} options.fetchMoreItemsThreshold - Threshold in percentage, used to calculate whether scrolling has reached end of list.
     * @param {number} options.fetchMoreItemLength - Number of new items to be fetched when scrolling has reached end of list.
     * @param {Marionette.View} view - The view instance associated with this behavior instance. Automatically set by Marionette.
     */
    constructor: function ClientsideInfiniteScrollingBehavior(options, view) {
      ClientsideInfiniteScrollingBehavior.__super__.constructor.call(this, options, view);
    }
  });

  return ClientsideInfiniteScrollingBehavior;
});

csui.define('d2/sdk/controls/blocker/blocker',[
  'csui/controls/progressblocker/blocker'
], function(BlockingViewImpl){
  'use strict';

  /**
   * UI blocker. Used to temporarily make the whole or part of Smart View UI non-interactive to block any unexpected user
   * input while executing a critical piece of logic either in the background or foreground.
   *
   * @module {d2/sdk/controls/blocker/blocker} d2/sdk/controls/blocker/blocker
   * @name BlockingView
   * @extends {Object}
   *
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  return {
    /**
     * Mix progress blocking APIs as well as well as blocker instance to a view.
     * @param {external:Marionette.View} view - The view instance where blocking APIs are to be mixed.
     * @mixes BlockerAPI
     * @memberOf module:BlockingView
     * @example <caption>An item view showing/hiding blocker when its model syncs</caption>
     * define([
     *    'nuc/lib/marionette',
     *    'd2/sdk/controls/blocker/blocker'
     *    'd2/sdk/models/node.model',
     * ], function(Marionette, BlockingView, NodeModel){
     *    'use strict';
     *
     *    var NodeView = Marionette.ItemView.extend({
     *        constructor: function NodeView(options) {
     *            options = options || {};
     *            options.model = new NodeModel({id: options.id}, options);
     *
     *            BlockingView.imbue(this);
     *        },
     *
     *        onRender: function() {
     *          this.blockAction(); // Blocker API that got mixed into this instance due to BlockingView.imbue() above
     *          this.model.fetch().always(this.unblockActions.bind(this));
     *        }
     *    });
     *
     *    return NodeView;
     * });
     *
     */
    imbue: function(view){
      BlockingViewImpl.imbue(view);
    },

    /**
     * Mix progress blocking APIs to a view where the blocker instance is delegated to a different view.
     *
     * Useful when there are more than one view instance with parent-child relationship such that each of the views want to mix
     * blocker APIs in it without creating duplicate blocker instances.
     * @param {external:Marionette.View} view - The view instance where blocking APIs are to be mixed.
     * @param {external:Marionette.View} delegateToView - The view which already has blocker APIs mixed and is going to be used as source of blocker instance.
     * @mixes BlockerAPI
     * @memberOf module:BlockingView
     * @example <caption>An item view showing/hiding blocker when its model syncs</caption>
     * define([
     *    'nuc/lib/marionette',
     *    'd2/sdk/controls/blocker/blocker'
     *    'd2/sdk/models/node.model',
     * ], function(Marionette, BlockingView, NodeModel){
     *    'use strict';
     *
     *    var NodeView = Marionette.ItemView.extend({
     *        constructor: function NodeView(options) {
     *            options = options || {};
     *            options.model = new NodeModel({id: options.id}, options);
     *
     *            BlockingView.delegate(this, options.parentView); // Assuming 'parentView' already has blocker API mixed to it
     *        },
     *
     *        onRender: function() {
     *          this.blockAction(); // Blocker API that got mixed into this instance due to BlockingView.imbue() above
     *          this.model.fetch().always(this.unblockActions.bind(this));
     *        }
     *    });
     *
     *    return NodeView;
     * });
     */
    delegate: function(view, delegateToView) {
      BlockingViewImpl.delegate(view, delegateToView);
    }
  };

  /**
   * Infuses the blocker APIs to a view instance.
   * @mixin BlockerAPI
   */

  /**
   * @name blockActions
   * @function
   * @description to be called on the view instance to show a blocker
   * @memberOf BlockerAPI#
   */

  /**
   * @name unblockActions
   * @function
   * @description to be called on the view instance to hide previously shown blocker
   * @memberOf BlockerAPI#
   */
});

csui.define('d2/sdk/controls/dialogs/content.assist.dialog',[
  'd2/dialogs/target.browse/target.browse'
], function(TargetBrowseImpl){
  'use strict';

  /**
   * Content Assist Dialog. Helps navigating through the repository while selecting an object.
   *
   * Content assist configuration is to be fetched first to control constructor options. See {@link ../../utils/content.assist|ContentAssistDialogUtil}.
   *
   * @example <caption>A typical usage example</caption>
   * define([
   *  'nuc/lib/underscore',
   *  'd2/sdk/controls/dialogs/content.assist.dialog',
   *  'd2/sdk/models/node.model',
   *  'd2/sdk/utils/contexts/context.utils',
   *  'd2/sdk/utils/contexts/factories/connector',
   *  'd2/sdk/utils/content.assist'
   * ], function(_, NodePicker, NodeModel, contextUtils, ConnectorFactory, contentAssistUtil){
   *  'use strict';
   *
   *   var context = contextUtils.getPerspectiveContext(),
   *    connector = context.getObject(ConnectorFactory),
   *    container = new NodeModel({id: '0c0015fa8000291e'}, {connector: connector});
   *
   *    container.fetch()
   *      .done(function(){
   *        showNodePicker(context, connector, container);
   *      })
   *      .fail(function(){
   *        console.log('failed fetching container');
   *      });
   *
   *    function showNodePicker(context, connector, container) {
   *      contentAssistUtil.getContentAssistOptions({context: context})
   *      .done(function(config){
   *        var title = config ? config.label_value : "",
   *          includeBrowse = (config && config.properties) ? config.properties.has_browse_assist : true,
   *          includeFavorites = (config && config.properties) ? config.properties.has_favorites_assist : false,
   *          globalSearch = (config && config.properties) ? config.properties.has_search_assist : false;
   *
   *        // Enable browsing if nothing is enabled
   *        if (!includeBrowse && !includeFavorites && !globalSearch) {
   *          includeBrowse = true;
   *        }
   *
   *        var nodePicker = new NodePicker({
   *          dialogTitle: title,
   *          startLocations: [],
   *          includeBrowse: includeBrowse,
   *          includeFavorites: includeFavorites,
   *          globalSearch: globalSearch,
   *          context: context,
   *          connector: connector,
   *          initialContainer: container,
   *          selectMultiple: false
   *        });
   *
   *        nodePicker.show()
   *          .done(function(selection){
   *            console.log('Selected ' + selection.nodes.length + ' items.');
   *          })
   *          .fail(function(){
   *            console.log('User cancelled');
   *          });
   *      })
   *      .fail(function(){
   *        console.log('failed to load options for the node picker');
   *      });
   *    }
   *
   * });
   *
   * @module {d2/sdk/controls/dialogs/content.assist.dialog} d2/sdk/controls/dialogs/"content.assist.dialog"
   * @name ContentAssistDialog
   * @extends {Object}
   */

  /**
   * @constructs
   * @alias module:ContentAssistDialog
   * @name ContentAssistDialog
   * @param {object} options - Construction options holder
   * @param {string} [options.dialogTitle] - Title of the dialog.
   * @param {Connector} options.connector - The connector instance. See {@link ../../utils/contexts/factories/connector|ConnectorFactory}.
   * @param {external:NodeModel} options.initialContainer - Begin browsing from this folder/cabinet. The passed object must be fetched before hand.
   * @param {Context} options.context - Active application context. See {@link ../../utils/contexts/context.utils|ContextUtils}
   * @param {string[]} options.startLocations - Set the supported content display locations. Supported values are `'search.location', 'current.location', 'favorites'.
   * At least an empty array must be passed if following shorthand flags `globalSearch`, `includeBrowse`, `includeFavorites` are used to control
   * the start locations.
   * @param {Boolean} [options.globalSearch=false] - Show searchable locations. Short hand for setting `search.location` as part of `startLocations`.
   * @param {Boolean} [options.includeBrowse=true] - Show browsable locations from Documentum repository. Short hand for setting `current.location` as
   * part of `startLocations`.
   * @param {Boolean} [options.includeFavorites=false] - Show favorite contents. Short hand for setting `favorites` as part of `startLocations`.
   * @param {Boolean} [options.selectMultiple=false] - Enable multiple selection.
   * @param {string} [options.selectType=null] - Attribute to check while enabling/disabling selectability of a node. `'typeName'` could be used as a value.
   * @param {string} [options.selectTypeValue] - A node is selectable only if its `selectType` attribute's value matches with this value.
   * @param {string[]} [options.excludeTypes] - Exclude these node types from display.
   * @param {string} [options.url_filter=null] - An additional filter query parameter to be used while populating content assist dialog with objects.
   * @param {string} [options.selectButtonLabel] - Text to be shown on the affirmative button.
   *
   */
  var ContentAssistDialog = TargetBrowseImpl;

  /**
   * @name show
   * @function
   * @description Shows the dialog
   * @returns {jQuery.Promise} resolves & invokes `ContentAssistFinishCallback` on positive (select/add) user interaction, rejects otherwise (user cancels).
   * @instance
   */

  /**
   * @callback ContentAssistFinishCallback
   * @param {Object} selectedNodes - Selected nodes holder
   * @param {external:NodeModel[]} selectedNodes.nodes - Collection of nodes that were selected.
   */

  /**
   * @external NodeModel
   * @see ../../models/node.model
   */

  return ContentAssistDialog;
});

csui.define('d2/sdk/controls/dialogs/simple.dialog',[
  'csui/controls/dialog/dialog.view'
], function(DialogViewImpl){
  'use strict';

  /**
   * Create a simple modal dialog. Has customizable header, footer and primary content.
   *
   * @example
   * define([
   *  'd2/sdk/controls/dialogs/simple.dialog'
   * ], function(SimpleDialog){
   *  'use strict';
   *
   *  var dialog = new SimpleDialog({title: 'Greetings', bodyMessage: 'Hello World!'});
   *  dialog.show(); //Dialog is rendered with a close button at top-right corner of the header.
   *
   *  dialog = new SimpleDialog({title: 'Greetings', bodyMessage: 'Hello World!', buttons: [{label: 'OK'}]});
   *  dialog.show();//Dialog header does not show a close button anymore, however SimpleDialog automatically adds a 'Cancel' button to close it.
   *
   * });
   *
   * @module {d2/sdk/controls/dialogs/simple.dialog} d2/sdk/controls/dialogs/"simple.dialog"
   * @name SimpleDialog
   * @extends {external:Marionette.View}
   * @fires "shown.binf.modal"
   * @fires "hidden.binf.modal"
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * @external "jQuery.Event"
   * @see https://api.jquery.com/category/events/event-object/
   */

  /**
   * Triggers on the dialog's HTML element when it is shown.
   * @event module:SimpleDialog#event:"shown.binf.modal"
   * @type {external:jQuery.Event}
   */

  /**
   * Trigger on the dialog's HTML element when it becomes hidden.
   * @event module:SimpleDialog#event:"hidden.binf.modal"
   * @type {external:jQuery.Event}
   */

  /**
   * @typedef {Object} FooterButton
   * @property {string} label - Text to be displayed on the button
   * @property {string} [toolTip] - Tooltip associated with the button.
   * @property {string} [id] - Unique identifier of this button.
   * @property {Boolean} [default] - Whether this button is default button in the footer. Default button is drawn with a visual distinction compared
   * to other buttons.
   * @property {Boolean} [separate] - Whether this button is to be drawn separately.
   * @property {FooterButtonClickCallback} [click] - Callback to handle click event from the button.
   * @property {Boolean} [close] - Whether this button closes the dialog.
   * @property {Boolean} [hidden] - Whether this button should be hidden
   * @property {Boolean} [disabled] - Renders a button in disabled state.
   */

  /**
   * @callback FooterButtonClickCallback
   * @param {object} options
   * @param {*} dialog - The dialog itself.
   * @param {HTMLElement} button - DOM element of the button that is clicked.
   * @param {Object} buttonAttributes - Attributes of the button.
   */

  var SimpleDialog = DialogViewImpl.extend({
    /**
     * @constructs
     * @name SimpleDialog
     * @alias module:SimpleDialog
     * @param {object} options - Constructor options
     * @param {string} options.title - Title of the dialog.
     * @param {Boolean} [options.fullSize] - Whether to show a full page dialog.
     * @param {Boolean} [options.largeSize] - Shows a large dialog.
     * @param {Boolean} [options.midSize] - Shows a medium dialog.
     * @param {Boolean} [options.smallSize] - Shows a small dialog.
     * @param {string} [options.bodyMessage] - A message to be shown at the primary content area.
     * @param {FooterButton[]} [options.buttons] - Buttons to show in the footer if footer is not customized with `footerView` options.
     * `SimpleDialog` automatically adds an additional button to close the dialog.
     * @param {external:Marionette.View} [options.view] - Customize the primary content area with this view instance.
     * @param {external:Marionette.View} [options.headerView] - Customize the dialog's header completely with this view instance.
     * @param {external:Marionette.View} [options.footerView] - Customize the dialog's footer completely with this view instance.
     */
    constructor: function SimpleDialog(options) {
      SimpleDialog.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name show
   * @description Shows the dialog after it has been instantiated
   * @returns {any} The dialog instance
   * @instance
   */

  /**
   * @function
   * @name updateButton
   * @description Updates the dialog's footer button state.
   * @param {string} id - Identifier of the button to be updated.
   * @param {object} [attributes] - New button state properties
   * @param {Boolean} [attributes.hidden] - Whether is button is to be hidden.
   * @param {Boolean} [attributes.disabled] - Whether this button should be disabled.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name destroy
   * @description Hide & close the dialog
   * @returns {void}
   * @instance
   */

  return SimpleDialog;
});

csui.define('d2/sdk/controls/dialogs/stepper.wizard',[
  'd2/controls/stepper.wizard/stepper.wizard.view'
], function(StepperWizardViewImpl){
  'use strict';

  /**
   * Create a modal wizard that navigates through a configured set of steps to achieve some arbitrary functionality.
   * Steps can be navigated in a simple-sequential manner or on-demand hopping manner.
   *
   * @example <caption>Minimal configuration for a two-step wizard</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/dialogs/stepper.wizard'
   *  ],function(Backbone, Marionette, StepperWizard){
   *    'use strict';
   *
   *    new StepperWizard({
   *      steps: [
   *        {
   *          id: 'first',
   *          viewClass: Marionette.View.extend({
   *            template: '<div>First Step View</div>'
   *          }),
   *          title: 'First Step Title',
   *        },
   *        {
   *          id: 'last',
   *          viewClass: Marionette.View.extend({
   *            template: '<div>Last Step View</div>'
   *          }),
   *          title: 'Last Step Title'
   *        }
   *     ]
   *   }).show();
   * });
   *
   * @example <caption>Sample 3-step wizard</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/dialogs/stepper.wizard'
   * ],function(Backbone, Marionette, StepperWizard){
   *  'use strict';
   *
   *  new StepperWizard({
   *    steps: [
   *      {
   *        id: 'first',
   *        viewClass: Marionette.View.extend({
   *          template: '<div>First Step View</div>'
   *        }),
   *        nextStepId: 'second',
   *        title: 'First Step Title',
   *        subTitle: 'First Step Subtitle'
   *      },
   *      {
   *        id: 'second',
   *        viewClass: Marionette.View.extend({
   *          template: '<div>Second Step View</div>'
   *        }),
   *        buttons: [
   *          {
   *            id: 'additional', //An extra button for second step
   *            label: 'Additional',
   *            align: 'begin',
   *            clickHandler: function(){
   *              console.log('additional button clicked at step 2');
   *            }
   *          }
   *        ],
   *        nextStepId: 'third',
   *        previousStepId: 'first',
   *        title: 'Second Step Title'
   *      },
   *      {
   *        id: 'third',
   *        viewClass: Marionette.View.extend({
   *          template: '<div>Third Step View</div>',
   *          onStepActive: function(){
   *            //Refresh all footer buttons
   *            this.options.wizard.refreshFooter();
   *          },
   *          isValid: function() {
   *            //some custom logic to determine the return value here will control 'disabled' state of the 'next' button
   *            return true;
   *          }
   *        }),
   *        buttons: [
   *          {
   *            id: 'next',
   *            label: 'Done',
   *            disabled: function() {
   *              // Enable/Disable the 'Done' button based on validation state after the step has become active
   *              return !this.isValid(); //'this' refers to the view instance of this step
   *            }
   *          }
   *        ],
   *        previousStepId: 'second',
   *        title: 'Third step title',
   *        subTitle: 'This is the last step'
   *      }
   *    ],
   *    data: { //This data will be shared across all step views.
   *      model: new Backbone.Model({})
   *    }
   *  }).show();
   * });
   *
   * @module {d2/sdk/controls/dialogs/stepper.wizard} d2/sdk/controls/dialogs/"stepper.wizard"
   * @name StepperWizard
   * @extends {external:Marionette.View}
   * @fires module:StepperWizard#wizard:shown
   * @fires module:StepperWizard#wizard:minimized
   * @fires module:StepperWizard#wizard:restored
   * @fires module:StepperWizard#wizard:closed
   * @fires module:StepperWizard#wizard:forceclose
   * @fires module:StepperWizard#step:before:active
   * @fires module:StepperWizard#dom:refresh
   * @fires module:StepperWizard#step:active
   * @fires module:StepperWizard#step:before:inactive
   * @fires module:StepperWizard#step:inactive
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * Triggered on the wizard instance after it appears on screen
   * @event module:StepperWizard#wizard:shown
   * @type {string}
   */

  /**
   * Triggered on the wizard instance after it is minimized
   * @event module:StepperWizard#wizard:minimized
   * @type {string}
   */

  /**
   * Triggered on the wizard instance after it is restored from minimized state.
   * @event module:StepperWizard#wizard:restored
   * @type {string}
   */

  /**
   * Triggered on the wizard instance after it is closed.
   * @event module:StepperWizard#wizard:closed
   * @type {string}
   * @param {Boolean} isCancel - Whether the wizard was closed or cancelled.
   * @param {...any} [args] - Any additional parameters passed to `cancel()` or `close()`
   */

  /**
   * Triggered on the wizard instance just before it is about to be force closed due to unplanned page navigation e.g. reload
   * @event module:StepperWizard#wizard:forceclose
   * @type {string}
   */

  /**
   * Triggered on StepView instance when the corresponding step is about to appear on screen.
   * @event module:StepperWizard#step:before:active
   * @type {string}
   */

  /**
   * Triggered on the StepView when it appears on screen.
   * @event module:StepperWizard#dom:refresh
   * @type {string}
   */

  /**
   * Triggered on the StepView after the step has become active and DOM is updated with corresponding view.
   * @event module:StepperWizard#step:active
   * @type {string}
   */

  /**
   * Triggered on the StepView when it is about to disappear from screen.
   * @event module:StepperWizard#step:before:inactive
   * @type {string}
   */

  /**
   * Triggered on the StepView after the view has been removed from DOM.
   * @event module:StepperWizard#step:inactive
   * @type {string}
   */

  /**
   * Configuration for each step
   * @typedef {object} StepConfig
   * @property {string} id - A unique identifier for the step
   * @property {external:Marionette.View} viewClass - View definition(not an instance, the class itself) which will be used to create presentation for the corresponding step.
   * @property {string|function} [nextStepId] - Id of the step, which the wizard should show next. Defaults to 'id' of the next step in config, if any.
   * @property {string|function} [previousStepId] - Id of the step, which the wizard should go back to from present step. Defaults to 'id' of the previous step in config, if any.
   * @property {string|function} [title] - Used to set title for the step
   * @property {string|function} [subTitle] - Used to set sub-title for the step
   * @property {ButtonConfig[]} [buttons] - Configuration to control behavior of default and/or any additional button for this step. Three customizable buttons are automatically created by the wizard to facilitate back & forth navigation between steps and cancellation.
   * Any other buttons configured here will be created upon activation of corresponding step
   * @property {StepCancellationCallback} [onCancel] - Callback to decide whether or not to close a wizard upon receiving CANCEL signal from either `close`,`cancel` button press or `cancel()` API call.
   * @property {object} [viewOptions] - An unmanaged JS Object that will be passed only onto the view's constructor for this step
   * @property {Boolean} [transient=false] - Indicates whether or not this step is to be considered a transient one. A transient step is never kept in step navigation history. In effect, with default navigation setup, clicking back on the step next to a transient step always brings the user back to the step before the transient one
   *
   */

  /**
   * Configuration for a button
   * @typedef {object} ButtonConfig
   * @property {string} id - Identifier for the button. Buttons with `id='next'` & `id='previous'` & `id='cancel'` are already added to the set by the wizard.
   * @property {string} [className] - Name of CSS class to be applied to the button
   * @property {string} [align=end] - Alignment of the button. 'previous', 'next', 'cancel' buttons come with pre-defined but customizable alignment.
   * Buttons aligned on the same side will be placed according to their order of definition
   * @property {string|function} [label] - Label for the button
   * @property {string|function} [ariaLabel] - Accessible title for the button. Defaults to same as `label`, if omitted or kept blank
   * @property {string|function} [toolTip] - Tooltip for the button
   * @property {Boolean|function} [hidden=false] - Whether this button should be hidden upon step activation or not
   * @property {Boolean|function} [disabled=false] - Whether this button should be disabled upon step activation or not. The 'hidden' attribute takes precedence over this 'disabled' attribute
   * @property {ButtonClickHandler} [clickHandler] - Default click handler for this button. This handler gets executed in context of the step's view
   * @note Default `clickHandler` for button with id='previous', id='next' & id='cancel' are already defined by the wizard to control back & forth navigation and cancellation. Overriding those handlers may be desired for an alternative behavior for a step
   *
   */

  /**
   * @callback StepCancellationCallback
   * @returns {jQuery.Promise|void} Return a `JQuery Promise` object to control the decision. The wizard will close or discard the CANCEL signal depending on whether the `Promise` is resolved or rejected.
   * If anything else is returned from the Function or the callback is not defined at all, the default 'CANCEL' signal handler will close the wizard.
   * @note This callback is executed in the context of view instance associated with the current step.
   */

  /**
   * @callback ButtonClickHandler
   * @note This callback is executed in the context of view instance associated with the current step.
   * @returns {void}
   */

  var StepperWizardView = StepperWizardViewImpl.extend({

    /**
     * @constructs
     * @name StepperWizard
     * @alias module:StepperWizard
     * @param {object} options - Constructor options
     * @param {StepConfig[]} options.steps - Step configuration of the wizard. Each step is represented with a different screen and a transition animation
     * is played when the wizard moves from one step to another due to user interaction.
     * @param {Boolean} [options.showPageLeavingWarning=true] - Whether to show a page blocker when user tries to close the wizard.
     * @param {Boolean} [options.suppressHeader=false] - Indicate whether to hide the header.
     * @param {Boolean} [options.suppressFooter=false] - Indicate whether to hide the footer.
     * @param {Boolean} [options.usePreviousStepTitleAsBackButtonTooltip=true] - Whether to show previous step's title as tooltip for `Back` button shown on current step.
     * @param {object} [options.data=undefined] - Any arbitrary piece of data that is shared among all the steps i.e views representing the steps.
     * @param {string} [options.className=undefined] - An additional CSS class name to be used along with its own styling classes. Useful, when specific styling
     * classes are required to be written for step views or customize overall appearance of the wizard.
     */
    constructor: function(options) {
      options = options || {};
      StepperWizardView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name show
   * @description Show the wizard after construction. The wizard becomes visible on screen only after this method is called.
   * @note By default the wizard shows up on the first step as specified in constructor options.
   * @param {string} [stepId] - Instead of starting from the first step, start from this particular step. If a matching step is not found the wizard
   * disregards this parameter and starts from the first step.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name close
   * @description Close and finally destroy the wizard.
   * @param {...any} [arg] - This method could be invoked with any number of parameters. All those parameters will be passed as event parameters for "wizard:closed"
   * event.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name cancel
   * @description Try closing the wizard with a CANCEL signal. If the signal is not interfered with, it eventually causes the wizard to close and destroy itself.
   * @param {...any} [arg] - All arguments that this method is invoked with, will be passed as event parameters for "wizard:closed"
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name minimize
   * @description Hide the wizard from screen without destroying it.
   * @note Only one wizard can be minimized with a notification, every other instance that tries to do the same at the same time will fail to minimize itself
   * @param {jQuery.Promise} [promise] - Whether or not the wizard needs to be minimized with a notification on the toolbar.
   * Usually used when wizard is performing long-running background task on some step and it doesn't want to keep the end user blocked on the modal wizard.
   * Resolve or reject the promise to change status of the notification icon.
   * @param {string} [notificationTooltip] - What should be the tooltip of the notification icon if wizard is minimized with a notification
   * @returns {Boolean} Returns `true` to indicate that the wizard is actually minimized. otherwise returns `false`.
   * @instance
   */

  /**
   * @function
   * @name restore
   * @description Restore a minimized hidden wizard and bring it back on screen.
   * @instance
   */

  /**
   * @function
   * @name prevStep
   * @description Go to previous step as determined by 'steps' configuration of the wizard
   * @instance
   */

  /**
   * @function
   * @name nextStep
   * @description Go to next step as determined by 'steps' configuration of the wizard.
   * @instance
   */

  /**
   * @function
   * @name gotoStep
   * @description Go to specific step with given animation direction. Allows random jump from one step to another.
   * @param {string} stepId - Id of the step to go to
   * @param {Boolean} [animateFromEnd=true] - Whether or not the next step to be sweeped-in from end edge of the wizard.
   * If `false`, the step is sweeped-in from beginning of the wizard.
   * @instance
   */

  /**
   * @function
   * @name refreshHeader
   * @description Refresh header to show updated data (title & subTitle) for the step if they were changed
   * @instance
   */

  /**
   * @function
   * @name refreshFooter
   * @description Refresh footer to show updated button states
   * @note If the method is called without any parameter then all buttons of the active step are refreshed.
   * @param {...string} [buttonId] - Id of the button to refresh. Multiple id could be passed as parameters.
   * @instance
   */

  /**
   * @function
   * @name getData
   * @description Returns a reference to the data shared across steps
   * @returns {*} The data that was set as part of constructor options.
   * @instance
   */

  /**
   * @function
   * @name getId
   * @description Returns a specifier to uniquely identify a wizard instance. Can be used later for inbound radio channel events
   * @returns {string} Unique identifier of this wizard instance
   * @instance
   */

  /**
   * @function
   * @name blockActions
   * @description Creates an indeterminate progress view over the wizard to block user interaction. The blocker remains active until `unblockActions()` is called.
   * @instance
   */

  /**
   * @function
   * @name unblockActions
   * @description Withdraws an active user interaction blocker from over the wizard
   * @instance
   */

  return StepperWizardView;
});

csui.define('d2/sdk/controls/dialogs/generic/d2fs.state.method',["d2/dialogs/generic/impl/state.methods/d2fs.state.method"], function (D2FSStateMethodImpl) {
  class D2FSStateMethod extends D2FSStateMethodImpl {
    constructor(options) {
      super(options);
    }
    execute(options, result) {
      return super.execute(options, result);
    }
    setDialogContextForm(dialogId, action, currentFormName) {
      super.setDialogContextForm(dialogId, action, currentFormName);
    }
    getDialogContextForm(dialogId, action) {
      return super.getDialogContextForm(dialogId, action);
    }
    clearDialogContextForm(dialogId) {
      super.clearDialogContextForm(dialogId);
    }
    getDialogAdditonalParams(options) {
      return super.getDialogAdditonalParams(options);
    }
    extractMergeableFormDataFromResponse(success) {
      return super.extractMergeableFormDataFromResponse(success);
    }
  }
  return D2FSStateMethod;
});


csui.define('d2/sdk/controls/form/form.view',[
  'nuc/lib/underscore',
  'd2/controls/form/d2.form.view'
], function(_, D2FormViewImpl){

  /**
   * FormView. Create and render an arbitrary HTML form using JSON schema. Form also provides manage API to validate & collect form data.
   *
   * Uses `FormModel` to hold the JSON schema that drives the form rendering. See {@link ./form.model|FormModel} for examples of how to
   * create a `FormModel` from literal JSON data and dialog-like D2-REST API response.
   *
   * @example <caption>To create a form view</caption>
   * define([
   *  'd2/sdk/controls/form/form.view',
   *  'd2/sdk/controls/form/form.model'
   * ], function(FormView, FormModel){
   *  'use strict';
   *
   *  var formOptions = {
   *    topAlignedLabel: true,
   *    mode: 'create',
   *    layoutMode: 'singleCol',
   *    model: createFormModel()
   *  };
   *
   *  function createFormModel() {
   *    var formSchema;
   *
   *    // populate form schema
   *
   *    return new FormModel(formSchema);
   *  }
   *
   *  var formView = new FormView(formOptions); //For controlling any business specific, behavior FormView could be extended to attach business specific logic
   *
   *  formView.on('render:form', function(){
   *    console.log('Form is rendered');
   *  });
   *
   *  new Marionette.Region({el: '.my-form-container'}).show(formView);
   * });
   *
   * @module {d2/sdk/controls/form/form.view} d2/sdk/controls/form/"form.view"
   * @name FormView
   * @extends {external:Marionette.ItemView}
   * @fires module:FormView#d2:change:formValidation
   * @fires module:FormView#change:field
   * @fires module:FormView#valid:field
   * @fires module:FormView#invalid:field
   * @fires module:FormView#form:changed
   * @fires module:FormView#render:form
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external FormModel
   * @see ./form.model
   */

  /**
   * Indicates form validation status has changed.
   * @event module:FormView#d2:change:formValidation
   * @type {string}
   */

  /**
   * Indicates a field value has been updated.
   * @event module:FormView#change:field
   * @type {string}
   */

  /**
   * Indicates a field contains a valid value.
   * @event module:FormView#valid:field
   * @type {string}
   */

  /**
   * Indicates a field contains an invalid value.
   * @event module:FormView#invalid:field
   * @type {string}
   */

  /**
   * Indicates that form data has changed somehow.
   * @event module:FormView#form:changed
   * @type {string}
   */

  /**
   * Indicates that form has been fully rendered in UI
   * @event module:FormView#render:form
   * @type {string}
   */


  var FormView = D2FormViewImpl.extend({

    /**
     * @constructs
     * @name FormView
     * @alias module:FormView
     * @param {object} options - Constructor options
     * @param {external:FormModel} options.model - The data holder having schema definition for this form instance.
     * @param {Context} options.context - Reference to the application context.
     * @param {Boolean} [options.topAlignedLabel] - Whether to place label at the top of form field or side-by-side fashion. Defaults to `false`.
     * @param {string} [options.mode] - Controls rendering of the form. Possible values are `'create', 'read', 'update'`. Defaults to `update`. The
     * `read` mode renders a readonly form. Whereas, the `update` & `create` mode are equivalent and allows form field value modification. The difference
     * between `update` and `create` is that form is initially not validated for required values and other conditions for `create` mode until user starts to
     * interact with the form.
     * @param {string} [options.layoutMode] - Whether to layout the form in a single or double column fashion. Supported values are `'singleCol', 'doubleCol'`.
     * Defaults to `singleCol`.
     *
     *
     */
    constructor: function FormView(options) {
      options = options || {};
      FormView.__super__.constructor.call(this, options);
    },

    getFlatFormValueMap: function (map) {
      var me = this,
        properties = {};
      _.each(map, function (value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            _.each(_.keys(value[0]), function (k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          _.extend(properties, me.getFlatFormValueMap(value));
        }
      });
      return properties;
    }
  });

  /**
   * @function
   * @name resetForm
   * @description Reset the current form removing all user inputs.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name validateForm
   * @description Validate current form values and ensure form constraints are met.
   * @param {Boolean} refreshState - Whether to clear previous validation status before running this one.
   * @param {Boolean} validateOnlyRequiredFields - Whether to perform only a required field validation or all other constraints as well.
   * @returns {jQuery.Promise} - Promise is resolved with validation status. A `FormValidationDone` callback could be invoked with the validation result.
   * @instance
   */

  /**
   * @function
   * @name getValues
   * @description Get current field values
   * @returns {object} A JSON in the same structure as the form's field layout definition, it contains key-value pairs at each level where key corresponds
   * to form field name and value corresponds to the data collected from the field.
   * @instance
   */

  /**
   * @function
   * @name getFlatFormValueMap
   * @description Get current field values formatted as a flattened single level key-value hash.
   * @param {object} valueMap - The hierarchical form value map. Basically the return value of `getValues()` could be passed as this parameter.
   * @returns {object} Flattened key-value map.
   * @instance
   */

  /**
   * @callback FormValidationCallback
   * @param {Boolean} isValid - Whether the form is valid.
   */

  /**
   * @function
   * @name getLabelOrValues
   * @description Ge the current field label in the case combo/liost fields and in the case of other fields it will return the values
   * @returns {object} A JSON in the same structure as the form's field layout definition, it contains key-value pairs at each level where key corresponds
   * to form field name and value corresponds to the data collected from the field.
   * @instance
   */

  return FormView;
});

/* START_TEMPLATE */
csui.define('hbs!d2/dialogs/generic/impl/dialog.form.view',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isSetType") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":14,"column":11}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-col-md-12 cs-form-singlecolumn csui-form-set-array-wrapper cs-form-set\"\n           id=\"csfSingleCol_"
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"modelId") : depths[1]), depth0))
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":5,"column":42},"end":{"line":5,"column":52}}}) : helper)))
    + "\"></div>\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isContainerType") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.program(7, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":6,"column":4},"end":{"line":14,"column":4}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-col-md-12 d2-spy-container cs-form-singlecolumn csui-form-set-array-wrapper\"\n           id=\"csfSingleCol1_"
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"modelId") : depths[1]), depth0))
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":8,"column":43},"end":{"line":8,"column":53}}}) : helper)))
    + "\"></div>\n";
},"7":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-col-md-6 cs-form-doublecolumn cs-form-leftcolumn\"\n           id=\"csfLeftCol_"
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"modelId") : depths[1]), depth0))
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":11,"column":40},"end":{"line":11,"column":50}}}) : helper)))
    + "\"></div>\n      <div class=\"binf-col-md-6 cs-form-doublecolumn cs-form-rightcolumn\"\n           id=\"csfRightCol_"
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"modelId") : depths[1]), depth0))
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":13,"column":41},"end":{"line":13,"column":51}}}) : helper)))
    + "\"></div>\n    ";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"binf-row cs-form\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"fields") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":15,"column":11}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true,"useDepths":true});
Handlebars.registerPartial('d2_dialogs_generic_impl_dialog.form.view', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!d2/dialogs/generic/impl/dialog.form.view',[],function(){});

csui.define('d2/dialogs/generic/dialog.form.view',["nuc/lib/underscore", "d2/sdk/controls/form/form.view", "hbs!d2/dialogs/generic/impl/dialog.form.view", "dctmw/utils/authenticators/session", "css!d2/dialogs/generic/impl/dialog.form.view"], function (_, FormView, formTemplate, Session, _cssD2DialogsGenericImplDialogFormView) {
  class DialogFormView extends FormView {
    constructor(options = {}) {
      options.topAlignedLabel = true;
      options.mode = options.mode || "create";
      options.context = Session.get().getContext();
      super(options);
    }
    className() {
      let className = "d2-dialog-form-view csui-normal-scrolling csui-no-scroll-x";
      const clazz = _.isString(super.className) ? super.className : _.isFunction(super.className) ? super.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    }
    validateForm(refreshState, validateOnlyRequiredFields) {
      return new Promise((res, rej) => {
        super.validateForm(refreshState, validateOnlyRequiredFields).done(res).fail(rej);
      });
    }
  }
  Object.assign(DialogFormView.prototype, {
    formTemplate: formTemplate
  });
  Object.defineProperty(DialogFormView.prototype.constructor, "name", {
    value: "DialogFormView"
  });
  return DialogFormView;
});


csui.define('d2/sdk/controls/dialogs/generic/dialog.form.view',["d2/dialogs/generic/dialog.form.view"], function (DialogFormViewImpl) {
  class DialogFormView extends DialogFormViewImpl {
    constructor(options = {}) {
      super(options);
    }
  }
  return DialogFormView;
});


csui.define('d2/sdk/controls/globalmessage/globalmessage',[
  'd2/controls/globalmessage/globalmessage',
  'd2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view'
],function(GlobalMessageImpl, ClickableLinkNodeMessageViewImpl){
  'use strict';

  /**
   * UI component used to show different types of toast messages.
   *
   * @module {d2/sdk/controls/globalmessage/globalmessage} d2/sdk/controls/globalmessage/globalmessage
   * @name GlobalMessage
   * @extends {external:Marionette.View}
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * @external NodeModel
   * @see ../models/node.model
   */

  /**
   * @typedef {Object} GMConfigOptions
   * @property {Boolean} enablePermanentHeaderMessages - Whether to show the toast message without auto-dismiss. Defaults to `false`.
   */

  return {
    /**
     * Show a toast message of particular type
     *
     * @function
     * @param {string} type - Type of the message. Possible values are `'info', 'success', 'warning', 'error'`.
     * @param {string} message - The message to be shown.
     * @param {string} [details] - Details associated with the message.
     * @param {object} [options] - Control options
     * @param {GMConfigOptions} [options.configOption] - Message display configuration.
     * @returns {external:Marionette.View} The toast message view instance.
     * @note `success` messages automatically disappear after some timeout.
     * @memberOf module:GlobalMessage
     *
     * @example
     * define([
     *  'd2/sdk/controls/globalmessage/globalmessage'
     * ], function(GlobalMessage){
     *  'use strict';
     *
     *  //To show information message
     *  GlobalMessage.showMessage('info', 'Hello world!');
     *
     *  //To show success message
     *  GlobalMessage.showMessage('success', 'This is a sample success message');
     * });
     *
     */
    showMessage: function(){
      return GlobalMessageImpl.showMessage.apply(GlobalMessageImpl, arguments);
    },

    showProgressPanel: function() {
      return GlobalMessageImpl.showProgressPanel.apply(GlobalMessageImpl, arguments);
    },

    hideProgressPanel: function() {
      return GlobalMessageImpl.hideProgressPanel.apply(GlobalMessageImpl, arguments);
    },

    /**
     * Show a success toast message with a clickable link that can execute a command model implementaion.
     * @param {object} options - Message options
     * @param {Boolean} options.showLink - Whether to show a link
     * @param {external:NodeModel} options.node - A NodeModel instance whose details is used to format the message. Also used later to execute the linked command when user clicks
     * on the link.
     * @param {Context} options.context - Reference to the application context.
     * @param {string} options.messageFormat - A string template. First placeholder in the string will be replaced with the name attribute value from `options.node`.
     * Can also be used to pass a complete message disregarding the fact that it will try to interpret as a template.
     * @param {string} options.linkLabel - Text to be shown as link.
     * @param {string} options.linkCommandSignature - Signature of the command to be executed when user clicks on the displayed link.
     * @memberOf module:GlobalMessage
     *
     * @example
     * define([
     *    'd2/sdk/controls/globalmessage/globalmessage',
     *    'd2/sdk/models/node.model',
     *    'd2/sdk/utils/contexts/context.utils'
     * ], function(GlobalMessage, NodeModel, contextUtil){
     *  'use strict';
     *
     *  GlobalMessage.showSuccessMessageWithLink({
     *    showLink: true,
     *    node: new NodeModel({id: '090015fa80002d49', name: 'SampleDocument'}),
     *    context: contextUtil.getPerspectiveContext(),
     *    messageFormat: 'Hello "{0}"',
     *    linkLabel: 'click to open overview',
     *    linkCommandSignature: 'Browse'
     *  });
     * });
     *
     */
    showSuccessMessageWithLink: function(options) {
      options = options || {};
      return GlobalMessageImpl._showMessageView(ClickableLinkNodeMessageViewImpl, {
        showLink: options.showLink,
        node: options.node,
        context: options.context,
        successMessageFormat: options.messageFormat,
        linkLabel: options.linkLabel,
        link_command_signature: options.linkCommandSignature
      });
    }
  };
});

csui.define('d2/sdk/controls/list/listitem.type.model.view',[
  'dctmw/controls/list/listitem.type.model.view'
], function(ListItemTypeModelViewImpl){
  'use strict';

  /**
   * A list item view that can work with any {@link external:Backbone.Model|Backbone.Model}.
   *
   * @example <caption>Typical usage</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/simple.list.view',
   *  'd2/sdk/controls/list/listitem.type.model.view',
   *  'd2/sdk/utils/contexts/context.utils',
   * ], function(Backbone, Marionette, ListView, ListItemTypeModelView, contextUtils){
   *  'use strict';
   *
   *  var collection = new Backbone.Collection([
   *    {
   *      id: 1,
   *      name: 'One'
   *    },
   *    {
   *      id: 2,
   *      name: 'Two'
   *    },
   *    {
   *      id: 3,
   *      name: 'Three'
   *    }
   *  ]), context = contextUtils.getPerspectiveContext();
   *
   *  var MyListView = ListView.extend({
   *    childView: ListItemTypeModelView,
   *    childViewOptions: function() {
   *      var opts = _.extend({}, this.options);
   *      opts.templateHelpers = function () {
   *        return {
   *          name: this.model.get('name'),
   *          itemLabel: this.model.get('name'),
   *          enableIcon: false,
   *          showInlineActionBar: false
   *        };
   *      };
   *      return opts;
   *    },
   *    constructor: function MyListView(options) {
   *      options = options || {};
   *      MyListView.__super__.constructor.call(this, options);
   *    }
   *  });
   *
   *  var myList = new MyListView({collection: collection, context: context});
   *  new Marionette.Region({el: '.host-el'}).show(myList);
   * });
   *
   * @module {d2/sdk/controls/list/listitem.type.model.view} d2/sdk/controls/list/"listitem.type.model.view"
   * @name ListItemTypeModel
   * @extends {external:Marionette.ItemView}
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external ToolitemsFactory
   * @see ../toolbar/toolitems.factory
   */

  var ListItemTypeModelView = ListItemTypeModelViewImpl.extend({

    /**
     * @constructs
     * @name ListItemTypeModel
     * @alias module:ListItemTypeModel
     * @param {object} options - Constructor options
     * @param {Context} [options.context] - Reference to the active application context. Needed only if the listitem is going to have a dropdown menu.
     * @param {object} [options.toolbarData]
     * @param {external:ToolitemsFactory} [options.toolbarData.toolbaritems] - Menu configuration
     */
    constructor: function ListItemTypeModelView(options) {
      options = options || {};
      ListItemTypeModelView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name templateHelpers
   * @returns {TemplateOptions} That controls how each item is rendered.
   * @instance
   */

  /**
   * @typedef {object} TemplateOptions
   * @param {string} name - Displayable text for the item
   * @param {string} itemLabel - Aria-label associated with the item
   * @param {Boolean} [enableIcon=false] - Whether to show an icon for the item
   * @param {string} [icon] - CSS class name of an icon to be shown for the item. Ignored if `enableIcon` is set to `false`.
   * @param {Boolean} [showInlineActionBar=false] - Whether the item will have a dropdown menu
   */

  return ListItemTypeModelView;
});


csui.define('d2/sdk/controls/list/listitem.type.node.view',[
  'dctmw/controls/list/listitem.type.node.view'
], function(ListItemTypeNodeViewImpl){
  'use strict';

  /**
   * A list item view that can work with any {@link ../../models/node.model|NodeModel}.
   *
   * @see {@link ./listitem.type.model.view|ListItemTypeNode}
   *
   * @example <caption>Sample usage</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/simple.list.view',
   *  'd2/sdk/controls/list/listitem.type.node.view',
   *  'd2/sdk/models/node.model'
   * ], function(Backbone, Marionette, ListView, ListItemTypeNodeView, NodeModel){
   *  'use strict';
   *
   *   var MyListView = ListView.extend({
   *    childView: ListItemTypeNodeView,
   *    constructor: function MyListView(options) {
   *      options = options || {};
   *      MyListView.__super__.constructor.call(this, options);
   *    }
   *  });
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    model: NodeModel
   *  });
   *
   *  var collection = new MyCollection([
   *    {id: '1', name: 'One', mime_type: 'application/pdf'},
   *    {id: '2', name: 'Two', mime_type: 'image/jpg'}
   *  ]);
   *
   *  new Marionette.Region({el: '.host-el'}).show(new MyListView({
   *    collection: collection
   *  }));
   * });
   *
   * @module {d2/sdk/controls/list/listitem.type.node.view} d2/sdk/controls/list/"listitem.type.node.view"
   * @name ListItemTypeNode
   * @extends {external:ListItemTypeModel}
   */

  /**
   * @external ListItemTypeModel
   * @see ./listitem.type.model.view
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  var ListItemTypeNodeView = ListItemTypeNodeViewImpl.extend({
    constructor: function ListItemTypeNodeView(options) {
      options = options || {};
      ListItemTypeNodeView.__super__.constructor.call(this, options);
    }
  });

  return ListItemTypeNodeView;
});

csui.define('d2/sdk/controls/list/listitem.type.object.view',[
  'csui/controls/listitem/listitemobject.view'
], function(ListItemTypeObjectViewImpl){
  'use strict';

  var ListItemTypeObjectView = ListItemTypeObjectViewImpl.extend({
    constructor: function ListItemTypeObjectView(options) {
      options = options || {};
      ListItemTypeObjectView.__super__.constructor.call(this, options);
    }
  });

  return ListItemTypeObjectView;
});


csui.define('d2/sdk/controls/list/simple.list.view',[
  'dctmw/controls/list/list.view'
], function(ListViewImpl){
  'use strict';

  /**
   * A flat list view backed by a {@link external:Backbone.Collection|Backbone.Collection}.
   *
   * `Backbone.Model` instances could be added/removed from the backing collection to update the view dynamically.
   *
   * @see {@link ./listitem.type.model.view|ListItemTypeModel}
   * @see {@link ./listitem.type.node.view|ListItemTypeNode}
   *
   * @example <caption>Sample list with a selection</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/simple.list.view',
   *  'd2/sdk/controls/list/listitem.type.node.view',
   *  'd2/sdk/models/node.model'
   * ], function(Backbone, Marionette, ListView, ListItemTypeNodeView, NodeModel){
   *  'use strict';
   *
   *   var MyListView = ListView.extend({
   *    childView: ListItemTypeNodeView,
   *    constructor: function MyListView(options) {
   *      options = options || {};
   *      MyListView.__super__.constructor.call(this, options);
   *    }
   *  });
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    model: NodeModel
   *  });
   *
   *  var collection = new MyCollection([
   *    {id: '1', name: 'One', mime_type: 'application/pdf'},
   *    {id: '2', name: 'Two', mime_type: 'image/jpg'}
   *  ]);
   *
   *  new Marionette.Region({el: '.host-el'}).show(new MyListView({
   *    collection: collection, selectedModel: new NodeModel({id: '2'})
   *  }));
   * });
   *
   * @module {d2/sdk/controls/list/simple.list.view} d2/sdk/controls/list/"simple.list.view"
   * @name SimpleListView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  /**
   * @external NodeModel
   * @see ../../models/node.model
   */

  var SimpleListView = ListViewImpl.extend({

    /**
     * @constructs
     * @name SimpleListView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {string} [options.emptyStateMessage] - Message to show when there are no items in the associated collection.
     * @param {external:NodeModel} [options.selectedModel] - Show a selection highlight for this model
     *
     */
    constructor: function ListViewImpl(options) {
      SimpleListView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @name mergeAttributesFromSelectedModelOnIDChange
   * @type {Boolean}
   * @default true
   * @description Whether to merge attributes of constructor option `selectedModel` to matching model within the collection
   * whenever `id` attribute of the `selectedModel` changes.
   * @instance
   */

  /**
   * @name skippableAttributesOnMerge
   * @type {string[]}
   * @default ['name']
   * @description Which attributes to skip while merging from `selectedModel` to a matching model within the collection
   * @instance
   */

  /**
   * @name attributesUsedForEqualityComparison
   * @type {string[]}
   * @default ['id']
   * @description Which attributes are used to compare for equality of `selectedModel` and models within the collection
   * @instance
   */

  return SimpleListView;
});

csui.define('d2/sdk/controls/list/sortable.list.view',[
  'dctmw/controls/list/sortable.list.view'
], function(SortableListViewImpl){
  'use strict';

  /**
   * A flat list view backed by a {@link external:Backbone.Collection|Backbone.Collection}. Items in the list view could be
   * dragged around to re-order them within the list.
   *
   * @example <caption>Typical usage</caption>
   * //In mybundle/trial/list/sortable.listitem.hbs
   * <div class="item-label" data-d2-key="{{name}}">{{label}}</div>
   *
   * //In a test module
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/sortable.list.view',
   *  'hbs!mybundle/trial/list/sortable.listitem'
   * ], function(Backbone, Marionette, SortableListView, template){
   *  'use strict';
   *
   *  var ItemView = Marionette.ItemView.extend({
   *    template: template,
   *    templateHelpers: function() {
   *      return {
   *        label: this.model.get('label'),
   *        name: this.model.get('id')
   *      };
   *    }
   *  });
   *
   *  var collection = new Backbone.Collection([
   *    {id: '1', label: 'One'},
   *    {id: '2', label: 'Two'},
   *    {id: '3', label: 'Three'}
   *  ]);
   *
   *  var listView = new SortableListView({itemView: ItemView, collection: collection, hasNonRemovableItem: true, isItemNonRemovable: function(){return true;}});
   *  new Marionette.Region({el: '.el-host'}).show(listView);
   *
   * });
   *
   * @module {d2/sdk/controls/list/sortable.list.view} d2/sdk/controls/list/"sortable.list.view"
   * @name SortableListView
   * @extends {external:Marionette.CompositeView}
   */

  /**
   * @external "Marionette.CompositeView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.compositeview.html
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var SortableListView = SortableListViewImpl.extend({

    /**
     * @constructs
     * @name SortableListView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {external:Marionette.ItemView} options.itemView - View class to use for rendering each item in the list.
     * @param {Boolean} [options.hasNonRemovableItem=false] - Whether the list has non-removable item. If set to `true` then `isItemNonRemovable()` callback is executed
     * for each item to decide removability.
     * @param {RemovableDetectionCallback} [options.isItemNonRemovable] - Callback to decide if a particular item is non-removable
     */
    constructor: function SortableListView(options) {
      SortableListView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @callback RemovableDetectionCallback
   * @param {Backbone.Model} model - Model behind the item being evaluated.
   * @return {Boolean} Return `true` to indicate the item shouldn't be removable.
   */

  return SortableListView;
});

csui.define('d2/sdk/controls/mixins/layoutview.events.propagation.mixin',[
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin'
], function(LayoutViewEventPropagationMixinImpl){
  'use strict';

  /**
   * Event propagation mixin for Marionette LayoutView. Marionette Layout view fails to propagate view-lifecycle events to different
   * child views that it hosts in its regions.
   * This mixin makes it possible to establish the broken chain in a declarative style.
   *
   * @example <caption>To use the mixin in a layout view</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/mixins/layoutview.events.propagation.mixin',
   * ], function(Marionette, LayoutViewEventsPropagationMixin){
   *  'use strict';
   *
   *  var MyView = Marionette.LayoutView.extend({
   *    regions: {
   *      header: '.header',
   *      footer: '.footer'
   *    },
   *    constructor: function MyView(options) {
   *      options = options || {};
   *      MyView.__super__.constructor.call(this, options);
   *
   *      this.propagateEventsToRegions();
   *    }
   *  });
   *
   *  LayoutViewEventsPropagationMixin.mixin(MyView.prototype);
   *
   *  var view = new MyView();
   *  new Marionette.Region({el: '.host-element'}).show(view); // With this default setup, whenever MyView instance receives 'dom:refresh' event, it is also relayed to views hosted in regions 'header' & 'footer'.
   * });
   *
   * @module {d2/sdk/controls/mixins/layoutview.events.propagation.mixin} d2/sdk/controls/mixins/"layoutview.events.propagation.mixin"
   * @name LayoutViewEventPropagationMixin
   * @extends {Object}
   */

  var LayoutViewEventPropagationMixin = LayoutViewEventPropagationMixinImpl;

  /**
   * @function
   * @name propagateEventsToRegions
   * @description This method gets mixed with any Marionette.View prototype. This method should be called from within a view instance post construction.
   * @returns {void}
   * @instance
   */

  /**
   *
   * @name _eventsToPropagateToRegions
   * @type {string[]}
   * @default ['dom:refresh']
   * @description This property gets mixed with the view prototype. It should contain a list of Marionette view lifecycle events that are desired to
   * be propagated to each hosted child view when those events occur at the LayoutView level.
   * @instance
   */

  /**
   * @function
   * @name mixin
   * @description Method to add this mixin to a view prototype.
   * @param {any} prototype - The view prototype where is mixin is to be merged.
   * @returns {void}
   * @static
   */

  return LayoutViewEventPropagationMixin;
});

csui.define('d2/sdk/controls/mixins/widget.view.state.mixin',[
  'nuc/lib/underscore',
  'dctmw/controls/mixins/view.state/widget.view.state.mixin'
], function(_, ViewStateMixinImpl){
  'use strict';

  /**
   * Mixin to facilitate storage and retrieval of view specific parameters especially for those views that are backed by a widget configuration.
   *
   * To be mixed on the `prototype` of a view.
   *
   * @example
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/mixins/widget.view.state.mixin',
   *  'd2/sdk/utils/contexts/context.utils'
   * ], function(Marionette, WidgetViewStateMixin, contextUtil){
   *  'use strict';
   *
   *  var MyView = Marionette.ItemView.extend({
   *    constructor: function MyView(options) {
   *      options = options || {};
   *      this.context = contextUtil.getPerspectiveContext(); //A context reference on self object is required for WidgetViewStateMixin to work.
   *      MyView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      this.$el.text('My widget name is: ' + this.getViewStateWidgetName());
   *    }
   *  });
   *
   *  WidgetViewStateMixin.mixin(MyView.prototype);
   *
   *  var view = new MyView();
   *  view.setViewStateWidgetName('hello world'); //Also, the view itself could call it to set the value
   *
   *  new Marionette.Region({el: '.host-el'}).show(view); //Shows the widget name in view element's text.
   * });
   *
   * @module {d2/sdk/controls/mixins/widget.view.state.mixin} d2/sdk/controls/mixins/"widget.view.state.mixin"
   * @name WidgetViewStateMixin
   * @extends Object
   */

  return {
    /**
     * Mix function from this mixin into supplied prototype.
     * @param {any} prototype - A view prototype.
     * @returns {*} The same prototype
     * @static
     */
    mixin: function(prototype) {
      return _.extend(prototype, {
        /**
         * Set the widget configuration name to be associated with this `widget.view`
         * @function
         * @param {string} widgetName - Stores the supplied value against key `widget-name` in the `ViewStateModel`
         * @returns {void}
         * @memberOf module:WidgetViewStateMixin
         * @instance
         */
        setViewStateWidgetName: ViewStateMixinImpl.setViewStateWidgetName,

        /**
         * Get the widget configuration name associated with this `widget.view`
         * @function
         * @returns {(string|undefined)} previously stored widget name from `ViewStateModel`
         * @memberOf module:WidgetViewStateMixin
         * @instance
         */
        getViewStateWidgetName: ViewStateMixinImpl.getViewStateWidgetName,

        /**
         * Get the initial list of parameters to be serialized/deserialized from the HTML document location
         * @function
         * @returns {string[]} should return name of the parameter to (de)serialize from the HTML page URL
         * @memberOf module:WidgetViewStateMixin
         * @instance
         */
        getInitialUrlParamsList: ViewStateMixinImpl.getInitialUrlParamsList
      });
    }
  };
});


csui.define('d2/sdk/controls/query.form/query.form.view',[
  'd2/controls/query.form/query.form.view'
], function(QueryFormViewImpl){
  'use strict';

  var QueryFormView = QueryFormViewImpl.extend({
    constructor: function QueryFormView(options) {
      QueryFormView.__super__.constructor.call(this, options);
    }
  });

  return QueryFormView;
});

csui.define('d2/sdk/controls/query.form/query.form.panel.view',[
  'd2/controls/query.form/query.form.panel.view'
], function(QueryFormPanelViewImpl){
  'use strict';

  var QueryFormPanelView = QueryFormPanelViewImpl.extend({
    constructor: function QueryFormPanelView(options) {
      QueryFormPanelView.__super__.constructor.call(this, options);
    }
  });

  return QueryFormPanelView;
});

csui.define('d2/sdk/controls/regions/non-emptying.region',[
  'csui/utils/non-emptying.region/non-emptying.region'
], function(NonEmptyingRegionImpl){
  'use strict';

  /**
   * A `Marionette.Region` that does not empty it's DOM element on rendering new instance of `Marionette.View`.
   *
   * @example
   * define([
   *  'nuc/lib/underscore',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/regions/non-emptying.region'
   * ], function(_, Marionette, NonEmptyingRegion){
   *  'use strict';
   *
   *  var MyView = Marionette.LayoutView.extend({
   *    template: false,
   *    constructor: function MyView(options) {
   *      options = options || {};
   *      MyView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      if(_.isString(this.options.greet) && !_.isEmpty(this.options.greet)) {
   *        this.$el.text(this.options.greet);
   *      }
   *    }
   *  });
   *
   *  var view1 = new MyView({greet: 'Hello'});
   *  var view2 = new MyView({greet: 'World'});
   *
   *  var region = new NonEmptyingRegion({el: '.host-element'}); //can also set prependChild: true if element for view added later should show before previously added element in DOM.
   *
   *  region.show(view1); //Adds element with 'Hello' in the DOM
   *  region.show(view2, {preventDestroy: true}); //Adds element with 'World' in the DOM, however element with 'Hello' is not removed and still exists in the DOM.
   *
   *  //With normal Marionette.Region, after adding view2, the HTML element specific to view1 would have been removed.
   * });
   *
   * @module {d2/sdk/controls/regions/non-emptying.region} d2/sdk/controls/regions/"non-emptying.region"
   * @name NonEmptyingRegion
   * @extends {external:Marionette.Region}
   *
   */

  /**
   * @external "Marionette.Region"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.region.html
   */

  var NonEmptyingRegion = NonEmptyingRegionImpl.extend({

    /**
     * @constructs
     * @name NonEmptyingRegion
     * @alias module:NonEmptyingRegion
     * @param {object} [options] - Constructor options. Usual constructor options as per `Marionette.Region` specification are all supported but not
     * explicitly documented here. Below are the special parameter supported by this region type.
     * @param {Boolean} [options.prependChild] - Flag to indicate whether current view's element is to be placed before or after
     * previous view's element in DOM when `show()` is called with `options.preventDestroy=true`. Defaults to `false`.
     * @param {number} [options.index] - Positive integer to indicate any specific ordered spot for current view's element in the DOM
     * when a previous view exists and current view is being shown with `options.preventDestroy=true`.
     */
    constructor: function NonEmptyingRegion(options) {
      NonEmptyingRegion.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name show
   * @description Shows a `Marionette.View` in the region.
   * @param {Marionette.View} view - The view to be shown
   * @param {object} [options] - Display control options
   * @param {Boolean} [options.preventDestroy] - Indicates whether previous view should be destroyed before showing current view or not. This flag is
   * an important indication that tells the `NonEmptyingRegion` to keep adding view content as children of it own element. Without this flag set to `true`
   * the previously shown view is destroyed and its element is removed from DOM as usual.
   * @instance
   */

  return NonEmptyingRegion;
});

csui.define('d2/sdk/controls/table/table.view',[
  'csui/controls/table/table.view'
], function(TableViewImpl){
  'use strict';

  /**
   * A `Marionette.view` to render `Backbone.Collection` data in tabular format.
   *
   * @module {d2/sdk/controls/table/table.view} d2/sdk/controls/table/"table.view"
   * @name TableView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  /**
   * @external ToolitemsFactory
   * @see ../toolbar/toolitems.factory
   */

  var TableView = TableViewImpl.extend({

    /**
     * @constructs
     * @name TableView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {TableColumnCollection} options.tableColumns - Column definition. Each model must have `ColumnModel` attributes.
     * @param {TableColumnCollection} options.columns - Server side columns. Can be kept as same as `tableColumns`.
     * @prams {TableColumnCollection} options.thumbnailColumns] - Columns used while rendering items as thumbnails. Can be kept as same as `tableColumns`.
     * @param {Connector} options.connector - The connector instance.
     * @param {NodeCollection} options.collection - The collection holding data for the table.
     * @param {string[]} options.columnsWithSearch - Which columns should have search enabled on them.
     * @param {Marionette.View} options.originatingView - Reference to a parent view where this table is hosted.
     * @param {NodeCollection} options.selectedChildren - Collection to hold list of items selected.
     * @param {ToolitemsFactory} options.inlineBar - Toolbar configuration for this table items.
     * @param {string} options.selectRows - Row selection model. Set to 'none'.
     * @param {boolean} options.enableSorting - Enable column sorting
     * @param {object} [options.customLabels] - Customized state messages as follows
     * @param {string} [options.customLabels.emptySearchTable] - Shown when search in the table returns no result.
     * @param {string} [options.customLabels.zeroRecords] - Shown when the underlying collection has no items in it.
     */
    constructor: function TableView(options) {
      options = options || {};
      TableView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @typedef {Backbone.Collection} TableColumnCollection
   * @note Each TableColumnCollection must implement a method `getColumnKeys()` that returns the `key` attribute values from each of it's models
   * @note The model used for TableColumnCollection must use `key` as the `idAttribute`.
   * @example
   * define([
   *  'nuc/lib/backbone'
   * ], function(Backbone){
   *  'use strict';
   *
   *  var TableModel = Backbone.Model.extend({
   *    idAttribute: "key",
   *    defaults: {
   *      key: null,
   *      sequence: 0
   *    }
   *  });
   *
   *  var TableColumnCollection = Backbone.Collection.extend({
   *    model: TableColumnModel,
   *    comparator: 'sequence',
   *    getColumnKeys: function () {
   *      return this.pluck('key');
   *    }
   *  });
   *
   *  //Then finally an instance might look like
   *  var columnCollection = new TableColumnCollection([
   *    {
   *      key: 'attr1',
   *      column_key: 'attr1',
   *      sequence: 2, // Data column sequence should always start from 2, by design position 1 is reserved for displaying a selection checkbox.
   *      definitions_order: 2,
   *      sort: false,
   *      title: 'Cell 1',
   *      type: -1, //string data
   *      permanentColumn: true, //Don't wrap if screen size reduces
   *      isNaming: true
   *    },
   *    {
   *      key: 'attr2',
   *      column_key: 'attr2',
   *      sequence: 3,
   *      definitions_order: 3,
   *      sort: false,
   *      title: 'Cell 2',
   *      type: -1,
   *      permanentColumn: true,
   *      isNaming: true
   *    }
   *  ]);
   *
   *  return columnCollection;
   * });
   */

  /**
   * @typedef {Object} ColumnModel
   * @property {string} key - Data attribute name
   * @property {string} column_key - Column identifier. Usually kept similar to `key` above.
   * @property {number} sequence - Order of this model in the associated column collection
   * @property {number} definitions_order - Visible order of this column. Usually kept same as `sequence` above.
   * @property {boolean} sort - Enable sorting on this column
   * @property {string} title - Text to be displayed for this column
   * @property {number} type - data type associated with this column. See {@link ./cells/cell.registry|TableCellRegistry}.
   * @property {number} widthFactor - A decimal number to control this column's visual width in percentage.
   * @property {boolean} permanentColumn - Whether this is a permanent column. Permanent columns are not wrapped if screen size reduces.
   * @property {boolean} isNaming - Whether this is the naming column. At least one column should be marked as naming column in a column collection. Naming column
   * is where the table renders its inline actionbar, if configured any.
   */

  return TableView;
});

csui.define('d2/sdk/controls/table/cells/cell.registry',[
  'csui/controls/table/cells/cell.registry'
], function(TableCellRegistryImpl){
  'use strict';

  /**
   * Register a new cell renderer, to be used for a specified column in a TableView or against a particular data type.
   *
   * @module {d2/sdk/controls/table/cells/cell.registry} d2/sdk/controls/table/cells/"cell.registry"
   * @name TableCellRegistry
   * @extends {Object}
   *
   */

  /**
   * @external TemplatedCellView
   * @see ./templated.cell.view
   */

  return {
    /**
     * Register a cell renderer by column key, i.e. an attribute name
     * @param {string} columnKey - Attribute name to bind this renderer to
     * @param {external:TemplatedCellView} handlerClass - View class implementing the renderer
     * @returns {void}
     * @static
     */
    registerByColumnKey: function (columnKey, handlerClass) {
      return TableCellRegistryImpl.registerByColumnKey(columnKey, handlerClass);
    },

    registerByOtherColumnKey: function(columnKey, handlerClass) {
      return TableCellRegistryImpl.registerByOtherColumnKey(columnKey, handlerClass);
    },

    /**
     * Register a renderer by data type
     * @param {number} dataType - A non-zero number to represent a data type. Pre-declared types are `-1(string)`, `-4(double)`, `-7(date)`, `2(integer)`, `5(boolean)`.
     * @param {external:TemplatedCellView} handlerClass - View class implementing the renderer
     * @returns {void}
     * @static
     */
    registerByDataType: function (dataType, handlerClass) {
      return TableCellRegistryImpl.registerByDataType(dataType, handlerClass);
    }
  };
});

csui.define('d2/sdk/controls/table/cells/templated.cell.view',[
  'csui/controls/table/cells/templated/templated.view'
], function (TemplatedCellViewImpl) {
  'use strict';

  /**
   * Interface for classes that want to implement a table's cell view.
   *
   * After defining a new cell implementation, it has to be registered with `CellRegistry`.
   * If column is an attribute of custom type, then use custom type prefix before the column name(Example: custom_type.modified_info) and use the same for registering the cell view.
   * Created custom cell implementation module need to be included manually in other modules.
   * @see {@link ./cell.registry|TableCellRegistry}
   *
   * :::info
   * Limitation in table "List" mode
   *
   * When table is having more column, then columns which fits in viewport will be shown in the table row.
   * Rest of the columns will wrapped and shown as read only form. If the column is wrapped, then custom cell view won't be  rendered inside the form.
   * Custom Table cell will be rendered only in the visible table column.
   * :::
   *
   * @example
   * //In mybundle/table/cells/template/my.cell.hbs define the template as
   * <div class="my-cell-wrapper">
   *   <a class="my-cell-container" title="{{title}}">
   *      <span class="my-cell-data">{{data}}</span>
   *   </a>
   * </div>
   *
   * //Then in a cell implementation module
   * define([
   *  'nuc/lib/underscore',
   *  'd2/sdk/controls/table/cells/cell.registry',
   *  'd2/sdk/controls/table/cells/templated.cell.view',
   *  'hbs!mybundle/table/cells/my.cell'
   * ], function(_, CellRegistry, TemplatedCellView, template){
   *  'use strict';
   *
   *  var MyCellView = TemplatedCellView.extend({
   *    template: template,
   *    renderValue: function() {
   *      var tmplData = {
   *        data: this.options.column ? TemplatedCellView.getValue(this.model, this.options.column): '',
   *        title: this.getValueText()
   *      };
   *
   *      var html = '';
   *      if(!_.isEmpty(tmplData.data)) {
   *        tmplData.data = '' + tmplData.data;
   *        html = this.template(tmplData);
   *      }
   *
   *      this.$el.html(html);
   *    }
   *  });
   *  //Whenever a table is rendered where the backing collection has 'd2_custom_column' in its column definition, this cell view implementation willl be linked.
   *  CellRegistry.registerByColumnKey('d2_custom_column', MyCellView);
   *  //Use custom type prefix before the column name for custom type columns.
   *  CellRegistry.registerByColumnKey('cust_type.d2_custom_column', MyCellView);
   *  return MyCellView;
   * });
   *
   * // Then add Cell implementation module in startup.js
   * define([
   *   'mybundle/table/cell/modified.by/modified.by.view'
   * ], function(){
   *   'use strict';
   *
   *   return {
   *     beforeStartup: function() {},
   *     afterStartup: function() {}
   *   };
   * });
   *
   *
   * @module {d2/sdk/controls/table/cells/templated.cell.view} d2/sdk/controls/table/cells/"templated.cell.view"
   * @name TableCellView
   * @extends {external:Marionette.View}
   *
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  var TemplatedCellView = TemplatedCellViewImpl.extend({
    /**
     * @constructs
     * @name TemplatedCellView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {*} options.column - Column definition for this table cell.
     *
     */
    constructor: function TemplatedCellView(options) {
      TemplatedCellView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name renderValue
   * @description Render the value associated with this cell. Contains logic to render and sytlize the corresponding DOM element
   * @returns {void}
   * @abstract
   */

  /**
   * @function
   * @name getValueText
   * @description Get renderable formatted value for this table cell. Same value will be considered while performing inline filter on the table. When Columns are wrapped, the same value will be displayed.
   * @returns {string}
   * @abstract
   */

  /**
   * @name columnClassName
   * @type {string}
   * @description CSS classname to be added for this column
   * @static
   */

  /**
   * @function
   * @name getValue
   * @decription Get value of this cell
   * @param {Backbone.Model} model - The model holding data for this cell
   * @param {*} column - Column definition of this cell.
   * @static
   */

  return TemplatedCellView;
});

csui.define('d2/sdk/controls/toolbar/toolitems.factory',[
  'csui/controls/toolbar/toolitems.factory'
], function(ToolItemsFactoryImpl){
  'use strict';

  /**
   * Create a new toolbar definiftion. The definition could be used to create a menubar in UI.
   *
   * @example <caption>Static toolbar configuration</caption>
   * define([
   *  'd2/sdk/controls/toolbar/toolitem.factory'
   * ], function(ToolitemsFactory){
   *  'use strict';
   *
   *  return {
   *    rightToolbar: new ToolitemsFactory({
   *      main: [
   *        {
   *          signature: 'D2-RefreshList',
   *          name: 'Refresh',
   *          iconName: 'csui_action_refresh32',
   *          enabled: true
   *        }
   *      ]
   *    }, {
   *      maxItemsShown: 1
   *      dropDownText: 'More',
   *      dropDownIconName: 'csui_action_more32'
   *    });
   *  };
   * });
   *
   * @module {d2/sdk/controls/toolbar/toolitems.factory} d2/sdk/controls/toolbar/"toolitems.factory"
   * @name ToolitemsFactory
   * @extends {Object}
   *
   */

  function cloneToolbarItems(toolbarItems) {
    return ToolItemsFactoryImpl.cloneToolbarItems.call(ToolItemsFactoryImpl, toolbarItems);
  }

  var ToolitemsFactory = ToolItemsFactoryImpl.extend({

    /**
     * @constructs
     * @name ToolitemsFactory
     * @param {object} toolItems - Key-value pairs where key represents a group name and value represents menu items under that group. Each value should be an array of `ToolitemType`
     * @param {object} options - Controls options
     * @param {number} options.maxItemsShown - Number of menus to be shown at max if this toolbar config is used to draw a menubar. Setting it to `0` shows the menu as dropdown
     * @param {string} options.dropDownText - Text shown for dropdown button
     * @param {string} options.dropDownIconName - Action icon name for the dropdown button.
     */
    constructor: function ToolitemsFactory(toolItems, options) {
      ToolitemsFactory.__super__.constructor.call(this, toolItems, options);
    }
  }, {
    cloneToolbarItems: cloneToolbarItems
  });

  /**
   * @typedef {Object} ToolitemType
   * @property {string} signature - Signature of the command bound to this menu item.
   * @property {string} name - Text displayed for this menu item.
   * @property {string} iconName - Action icon name for this menu
   * @property {*} commandData - Arbitrary data. Must have a `menuId` attribute for uniqueness and equality check.
   * @property {string} [subItemOf] - ID of the menu item for which the current item is a sub-menu
   * @property {*} [actionProperties] - Additional menu configuration data later used by matching command implementations.
   * @property {Boolean} [promoted=false] - Whether this menu is promoted. Promoted menus represent priority actions that are fetched and shown before others.
   * @property {string} type - Menu type. Should correlate with action types from D2-REST `actions` API.
   * @property {Boolean} [dynamic=false] - Whether this menu is a dynamic menu.
   * @property {Boolean} [enabled=false] - Whether this menu should be always enabled.
   */

  return ToolitemsFactory;
});

csui.define('d2/sdk/controls/tree/tree.view',[
  'dctmw/controls/tree/tree.view'
], function(TreeViewImpl){

  /**
   * Tree View, renders data into a tree structure. Internally it is implemented using {@link external:Fancytree}.
   *
   * @example <caption>A sample tree construction may look like</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/tree/tree.view',
   *  'hbs!mybundle/test/test.tree'
   * ], function(Marionette, TreeView, template){
   *
   *  var MyTreeView = Marionette.LayoutView.extend({
   *    template: template,
   *
   *    regions: {
   *      rgnTree: '.rgnTree'
   *    },
   *
   *    constructor: function MyTreeView(options) {
   *      options = options || {};
   *      MyTreeView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      if(!this.treeView) {
   *        this.treeView = new TreeView(this._buildTreeOptions());
   *        this.rgnTree.show(this.treeView);
   *      }
   *    },
   *
   *    _buildTreeOptions: function() {
   *      var treeOption = {
   *        source: [
   *          //This demonstrates how to initialize a tree with literal data only
   *          {title: "Node 1", key: "1"},
   *          {title: "Folder 2", key: "2", folder: true, children: [
   *            {title: "Node 2.1", key: "3"},
   *            {title: "Node 2.2", key: "4"}
   *          ]}
   *        ]
   *      };
   *
   *      return treeOption;
   *    }
   *  });
   *
   *  return MyTreeView;
   * });
   *
   * @example
   * <caption> where the content of mybundle/test/test.tree.hbs is as follows </caption>
   * <div class="rgnTree"></div>
   *
   * @module {d2/sdk/controls/tree/tree.view} d2/sdk/controls/tree/"tree.view"
   * @name TreeView
   * @extends {external:Marionette.ItemView}
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Fancytree"
   * @see https://wwwendt.de/tech/fancytree/doc/jsdoc/Fancytree.html
   */


  var TreeView = TreeViewImpl.extend({

    /**
     * @constructs
     * @name TreeView
     * @alias module:TreeView
     * @param {object} options - Construction options holder. Only a subset of
     * @param {FancytreeEventCallback} [options.activate] - Called when some node is activated.
     * @param {FancytreeEventCallback} [options.beforeActivate] - Called when some node is about to become active.
     * @param {FancytreeEventCallback} [options.click] - Called when a node is clicked.
     * @param {FancytreeEventCallback} [options.clickPaging] - Called when a paging status node is clicked. A paging status node is used to render more siblings at given depth.
     * @param {FancytreeEventCallback} [options.collapse] - Called when a node is collapsed.
     * @param {FancytreeEventCallback} [options.dblclick] - Called when a node is clicked twice.
     * @param {FancytreeEventCallback} [options.expand] - Called when a node is expanded.
     * @param {FancytreeEventCallback} [options.focus] - Called when a node receives keyboard focus.
     * @param {FancytreeEventCallback} [options.init] - Called when the tree reaches a particular state, when tree is initialized, source data is loaded & visible nodes are rendered.
     * @param {FancytreeEventCallback} [options.keydown] - Called when a node has received a keyboard event.
     * @param {FancytreeEventCallback} [options.lazyLoad] - Called when `data.node` is expanded for the first time. The children data must be returned in `data.results` property.
     * @param {*} [options.source] - Used to compute/collect data for the initial tree rendering. Can return a jQuery promise which can then later be resolved with tree data. See {@link https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#NodeData|NodeData}.
     * @param {Object} [options.strings] - Key-value pairs used for translations.
     */
    constructor: function TreeView(options) {
      options = options || {};
      TreeView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @callback FancytreeEventCallback
   * @param {external:jQueryEvent} event - A jquery event representing interaction.
   * @param {external:FancytreeEventData} data - Data associated with the event.
   */

  /**
   * @external "FancytreeEventData"
   * @see https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#EventData
   *
   */

  /**
   * @external "jQueryEvent"
   * @see https://api.jquery.com/category/events/event-object/
   */

  return TreeView;
});

csui.define('d2/sdk/models/mixins/collection.delayed.data.mixin',[
  'dctmw/models/mixins/collection.delayed.data.mixin'
], function(DelayedDataMixinImpl){
  'use strict';

  /**
   * DelayedCollectionData mixin. Can be mixed with any `Backbone.Collection` to create an interface that can be used to
   * retrieve additional data like permission, favorited status, location, etc. and associated those with each model to fully
   * represent them in any view context.
   * This additional data retrieval happens only after the primary collection data has been fetched and thus the name DelayedCollectionData.
   *
   * Collections using this mixin must override `fetchDelayedData()` method to actually fetch the additional data and must call `enableDelayedDataFetch()`
   * post construction to enable the lifecycle hooks associated with this mixin.
   * @see {@link ../../utils/server.query.utils|ServerQueryUtils}
   *
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/jquery',
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/collection.delayed.data.mixin'
   * ], function($, Backbone, DelayedCollectionDataMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.enableDelayedDataFetch(options);
   *    },
   *
   *    fetchDelayedData: function(options) {
   *      var dfd = $.Deferred();
   *
   *      //Custom logic to fetch the delayed data
   *      //once done, `dfd` should be resolved with the retrieved data.
   *
   *      return dfd.promise();
   *    }
   *  });
   *
   *  DelayedCollectionDataMixin.mixin(MyCollection.prototype);
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/collection.delayed.data.mixin} d2/sdk/models/mixins/"collection.delayed.data.mixin"
   * @name DelayedCollectionDataMixin
   * @extends {Object}
   *
   */

  var CollectionDelayedDataMixin = {
    /**
     * @name mixin
     * @function
     * @description Fuse the mixin methods to a collection prototype
     * @param {Object} prototype - Target collection prototype where the mixin methods will be fused.
     * @returns {void}
     * @memberOf module:DelayedCollectionDataMixin
     */
    mixin: DelayedDataMixinImpl.mixin
  };

  /**
   * @name enableDelayedDataFetch
   * @function
   * @description To enable binding on the collection lifecycle hooks that will later trigger `fetchDelayedData()` on every collection sync.
   * @param {object} options - constructor options as created and passed during instantiation of the collection.
   * @param {boolean} options.mergeDelayedDataSilently - This controls whether or not to merge the additional data on individual models in silent manner.
   * @returns {*} Reference to the same instance of the collection on which it is called.
   * @instance
   */

  /**
   * @name fetchDelayedData
   * @function
   * @description Triggered every time the collection fetches its primary data. An implementation of this function enables the actual additional data fetch.
   * The default implementation basically does nothing.
   * @param {object} options - Input parameters for the invocation.
   * @param {string[]} options.nodes - The list of id of all the models currently inside this collection.
   * @returns {jQuery.Promise} The returned promise should be resolved with fetched additional data to indicate successful retrieval or should be rejected otherwise.
   * @instance
   * @abstract
   *
   */

  return CollectionDelayedDataMixin
});

csui.define('d2/sdk/models/table/column.collection',[
  'd2/models/table/column.collection'
], function(ColumnCollectionImpl){
  'use strict';

  /**
   * A generic Column collection. Used in the context of a {@link ../mixins/browsable.collection.mixin|BrowsableMixin} to contain and define column definitions for a table like view.
   *
   * @module {d2/sdk/models/table/column.collection} d2/sdk/models/table/"column.collection"
   * @name ColumnCollection
   * @extends {external:Backbone.Collection}
   *
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */


  var ColumnCollection = ColumnCollectionImpl.extend({});

  return ColumnCollection;
});

csui.define('d2/sdk/models/mixins/browsable.collection.mixin',[
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/models/browsable/client-side.mixin',
  'nuc/models/browsable/v2.response.mixin',
  'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
  'nuc/models/mixins/state.requestor/state.requestor.mixin',
  'd2/server.adaptors/converters/servercolumns',
  'd2/utils/constants',
  'd2/utils/graphics/graphics.resources',
  'dctmw/utils/rest.resources',
  'd2/utils/server.query.utils',
  'd2/utils/sort.utils',
  'd2/sdk/models/mixins/collection.delayed.data.mixin',
  'd2/sdk/models/table/column.collection'
], function (_, $, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ExpandableV2Mixin, StateRequestorMixin,
             serverColumnsConverter, constants, GraphicsResources, RestResources, serverQueryUtils, sortUtils, DelayedDataMixin, DefaultColumnCollection) {
  'use strict';

  /**
   * BrowsableCollection mixin. Can be mixed with any `Backbone.Collection` to make it paginated. Pagination happens on the client
   * side by slicing & maintaining the models in it. But when it syncs to the server, it always fetches the full list of available objects.
   *
   * Besides pagination it also enables sorting & filtering.
   *
   * @see {@link ../../../nuc/models/browsable|Browsable Support}
   *
   * @example <caption>A typical usage infuses the mixin with a collection prototype</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/browsable.collection.mixin'
   * ], function(Backbone, BrowsableCollectionMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeBrowsableCollection(options);
   *    }
   *  });
   *
   *  BrowsableCollectionMixin.mixin(MyCollection.prototype);
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/browsable.collection.mixin} d2/sdk/models/mixins/"browsable.collection.mixin"
   * @name BrowsableCollectionMixin
   * @extends {Object}
   *
   */

  /**
   * @external ClientSideBrowsableMixin
   * @see ../../../nuc/models/browsable/client-side.mixin
   */

  /**
   * @external BrowsableMixin
   * @see ../../../nuc/models/browsable/browsable.mixin
   */

  var BrowsableMixin = {
    /**
     * Fuse the mixin methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @mixes external:ClientSideBrowsableMixin
     * @mixes external:BrowsableMixin
     * @mixes module:DelayedCollectionDataMixin
     * @memberOf module:BrowsableCollectionMixin
     */

    mixin: function (prototype) {
      ExpandableV2Mixin.mixin(prototype);
      StateRequestorMixin.mixin(prototype);
      ClientSideBrowsableMixin.mixin(prototype);
      BrowsableV2ResponseMixin.mixin(prototype);
      DelayedDataMixin.mixin(prototype);

      var originalFetch = prototype.fetch,
          originalUrl = prototype.url,
          originalSync = prototype.sync,
          originalParse = prototype.parse;

      _.extend(prototype, {
        /**
         * Does the necessary setup so that a `Backbone.Collection` instance could become client-side paginated along with support for property based sorting & filtering.
         *
         * @param {Object} options - The options hash.
         * @param {number} [options.skip] - Number of elements to skip from original collection. Needs to be set only if the collection needs to start from a page other the page-1.
         * @param {number} options.top - Number of elements per page.
         * @param {string} [options.filter] - Any filter expression that the collection should begin with. Can be changed later with `setFilter`.
         * @param {string} [options.orderBy] - Any sorting criteria that the collection should begin with. Can be changed later with `serOrderBy`.
         * @param {string} [options.responseMediaType=application/vnd.emc.documentum+json] - Controls the `Accept` header's value while requesting data through AJAX.
         * @returns {*} the collection instance itself.
         * @instance
         */

        makeBrowsableCollection: function (options) {
          options = options || {};
          this
              .makeExpandableV2(options)
              .makeStateRequestor(options)
              .makeClientSideBrowsable(options)
              .makeBrowsableV2Response(options)
              .enableDelayedDataFetch(options);

          var ColumnCollectionClass = options.ColumnCollectionClass || DefaultColumnCollection;
          this.columns = new ColumnCollectionClass(options.columns);
          this.columnTypes = {};
          this.expanded = this.options.expanded || false;

          return this;
        },

        url: function() {
          var url = _.isFunction(originalUrl) ? originalUrl.call(this) : originalUrl;

          if (this.expanded) {
            return serverQueryUtils.appendQueryParams(url, {
              scope: this,
              widgetName: this.options.widgetName,
              clientColumns: this.clientColumns,
              sort: !_.isEmpty(this.orderBy)
            });
          }

          return serverQueryUtils.appendQueryParams(url, {});
        },

        fetch: function(options) {
          if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference && _.isFunction(this._saveColumnPreference)) {
            this._saveColumnPreference();
          }
          return originalFetch.call(this, options);
        },

        sync: function (method, model, options) {
          var dfd = $.Deferred();
          var me = this;
          var args = arguments;
          var widgetConfig;

          if (me.expanded && this.widgetType && this.options.widgetName) {
            widgetConfig = serverQueryUtils.getWidgetConfig(this.widgetType, this.options.widgetName);
          }

          me.fetchColumnPreferences(widgetConfig).done(function (data, isDisableLocationColumn) {
            me.fetchData(data, args, options, isDisableLocationColumn).done(function () {
              dfd.resolve();
            }).fail(function () {
              dfd.reject.apply(dfd, arguments);
            });
          }).fail(function () {
            dfd.reject.apply(dfd, arguments);
          });

          return dfd.promise();
        },

        fetchData: function (data, args, options/*, isDisableLocationColumn*/) {
          var me = this,
              deferred = $.Deferred();

          if (data != null) {
            me.clientColumns = data.clientCols;
          } else {
            me.columns.reset(me.clientColumns);
          }

          var success = options.success, error = options.error;
          options.success = function (results) {
            success && success.call(options.context, results, 'success', {});
            deferred.resolve();
          };
          options.error = function () {
            error && error.apply(options.context, arguments);
            deferred.reject.apply(deferred, arguments);
          };

          var beforesend = options.beforeSend;
          options.beforeSend = function (request, settings) {
            options.request = request;
            request.settings = settings;
            request.setRequestHeader("Accept", me?.options?.responseMediaType || constants.MediaTypes.DCTM_JSON);
            if (beforesend) {
              beforesend.apply(this, arguments);
            }
          };

          originalSync.apply(me, args);
          return deferred.promise();
        },

        fetchDelayedData: function (options) {
          options = options || {};

          var me = this,
              deferred = $.Deferred();

          var parameters = {
            ids: options.nodes,
            connector: me.connector,
            permissions: {
              permissionLevel: 'read'
            }
          };
          if (me.expanded) {
            _.extend(parameters, {
              favorites: true
            });
            if (!me.options.isDisableLocationColumn) {
              _.extend(parameters, {
                locations: {
                  fullPath: false,
                  ancestorDetails: GraphicsResources.hasConditionAttributes()
                }
              });
            }
          }

          me.trigger('before:delayed:data:send', parameters); //Allows request-parameter adjustments by implementations
          serverQueryUtils.fetchDataAsPropertiesForObjects(parameters).done(function (objectsProperties) {
            objectsProperties = objectsProperties || {};

            me.trigger('after:delayed:data:receive', options.nodes, objectsProperties); //Allows response adjustments/fabrication by implementations

            deferred.resolve(objectsProperties);
          }).fail(deferred.reject);

          return deferred.promise();
        },

        fetchColumnPreferences: function (widgetConfig) {
          var me = this,
              promise = $.Deferred();

          if ((me.clientColumns && me.clientColumns.length !== 0) || !me.expanded || !widgetConfig) {
            promise.resolve();
          } else {
            var wName = me.widgetName = widgetConfig['object_name'];
            var isDisableLocationColumn = (widgetConfig && widgetConfig.getParam('is_disable_loc_col_smartview') === "true") || false;
            me.options.isDisableLocationColumn = isDisableLocationColumn;

            serverQueryUtils.fetchColumnPreferences({
              scope: this,
              widgetType: me.widgetType,
              widgetName: wName,
              connector: me.connector,
              columnOptions: {
                locationColumn: {
                  enabled: !isDisableLocationColumn
                },
                commentColumn: false
              }
            }).done(function (clientCols, columnPreference) {
              me.columnPreference = columnPreference;
              _.each(clientCols, function (col) {
                //Set the initial loading sorting order here from column preference.
                if (col.sort === true && (col.direction)) {
                  me.orderBy = col.column_key + ' ' + col.direction.toLowerCase();
                }
                if (col.filter !== false && (col.type === 2 || col.type === -1)) {
                  col.filter = true;
                  col.filter_key = col.filter_key || col.column_key;
                }
              });
              var data = {
                clientCols: clientCols
              };
              me.columnTypes = {};
              me.widgetPreference = {
                widgetName: me.widgetName,
                widgetType: me.widgetType,
                columnPreference: me.columnPreference,
                clientColumns: clientCols,
                widgetConfig: widgetConfig
              };
              promise.resolve(data, isDisableLocationColumn);
            }).fail(function () {
              promise.reject.apply(promise, arguments);
            });
          }
          return promise.promise();
        },

        _saveColumnPreference: function () {
          var sortarr = _.isString(this.orderBy) ? this.orderBy.split(' ') : [],
              me = this;
          if (sortarr.length > 1) {
            serverQueryUtils.saveColumnPreferences({
              scope: me,
              widgetType: me.widgetType,
              widgetName: me.options.widgetName,
              connector: me.connector,
              columnPreference: me.columnPreference,
              sortOrder: me.orderBy
            }).done(function (clientCols, columnPreference) {
              me.columnPreference = columnPreference;
            });
          }
        },

        parse: function(response/*, options*/) {
          response.columns = this.clientColumns;
          this.columns && this.columns.resetCollection(response, this.options);

          return originalParse.apply(this, arguments);
        },

        compareObjectsForSort: function (property, left, right) {
          var sortSchema = this.columnTypes[property];
          if (!sortSchema) {
            this.columnTypes[property] = {};
            sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
            this.columnTypes[property] = sortSchema;
          }
          return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get('preferences').order_folder_before !== false, this.orderBy);
        },

        clone: function () {
          var clone = new this.constructor(this.models, this.options);
          if (this.columns) {
            clone.columns.reset(this.columns.toJSON());
          }
          clone.actualSkipCount = this.actualSkipCount;
          clone.skipCount = this.skipCount;
          clone.topCount = this.topCount;
          clone.totalCount = this.totalCount;
          clone.filteredCount = this.filteredCount;
          clone.filters = _.deepClone(this.filters);
          clone.orderBy = this.orderBy;
          clone.expand = _.clone(this.expand);
          clone.includeActions = this.includeActions;
          clone.includeCommands = _.clone(this.includeCommands);
          clone.defaultActionCommands = _.clone(this.defaultActionCommands);
          clone.commands = _.clone(this.commands);
          return clone;
        }
      });
    }
  };

  return BrowsableMixin;
});

csui.define('d2/sdk/models/mixins/commandable.mixin',[
  'nuc/lib/underscore',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'd2/server.adaptors/models/node.multiple.actions.mixin'
], function(_, DelayedCommandableV2Mixin, NodeMultipleActionsMixin) {
  'use strict';

  /**
   * Commandable mixin. Add action capability to a `Backbone.Collection` or `Backbone.Model` such that when the collection or model instance is synced with server, it fetches
   * menu actions for the individual models.
   *
   * promoted actions are fetched immediately but non-promoted actions are delayed until an external trigger.
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/commandable.mixin'
   * ], function(Backbone, CommandableMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      options.d2ActionsOptions = options.d2ActionsOptions || {
   *        menuType: 'MenuContext',
   *        widgetType: 'DoclistWidget'
   *      };
   *
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeCommandable(options);
   *    }
   *  });
   *
   *  CommandableMixin.mixin(MyCollection.prototype); //Can be equally mixed with a Backbone.Model prototype
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/commandable.mixin} d2/sdk/models/mixins/"commandable.mixin"
   * @name CommandableMixin
   * @extends {Object}
   *
   */

  var CommandableMixin = {
    /**
     * Fuse the mixin methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @memberOf module:CommandableMixin
     */
    mixin: function(prototype) {
      DelayedCommandableV2Mixin.mixin(prototype);
      NodeMultipleActionsMixin.mixin(prototype);

      var originalPrepareModel = prototype._prepareModel;

      _.extend(prototype, {
        /**
         * Does the necessary setup on an instance of `Backbone.Model` or `Backbone.Collection` so that it can fetch
         * associated menu actions.
         *
         * @param {object} options - Options hash
         * @param {ActionOption} [options.delayedActionsOptions] - Controls options for the delayed action fetch behavior
         * @param {ActionOption} [options.nonPromotedActionsOptions] - Controls options for the non-promoted action fetch behavior
         * @param {ActionOption} [options.additionalActionsOptions] - Controls options for the additional action fetch behavior
         * @param {ActionOption} [options.d2ActionsOptions] - Controls options for the delayed, non-promoted & additional action fetch behavior simultaneously
         * unless the above corresponding options are also explicitly specified.
         * @returns {*} the model/collection instance itself.
         * @instance
         */
        makeCommandable: function(options) {
          options = options || {};

          options.delayedActionsOptions = _.defaults({isDelayedActions: true}, options.delayedActionsOptions || options.d2ActionsOptions);
          options.nonPromotedActionsOptions = options.nonPromotedActionsOptions || options.d2ActionsOptions;
          options.additionalActionsOptions = options.additionalActionsOptions || options.d2ActionsOptions;

          return this.makeDelayedCommandableV2(options);
        },

        _prepareModel: function (attrs, options) {
          options = options || {};

          options.delayedActionsOptions = this.delayedActionsOptions;
          options.nonPromotedActionsOptions = this.nonPromotedActionsOptions;
          options.additionalActionsOptions = this.additionalActionsOptions;
          options.defaultActionCommands = this.defaultActionCommands;
          options.promotedActionCommands = this.promotedActionCommands;
          options.nonPromotedActionCommands = this.nonPromotedActionCommands;

          return originalPrepareModel.call(this, attrs, options);
        }
      });
    }
  };

  /**
   * @typedef {Object} ActionOption
   * @property {string} menuType - Controls the `type` query parameter sent during D2-REST `actions` endpoint invocation.
   * @property {string} widgetType - Controls the `widgetType` query parameter sent during D2-REST `actions` endpoint invocation.
   */

  return CommandableMixin;
});

csui.define('d2/sdk/models/mixins/resource.mixin',[
  'dctmw/models/mixins/resource.mixin'
], function (ResourceMixinImpl) {
  'use strict';

  /**
   * Resource mixin. Can be mixed with any `Backbone.Model` or `Backbone.Collection` to make it AJAX worthy.
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/resource.mixin'
   * ], function(Backbone, ResourceMixin){
   *  'use strict';
   *
   *  var MyModel = Backbone.Model.extend({
   *    constructor: function MyModel(attr, options) {
   *      options = options || {};
   *      MyModel.__super__.constructor.call(this, attr, options);
   *
   *      this.makeResource(options);
   *    }
   *  });
   *
   *  ResourceMixin.mixin(MyModel.prototype); //Can be equally mixed with a Backbone.Collection prototype
   *
   *  return MyModel;
   * });
   *
   * @module {d2/sdk/models/mixins/resource.mixin} d2/sdk/models/mixins/"resource.mixin"
   * @name ResourceMixin
   * @extends {Object}
   *
   */

  /**
   * @external ConnectableMixin
   * @see ../../../nuc/models/mixins/connectable/connectable.mixin
   */

  /**
   * @external FetchableMixin
   * @see ../../../nuc/models/mixins/fetchable/fetchable.mixin
   */

  var ResourceMixin = {
    /**
     * Fuse the mixin methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @mixes external:ConnectableMixin
     * @mixes external:FetchableMixin
     * @memberOf module:ResourceMixin
     */
    mixin: ResourceMixinImpl.mixin
  };
  
  /**
   * @name makeResource
   * @function
   * @description Does the necessary setup on an instance of `Backbone.Model` or `Backbone.Collection` so that it can connect & fetch
   * resource from server using AJAX.
   * @param {object} options - Options hash
   * @param {Connector} options.connector - The transport that lets the model or collection to connect to server. See {@link ../../utils/contexts/factories/connector|ConnectorFactory}
   * @returns {*} the model/collection instance itself.
   * @instance
   */

  return ResourceMixin;
});

csui.define('d2/sdk/models/mixins/collection.resource.mixin',[
  'nuc/lib/underscore',
  'd2/sdk/models/mixins/browsable.collection.mixin',
  'd2/sdk/models/mixins/commandable.mixin',
  'd2/sdk/models/mixins/resource.mixin'
], function (_, BrowsableCollectionMixin, CommandableMixin, ResourceMixin) {
  'use strict';

  /**
   * CollectionResource mixin. This is a utility to conveniently enable AJAX, Browsable & Commandable capabilities onto a `Backbone.Collection`.
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/collection.resource.mixin'
   * ], function(Backbone, CollectionResourceMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeCollectionResource(options);
   *    }
   *  });
   *
   *  CollectionResourceMixin.mixin(MyCollection.prototype);
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/collection.resource.mixin} d2/sdk/models/mixins/"collection.resource.mixin"
   * @name CollectionResourceMixin
   * @extends {Object}
   */

  /**
   * @external ResourceMixin
   * @see ./resource.mixin
   */

  /**
   * @external CommandableMixin
   * @see ./commandable.mixin
   */

  /**
   * @external BrowsableCollectionMixin
   * @see ./browsable.collection.mixin
   */


  var CollectionResourceMixin = {
    /**
     * Fuse the mixable methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @mixes external:ResourceMixin
     * @mixes external:CommandableMixin
     * @mixes external:BrowsableCollectionMixin
     * @memberOf module:CollectionResourceMixin
     */
    mixin: function (prototype) {
      ResourceMixin.mixin(prototype);
      CommandableMixin.mixin(prototype);
      BrowsableCollectionMixin.mixin(prototype);

      _.extend(prototype, {
        /**
         * Does the necessary setup on an instance of `Backbone.Collection` so that it is AJAX enabled. Also adds the
         * capability to autofetch menu actions associated with each model and then finally represent the collection as
         * a client-side paginated one.
         *
         * @param {Object} options - The options hash. See the original mixin options for supported parameters.
         * @returns {*} the collection instance itself.
         * @instance
         */
        makeCollectionResource: function (options) {
          return this.makeResource(options)
              .makeCommandable(options)
              .makeBrowsableCollection(options);
        }
      });
    }
  };

  return CollectionResourceMixin;
});

csui.define('d2/sdk/models/node.collection',[
  'nuc/models/nodes',
  'd2/sdk/models/node.model'
], function(NodeCollectionImpl, NodeModel){
  'use strict';

  /**
   * Represents an arbitrary collection of {@link ./node.model|NodeModel}s. Mostly used in the context of command execution.
   *
   * Even if the collection is instantiated with literal properties, it maps those properties into instance of `NodeModel`.
   *
   * @example
   * define([
   *    'd2/sdk/models/node.collection'
   * ], function(NodeCollection){
   *    'use strict';
   *
   *    var nodeCollection = new NodeCollection([
   *      {id: '0c0015fa8000291e'},
   *      {id: '0b0015fa80005598'}
   *    ]);
   *
   *    console.log('There are ' + nodeCollection.length + ' models');
   *    console.log('First model is with id : ' + nodeCollection.at(0).get('id'));
   * });
   *
   * @module {d2/sdk/models/node.collection} d2/sdk/models/"node.collection"
   * @name NodeCollection
   * @extends external:Backbone.Collection
   *
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var NodeCollection = NodeCollectionImpl.extend({
    model: NodeModel,

    constructor: function NodeCollection(models, options) {
      NodeCollection.__super__.constructor.call(this, models, options);
    }
  });

  return NodeCollection;
});

csui.define('d2/sdk/models/table/column.preference',[
  'd2/models/table/column.preference'
], function(ColPrefModelImpl){
  'use strict';

  /**
   * Fetch or save column configuration associated with a particular widget config.
   *
   * @module {d2/sdk/models/table/column.preference} d2/sdk/models/table/"column.preference"
   * @name ColumnPreferenceModel
   * @extends {external:Backbone.Model}
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  var ColumnPreferenceModel = ColPrefModelImpl.extend({
    /**
     * Create a new instance.
     * @param {Object} attributes - column attributes
     * @param {Object} options - instance specific options
     * @param {Connector} options.connector - AJAX transport. See {@link ../../utils/contexts/factories/connector|Connector}.
     * @param {string} options.widgetType - Type of the widget config
     * @param {string} options.widgetName - Name of the widget config.
     * @param {string} [options.defaultType] - Default column types.
     */
    constructor: function ColumnPreferenceModel(attributes, options) {
      ColumnPreferenceModel.__super__.constructor.call(this, attributes, options);
    }
  });

  /**
   * @name fetch
   * @function
   * @description Fetch from server the column configuration of the widget identified by the set options
   * @returns {jQuery.Promise}
   * @instance
   */

  /**
   * @name save
   * @function
   * @description Save this column configuration to server
   * @returns {jQuery.Promise}
   * @instance
   */

  /**
   * @name columns
   * @type {Backbone.Collection}
   * @description Parsed column configuration such that each model in this collection represent a single column.
   * @instance
   */

  return ColumnPreferenceModel;
});

csui.define('d2/sdk/utils/commandhelper',[
  'csui/utils/commandhelper',
  'd2/overrides/csui/utils/commandhelper'
], function(CommandHelperImpl){
  'use strict';

  /**
   * A few frequently used functions that helps reduce code duplication across {@link external:CommandModel} implementations.
   *
   * @module {d2/sdk/utils/commandhelper} d2/sdk/utils/commandhelper
   * @name CommandHelper
   * @extends {Object}
   *
   */

  /**
   * @external NodeModel
   * @see ../models/node.model
   */

  /**
   * @external CommandModel
   * @see ../commands/command
   */

  /**
   * @external BlockingView
   * @see ../controls/blocker
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  return {
    /**
     * Get exactly one node from the given `status`
     * @param {object} status - The `status` parameter from {@link external:CommandModel}'s `enabled` or `execute` methods.
     * @returns {external:NodeModel} Returns the first node from `status.nodes`.
     * @memberOf module:CommandHelper
     */
    getJustOneNode: function(status) {
      return CommandHelperImpl.getJustOneNode(status);
    },

    /**
     * Get the most matching action of a node for a given command signature. Used for disambiguation of an action when it may be present multiple times due to repetitive menu config.
     * @param {external:NodeModel} node - The node whose actions are being looked up
     * @param {string} signature - The command signature being looked up
     * @param {object} [commandData] - `commandData` associated with the `status` parameter from {@link external:CommandModel}'s `enabled` or `execute` methods.
     * @returns {ActionModel} Returns the action that matches most. if `commandData` is not passed, the first action matching the `signature` is returned.
     * @memberOf module:CommandHelper
     */
    getOriginalAction: function (node, signature, commandData) {
      return CommandHelperImpl.getOriginalAction(node, signature, commandData);
    },

    /**
     * Get the URL for given linkrel ID from the most matching action of a node. Internally calls {@link module:CommandHelper.getOriginalAction} to lookup the matching action.
     * @param {external:NodeModel} node - The node whose actions are being looked up
     * @param {string} signature - The command signature being looked up
     * @param {string} linkrel - Linkrel identifier being looked up.
     * @param {object} [params] - If the link relation points to an href-template, then resolve the template using these params.
     * @param {object} [commandData]  - `commandData` associated with the `status` parameter from {@link external:CommandModel}'s `enabled` or `execute` methods.
     * @returns {String} the URL
     * @memberOf module:CommandHelper
     */
    getOriginalActionLink: function (node, signature, linkrel, params, commandData) {
      return CommandHelperImpl.getOriginalActionLink(node, signature, linkrel, params, commandData);
    },

    /**
     * Refresh the attributes of a node from server in the context of a widget
     * @param {external:NodeModel} node - The node being refreshed
     * @param {object} [widgetConfig] - Widget configuration to set the context of refresh
     * @param {string} widgetConfig.widgetName - Name of the widget
     * @param {string} widgetConfig.widgetType - Type of the widget
     * @returns {jQuery.Promise} it is `resolve()`-ed only if the refresh is successful, `reject()`-ed otherwise.
     * @memberOf module:CommandHelper
     */
    refreshNode: function (node, widgetConfig) {
      return CommandHelperImpl.refreshNode(node, widgetConfig);
    },

    /**
     * Show an error toast associated with a node.
     * @param {external:NodeModel} node - The node to associate the message with
     * @param {string} errMessage - Brief message to be shown
     * @param {string} detailMessage - Verbose detail of the `errMessage`. The detail is shown in an expandable region of the toast.
     * @returns {*} the toast instance
     * @memberOf module:CommandHelper
     */
    showErrorPanel: function (node, errMessage, detailMessage) {
      return CommandHelperImpl.showErrorPanel(node, errMessage, detailMessage);
    },

    /**
     * Enable blocker UI.
     * @param {external:Marionette.View} view - A view instance infused with the progress blocker API. See {@link external:BlockingView}.
     * @returns {void}
     * @memberOf module:CommandHelper
     */
    blockD2ViewActions: function (view) {
      CommandHelperImpl.blockD2ViewActions(view);
    },

    /**
     * Disable blocker UI.
     * @param {external:Marionette.View} view - A view instance infused with the progress blocker API. See {@link external:BlockingView}.
     * @returns {void}
     * @memberOf module:CommandHelper
     */
    unblockD2ViewActions: function (view) {
      CommandHelperImpl.unblockD2ViewActions(view);
    }
  };
});

csui.define('d2/sdk/utils/constants',[
  'd2/utils/constants'
], function(ConstantsImpl){
  'use strict';

  /**
   * Some utility constants.
   * @module {d2/sdk/utils/constants} d2/sdk/utils/constants
   * @name Constants
   * @extends {Object}
   */
  
  return Object.freeze({
    /**
     * Supported AJAX media types.
     * @memberOf module:Constants
     * @type {Object}
     * @property {string} DCTM_JSON - "application/vnd.emc.documentum+json".
     * @property {string} DCTM_XML - "application/vnd.emc.documentum+xml".
     * @property {string} DCTM_D2_V1_JSON - "application/vnd.documentum.d2.v1+json".
     *
     */

    MediaTypes: ConstantsImpl.MediaTypes,

    /**
     * Object types. Used for type equality comparison for {@link ../models/node.model|NodeModel}s.
     * @example
     *
     * define(['d2/sdk/utils/constants'], function(constants){
     *    //supposing 'node' is an instance of NodeModel
     *    if(node.get('type') === constants.Types.FOLDER) {
     *      console.log('This is a folder');
     *    }
     * });
     * @memberOf module:Constants
     * @type {Object}
     * @property {number} FOLDER
     * @property {number} OBJECT
     * @property {number} REPOSITORY
     * @property {number} CABINET
     * @property {number} DOCUMENT
     * @property {number} RENDITION
     * @property {number} WORKFLOW_STEP
     * @property {number} TASK
     * @property {number} TASK_PERFORMER
     * @property {number} WORKFLOW
     * @property {number} WORKFLOW_EVENT
     * @property {number} TASK_EVENT
     * @property {number} EMAIL
     * @property {number} DQL
     * @property {number} ACCESSOR
     *
     */
    Types: ConstantsImpl.Types,

    /**
     * Values used as 'type' query-parameter while making AJAX call to retrieve menu actions associated with a {@link ../models/node.model|NodeModel}
     *
     * @memberOf module:Constants
     * @type {Object}
     * @property {string} CONTEXT - 'MenuContext'
     * @property {string} NEW_OBJECT - 'MenuNewObject'
     * @property {string} USER - 'MenuUser'
     * @property {string} VDOC - 'MenuContextVD'
     * @property {string} SUBMENU_VD_ADD_CHILD - 'MenuContextVDAddChildOption'
     * @property {string} SUBMENU_VD_REPLACE_CHILD - 'MenuContextVDReplaceChildOption'
     * @property {string} TASKS - 'MenuContextTasksList'
     * @property {string} SUBMENU_CHANGE_TASK_PRIORITY - 'MenuContextTaskPriority'
     * @property {string} TASK_DOCUMENTS - 'MenuContextTaskDocument'
     * @property {string} WORKFLOWS - 'MenuContextWorkflowOverview'
     * @property {string} SAVED_SEARCH - 'MenuContextSavedSearchObject'
     * @property {string} SUBMENU_LAUNCH_WORKFLOW - 'MenuDocumentWorkflow'
     * @property {string} DETAIL_RELATIONS - 'MenuContextDetailRelations'
     * @property {string} DETAIL_RENDITIONS - 'MenuContextDetailRenditions'
     * @property {string} DETAIL_VERSIONS - 'MenuContextDetailVersions'
     * @property {string} SUBMENU_SHARE - 'MenuDocumentShare'
     * @property {string} SUBMENU_MASS_UPDATE - 'MenuToolsMassUpdate'
     * @property {string} SUBMENU_DOCUMENT_LIFECYCLE - 'MenuDocumentLifeCycle'
     * @property {string} SUBMENU_DOCUMENT_LIFECYCLE_ATTACH - 'MenuDocumentLifeCycleAttach'
     * @property {string} SUBMENU_DOCUMENT_D2_LIFECYCLE_ATTACH - 'MenuDocumentD2LifeCycleAttach'
     *
     */
    MenuTypes: ConstantsImpl.MenuTypes,

    WizardType: ConstantsImpl.WizardType,

    /**
     * Date formats used by D2-REST APIs.
     * @memberOf module:Constants
     * @type {Object}
     * @property {string} DATE_ONLY - 'YYYY-MM-DD'
     * @property {string} DATE_TIME - 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
     */
    ISODateFormats: ConstantsImpl.ISODateFormats
  });
});

csui.define('d2/sdk/utils/content.assist',[
  'd2/utils/content.assist'
], function(ContentAssistUtilImpl){
  'use strict';

  /**
   * Utility to fetch ContentAssist dialog related options
   *
   * @module {d2/sdk/utils/content.assist} d2/sdk/utils/"content.assist"
   * @name ContentAssistDialogUtil
   * @extends {Object}
   */

  return {
    /**
     * Get content assist dialog configuration
     * @param {object} options - options holder
     * @param {Context} options.context - Application runtime context. See {@link ./contexts/context.utils#Context|Context}.
     * @returns {jQuery.Promise} resolves & invokes `ContentAssistConfigCallback` on success, rejects otherwise.
     * @memberOf module:ContentAssistDialogUtil
     */
    getContentAssistConfig: function(options) {
      return ContentAssistUtilImpl.getContentAssistConfig(options);
    },

    /**
     * Gets and caches the configuration for Content Assist dialog.
     * @param {object} options - options holder
     * @param {Context} options.context - Application runtime context. See {@link ./contexts/context.utils#Context|Context}.
     * @returns {jQuery.Promise} resolves & invokes `ContentAssistOptionsCallback` on success, rejects otherwise.
     * @memberOf module:ContentAssistDialogUtil
     */
    getContentAssistOptions: function(options) {
      return ContentAssistUtilImpl.getContentAssistOptions(options);
    }
  };

  /**
   * @callback ContentAssistConfigCallback
   * @param {Object} response - Raw AJAX response.
   */

  /**
   * @callback ContentAssistOptionsCallback
   * @param {ContentAssistConfigHolder} config
   */

  /**
   * @typedef {Object} ContentAssistConfigHolder
   * @property {string} label_value - Display name of the Content Assist Dialog.
   * @property {ContentAssistConfig} properties - Raw properties associated with this config.
   */

  /**
   * @typedef {Object} ContentAssistConfig
   * @property {string} r_object_id - Documentum object id.
   * @property {string} object_name - Documentum object name.
   * @property {boolean} has_browse_assist - Whether to enable browsing mode in this dialog.
   * @property {boolean} has_favorites_assist - Whether to show favorited objects in this dialog.
   * @property {boolean} has_recent_assist - Whether to show recently accessed objects in this dialog.
   * @property {boolean} has_search_assist - Whether to enable searching in this dialog.
   */
});

csui.define('d2/sdk/utils/oauth.login.dialog',[
  'dctmw/dialogs/authentication/oauth.login.dialog'
], function(OAuthLoginDialogImpl){
  'use strict';

  /**
   * Authenticate with an external IDP using OAuth2 and acquire access token. Requires popup to be enabled in browser.
   *
   * @example <caption>A sample authentication with OTDS could look like</caption>
   * define([
   *    'd2/sdk/utils/contexts/context.utils',
   *    'd2/sdk/utils/contexts/factories/connector'
   *    'd2/sdk/utils/oauth.login.dialog'
   * ], function(contextUtil, ConnectorFactory, OAuthLoginDialog){
   *    'use strict';
   *
   *    var dlg = new OAuthLoginDialog({
   *      connector: contextUtil.getPerspectiveContext().getObject(ConnectorFactory),
   *      url: 'https://<OTDS_SERVER_IP>:8443/otdsws/oauth2/auth',
   *      clientId: 'sample_system',
   *      strings: {
   *        title: 'Sign in to Sample System', //could be localized using i18n
   *        authError: 'Authentication failed for Sample System' //could be localized using i18n
   *      }
   *    });
   *
   *    dlg
   *      .login()
   *      .then(function(accessToken, expiresIn){
   *        console.log('Acquired token:' + accessToken + ' that is valid for ' + expiresIn + ' ms.'); //Even though console logging sensitive data is a bad idea, but it's always handy for a code snippet :-)
   *      })
   *      .catch(function(){
   *        console.log('Auth failed');
   *      });
   * });
   *
   * @module {d2/sdk/utils/oauth.login.dialog} d2/sdk/utils/"oauth.login.dialog"
   * @name OAuthLoginDialog
   * @extends {Object}
   */

  /**
   * @constructs
   * @alias module:OAuthLoginDialog
   * @param {object} options - Construction options holder
   * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
   * @param {string} options.url - Base URL of IDP
   * @param {string} options.clientId - Client ID of the system for which token is being requested.
   * @param {Object.<string, string>} [options.strings] - To control different displayable labels associated with the dialog.
   * @param {string} [options.strings.title] - Login dialog's title.
   * @param {string} [options.strings.message] - Login dialog's message.
   * @param {string} [options.strings.cancelBtn] - Login dialog's Cancel button label.
   * @param {string} [options.strings.authError] - Message to be shown if authentication fails.
   * @param {string} [options.strings.popupTitle] - Alert dialog's title if popup is disabled.
   * @param {string} [options.strings.popupWarning] - Alert dialog's message if popup is disabled.
   *
   * @throws Error if any of `options.connector` & `options.url` is missing.
   */
  var OAuthLoginDialog = function OAuthLoginDialog(options) {
    options = options || {};
    this._oAuthDialogImpl = new OAuthLoginDialogImpl(options);
  };

  /**
   * Perform login to the external IDP. It checks existence of a valid access token first, if not found then login screen is shown.
   * @returns {jQyery.Promise} resolves and invokes `OAuthLoginSuccessCallback` on successful login, rejects otherwise
   */
  OAuthLoginDialog.prototype.login = function() {
    return this._oAuthDialogImpl.login();
  };

  /**
   * @callback OAuthLoginSuccessCallback
   * @param {string} accessToken - The access token
   * @param {number} expiresIn - Token expiration time in milliseconds.
   */

  return OAuthLoginDialog;
});

csui.define('d2/sdk/utils/rest.resources',[
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'dctmw/utils/rest.resources'
], function(_, Backbone, RestResourcesImpl){
  'use strict';

  /**
   * Lets read-only access to some long lived D2-REST resources that are loaded during application startup.
   *
   * @module {d2/sdk/utils/rest.resources} d2/sdk/utils/"rest.resources"
   * @name RestResources
   * @extends {Object}
   */

  function accessor(obj) {
    return _.deepClone(obj, {cloneCloneableObjects: true, copyArbitraryObjects: true});
  }

  return {
    /**
     * Get the root resource links of D2-REST APIs.
     * @returns {D2RestLinkObject[]} resource links
     * @instance
     */
    getHomeDocLinks: function () {
      return accessor(RestResourcesImpl.getHomeDocLinks());
    },

    /**
     * Get the metadata of D2-REST services. It returns build information, authentication type, repository config etc.
     * @returns {ProductInfoModel}
     * @instance
     */
    getProductInfo: function () {
      return accessor(RestResourcesImpl.getProductInfo());
    },

    /**
     * Get the current repository that the user has logged into
     * @returns {RepositoryModel}
     * @instance
     */
    getCurrentRepository: function () {
      return accessor(RestResourcesImpl.getCurrentRepository());
    },

    /**
     * Get data of the logged in user.
     * @returns {UserModel}
     * @instance
     */
    getCurrentUser: function () {
      return accessor(RestResourcesImpl.getCurrentUser());
    },

    /**
     * Get collection of all content formats supported by the repository
     * @returns {FormatCollection}
     * @instance
     */
    getFormats: function () {
      return accessor(RestResourcesImpl.getFormats());
    },

    /**
     * Get D2 runtime options for the logged in user
     * @returns {Object}
     * @instance
     */
    getD2Options: function () {
      return accessor(RestResourcesImpl.getD2Options());
    },

    /**
     * Get all widget configs data available to the logged in user
     * @returns {WidgetConfigsMap}
     * @instance
     */
    getWigetConfigs: function () {
      return accessor(RestResourcesImpl.getWigetConfigs());
    },

    /**
     * Get Documentum types available in the repository
     * @returns {DctmTypesHolder}
     * @instance
     */
    getDctmTypeData: function () {
      return accessor(RestResourcesImpl.getDctmTypeData());
    }
  };

  /**
   * @see {./rest.linkrels|RestLinkrels} for APIs to convert a partial link URL to an absolute URL
   * @typedef {Object} D2RestLinkObject
   * @property {string} rel - Link relation identifier
   * @property {string} [href] - Partial URL for the D2-REST resource
   * @property {string} [hrefTemplate] - Partial templated URL for the D2-REST resource
   */

  /**
   * @typedef {external:Backbone.Model} ProductInfoModel
   */

  /**
   * @typedef {external:Backbone.Model} RepositoryModel
   */

  /**
   * @typedef {external:Backbone.Model} UserModel
   */

  /**
   * @typedef {external:Backbone.Model} FormatModel
   */

  /**
   * @typedef {external:Backbone.Collection} FormatCollection
   * @property {FormatModel[]} models
   */

  /**
   * Widget configs data. Each key of the object is a D2 widget type and the value is another object representing different widget config of the same type.
   * @typedef {Object.<string, WidgetConfigMap>} WidgetConfigsMap
   * @property {string} key - widget type
   * @property {WidgetConfigMap} value - Map of widget configs of this widget type
   */

  /**
   * @typedef {Object.<string, WidgetConfig>} WidgetConfigMap
   * @property {string} key - widget name
   * @property {WidgetConfig} value - A single widget config
   */

  /**
   * Raw widget config
   * @typedef {Object} WidgetConfig
   * @property {string} r_object_id - Documentum object id of this config
   * @property {string} type - Documentum type of this config
   * @property {string} object_name - Name of this widget config
   * @property {string} widget_type - D2-Config type of this widget
   * @property {string} title - Title of this widget
   * @property {string} label_value - Display name of this widget
   * @property {string} desc_value - Description of this widget
   * @property {boolean} customize_columns - Whether the columns of this widgets were customized from its defaults
   * @property {string[]} columns - Associated column keys.
   * @property {Object.<string, string>} widgetParams - Parameters of this widget configuration. This is a Map of key,value pairs where key represent a configured param name.
   * Content of this map varies depending on the `widget_type`.
   */

  /**
   * @typedef {{labels: DictTypeLabels, subTypes: DictTypeSubTypes, superTypes: DictTypeSuperTypes}} DctmTypesHolder
   * @property {DictTypeLabels} labels - Displayable labels for different Documentum types
   * @property {DictTypeSubTypes} subType - Documentum types and their immediate sub-types.
   * @property {DictTypeSuperTypes} superTypes - Documentum types and their immediate super-types.
   */

  /**
   * @typedef {Object.<string, string>} DictTypeLabels
   * @property key - Type name
   * @property value - Displayable name
   */

  /**
   * @typedef {Object.<string, Array.<string>>} DictTypeSubTypes
   * @property key - Type name
   * @property value - All sub types of this type
   */

  /**
   * @typedef {Object.<string, string>} DictTypeSuperTypes
   * @property key - Type name
   * @property value - Super type of this type
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */
});

csui.define('d2/sdk/utils/rest.linkrels',[
  'd2/utils/rest.linkrels'
], function (RestLinkrelsImpl) {
  'use strict';

  /**
   * Utility to handle link relations of a D2-REST resource.
   * Also defined named constants for several link relation identifiers.
   *
   * @module {d2/sdk/utils/rest.linkrels} d2/sdk/utils/"rest.linkrels"
   * @name RestLinkrels
   * @extends {Object}
   */

  return {
    /**
     * Get complete URL from a link relation
     * @param {D2RestLinkObject[]} links - A set of related link objects.
     * @param {string} linkrel - Identifier of the link relation whose URL is to be formed.
     * @returns {string} the formed URL
     * @static
     */
    getLink: function (links, linkrel) {
      return RestLinkrelsImpl.getLink(links, linkrel);
    },

    /**
     * Get complete URL from a templated link relation
     * @param {D2RestLinkObject[]} links - A set of related link objects.
     * @param {string} linkrel - Identifier of the link relation whose URL is to be formed. The link object identified should have `hrefTemplate` in it.
     * @returns {string} the formed URL
     * @static
     */
    getLinkTemplate: function (links, linkrel) {
      return RestLinkrelsImpl.getLinkTemplate(links, linkrel);
    },

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch actions.
     * @static
     */
    ACTIONS: RestLinkrelsImpl.ACTIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to execute batch operations.
     * @static
     */
    BATCHES: RestLinkrelsImpl.BATCHES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch cabinets.
     * @static
     */
    CABINETS: RestLinkrelsImpl.CABINETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch folder of cabinet/folder.
     * @static
     */
    FOLDERS: RestLinkrelsImpl.FOLDERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch users.
     * @static
     */
    USERS: RestLinkrelsImpl.USERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch groups.
     * @static
     */
    GROUPS: RestLinkrelsImpl.GROUPS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch user's profile image.
     * @static
     */
    USER_PROFILE_IMAGE: RestLinkrelsImpl.USER_PROFILE_IMAGE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to cancel checkout of reserved object.
     * @static
     */
    CANCEL_CHECKOUT: RestLinkrelsImpl.CANCEL_CHECKOUT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch canonical object.
     * @static
     */
    CANONICAL: RestLinkrelsImpl.CANONICAL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to checkout object.
     * @static
     */
    CHECKOUT: RestLinkrelsImpl.CHECKOUT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check if object can be reserved.
     * @static
     */
    CHECKOUT_PRECHECK: RestLinkrelsImpl.CHECKOUT_PRECHECK,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch objects checked-out by user.
     * @static
     */
    CHECKEDOUT_OBJECTS: RestLinkrelsImpl.CHECKEDOUT_OBJECTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get child links of object.
     * @static
     */
    CHILD_LINKS: RestLinkrelsImpl.CHILD_LINKS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get comments of object.
     * @static
     */
    COMMENTS: RestLinkrelsImpl.COMMENTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get current version of object.
     * @static
     */
    CURRENT_VERSION: RestLinkrelsImpl.CURRENT_VERSION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get logged-in user's details.
     * @static
     */
    CURRENT_USER: RestLinkrelsImpl.CURRENT_USER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration objects available to logged in user.
     * @static
     */
    D2_CONFIGURATIONS: RestLinkrelsImpl.D2_CONFIGURATIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get possible relation types.
     * @static
     */
    D2_RELATION_TYPES: RestLinkrelsImpl.D2_RELATION_TYPES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to convert a document to virtual document.
     * @static
     */
    CONVERT_TO_VIRTUAL_DOCUMENT: RestLinkrelsImpl.CONVERT_TO_VIRTUAL_DOCUMENT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to add children to a virtual document.
     * @static
     */
    ADD_VIRTUAL_DOCUMENT_NODES: RestLinkrelsImpl.ADD_VIRTUAL_DOCUMENT_NODES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to add children to a virtual document by inheriting from another virtual document.
     * @static
     */
    D2_VD_INSERT_INHERITED_COMPONENT: RestLinkrelsImpl.D2_VD_INSERT_INHERITED_COMPONENT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get virtual document creation templates.
     * @static
     */
    D2_VD_TEMPLATES: RestLinkrelsImpl.D2_VD_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration for converting folder structure to virtual document.
     * @static
     */
    FOLDER_STRUCTURE_CONVERSION_CONFIG: RestLinkrelsImpl.FOLDER_STRUCTURE_CONVERSION_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to replace a child of a virtual document with other objects.
     * @static
     */
    REPLACE_VIRTUAL_DOCUMENT_NODES: RestLinkrelsImpl.REPLACE_VIRTUAL_DOCUMENT_NODES,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get user's default folder.
     * @static
     */
    DEFAULT_FOLDER: RestLinkrelsImpl.DEFAULT_FOLDER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to delete object.
     * @static
     */
    DELETE: RestLinkrelsImpl.DELETE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get content download URLs of object.
     * @static
     */
    DOWNLOAD_URLS: RestLinkrelsImpl.DOWNLOAD_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to execute a DQL query.
     * @static
     */
    DQL: RestLinkrelsImpl.DQL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get favorited(subscribed) objects of user.
     * @static
     */
    D2_FAVORITES: RestLinkrelsImpl.D2_FAVORITES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of recently accessed objects of user.
     * @static
     */
    D2_USER_RECENTLY_ACCESSED: RestLinkrelsImpl.D2_USER_RECENTLY_ACCESSED,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get related objects of an object.
     * @static
     */
    D2_RELATIONS: RestLinkrelsImpl.D2_RELATIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get related objects' count of an object.
     * @static
     */
    D2_OBJECTS_RELATIONS_COUNT: RestLinkrelsImpl.D2_OBJECTS_RELATIONS_COUNT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get renditions of an object.
     * @static
     */
    D2_RENDITIONS: RestLinkrelsImpl.D2_RENDITIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get widget configuration accessible to the user.
     * @static
     */
    D2_WIDGETS: RestLinkrelsImpl.D2_WIDGETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get saved search categories.
     * @static
     */
    D2_SAVED_SEARCH: RestLinkrelsImpl.D2_SAVED_SEARCH,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get displayable information for different Documentum types.
     * @static
     */
    D2_DISPLAY_TYPES: RestLinkrelsImpl.D2_DISPLAY_TYPES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get available theme configurations.
     * @static
     */
    D2_THEMES: RestLinkrelsImpl.D2_THEMES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get default theme config for the D2 Smart View runtime.
     * @static
     */
    D2_DEFAULT_THEME: RestLinkrelsImpl.D2_DEFAULT_THEME,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get different D2 Smart View runtime options.
     * @static
     */
    D2_OPTIONS: RestLinkrelsImpl.D2_OPTIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get thumbnail of a document object.
     * @static
     */
    D2_THUMBNAIL: RestLinkrelsImpl.D2_THUMBNAIL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of content creation profiles.
     * @static
     */
    D2_CREATION_PROFILES: RestLinkrelsImpl.D2_CREATION_PROFILES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get details of a content creation profile.
     * @static
     */
    D2_CREATION_PROFILE: RestLinkrelsImpl.D2_CREATION_PROFILE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get value configurations of a content creation profile.
     * @static
     */
    D2_CREATION_PROFILE_VALUE_CONFIGS: RestLinkrelsImpl.D2_CREATION_PROFILE_VALUE_CONFIGS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get details of a creation profile's value configuration.
     * @static
     */
    D2_CREATION_PROFILE_VALUE_CONFIG: RestLinkrelsImpl.D2_CREATION_PROFILE_VALUE_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get preset type of content creation profiles or preset profile in short.
     * @static
     */
    D2_CREATION_PRESET_PROFILES: RestLinkrelsImpl.D2_CREATION_PRESET_PROFILES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to value configurations of a preset profile.
     * @static
     */
    D2_CREATION_PRESET_VALUE_CONFIGS: RestLinkrelsImpl.D2_CREATION_PRESET_VALUE_CONFIGS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get recently used content creation profile be it preset or not.
     * @static
     */
    D2_CREATION_PRESET_RECENTLY_USED: RestLinkrelsImpl.D2_CREATION_PRESET_RECENTLY_USED,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get creation time property page.
     * @static
     */
    D2_CREATION_PROPERTIES: RestLinkrelsImpl.D2_CREATION_PROPERTIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to create new object.
     * @static
     */
    D2_OBJECT_CREATION: RestLinkrelsImpl.D2_OBJECT_CREATION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets upload content for a newly created object.
     * @static
     */
    D2_CONTENT_UPLOAD_URLS: RestLinkrelsImpl.D2_CONTENT_UPLOAD_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of document templates while creating new content.
     * @static
     */
    D2_DOCUMENT_TEMPLATES: RestLinkrelsImpl.D2_DOCUMENT_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get details of a document template.
     * @static
     */
    D2_DOCUMENT_TEMPLATE: RestLinkrelsImpl.D2_DOCUMENT_TEMPLATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of recently used document templates.
     * @static
     */
    D2_RECENTLY_USED_TEMPLATES: RestLinkrelsImpl.D2_RECENTLY_USED_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get linkable document configuration for a newly created object.
     * @static
     */
    D2_LINKED_DOCUMENT_CONFIG: RestLinkrelsImpl.D2_LINKED_DOCUMENT_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration to control check-in of object.
     * @static
     */
    D2_CHECKIN_CONFIG: RestLinkrelsImpl.D2_CHECKIN_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets upload new content as part of check-in.
     * @static
     */
    D2_CHECKIN_URL: RestLinkrelsImpl.D2_CHECKIN_URL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check-in a virtual document silently.
     * @static
     */
    D2_VD_SILENT_CHECKIN: RestLinkrelsImpl.D2_VD_SILENT_CHECKIN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property page to be shown while creating a folder.
     * @static
     */
    D2_FOLDER_CREATION_PROPERTY_PAGE: RestLinkrelsImpl.D2_FOLDER_CREATION_PROPERTY_PAGE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get folders.
     * @static
     */
    D2_FOLDERS: RestLinkrelsImpl.D2_FOLDERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get cabinets.
     * @static
     */
    D2_CABINETS: RestLinkrelsImpl.D2_CABINETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to extract properties using O2 plugin while importing new content.
     * @static
     */
    D2_EXTRACT_O2_PROPERTIES_URLS: RestLinkrelsImpl.D2_EXTRACT_O2_PROPERTIES_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to extract attachments from email while importing new content.
     * @static
     */
    D2_EXTRACT_EMAIL_ATTACHMENTS: RestLinkrelsImpl.D2_EXTRACT_EMAIL_ATTACHMENTS,
    D2_VIRTUAL_DOC_CONVERSION: RestLinkrelsImpl.D2_VIRTUAL_DOC_CONVERSION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to create a linked document silently while creating new content.
     * @static
     */
    D2_SILENT_LINKED_DOCUMENT_CREATION: RestLinkrelsImpl.D2_SILENT_LINKED_DOCUMENT_CREATION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get dialog configuration for a query form.
     * @static
     */
    D2_QUERYFORM_DIALOG: RestLinkrelsImpl.D2_QUERYFORM_DIALOG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to set a document template to a newly created object.
     * @static
     */
    D2_SET_TEMPLATE: RestLinkrelsImpl.D2_SET_TEMPLATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get folder structure config while importing folder.
     * @static
     */
    D2_FOLDER_STRUCTURE_CONFIGS: RestLinkrelsImpl.D2_FOLDER_STRUCTURE_CONFIGS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets import folder structure.
     * @static
     */
    D2_FOLDER_STRUCTURE_IMPORT_URLS: RestLinkrelsImpl.D2_FOLDER_STRUCTURE_IMPORT_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get bound version of a node in virtual document.
     * @static
     */
    D2_FETCH_VERSION_VD: RestLinkrelsImpl.D2_FETCH_VERSION_VD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to set binding versions of a node in virtual document.
     * @static
     */
    D2_SET_BINDING_VD: RestLinkrelsImpl.D2_SET_BINDING_VD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to convert a virtual document to a simple document.
     * @static
     */
    D2_CONVERT_TO_SIMPLE_DOC: RestLinkrelsImpl.D2_CONVERT_TO_SIMPLE_DOC,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to remove children from a virtual document.
     * @static
     */
    D2_REMOVE_VD_CHILDREN: RestLinkrelsImpl.D2_REMOVE_VD_CHILDREN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch content preivew format of object.
     * @static
     */
    D2_PREVIEW_FORMATS: RestLinkrelsImpl.D2_PREVIEW_FORMATS,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get task assignments of user.
     * @static
     */
    D2_INBOX: RestLinkrelsImpl.D2_INBOX,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get different categories applicable to user inbox.
     * @static
     */
    D2_TASK_CATEGORIES: RestLinkrelsImpl.D2_TASK_CATEGORIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get supporting documents of a tasks.
     * @static
     */
    D2_TASK_SUPPORTING_DOCUMENTS: RestLinkrelsImpl.D2_TASK_SUPPORTING_DOCUMENTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get working documents of a task.
     * @static
     */
    D2_TASK_WORKING_DOCUMENTS: RestLinkrelsImpl.D2_TASK_WORKING_DOCUMENTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get notes/user comments of a task.
     * @static
     */
    D2_NOTES: RestLinkrelsImpl.D2_NOTES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to count number of notes of a task.
     * @static
     */
    D2_NOTES_COUNT: RestLinkrelsImpl.D2_NOTES_COUNT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to change status of a task.
     * @static
     */
    D2_TASK_STATUS: RestLinkrelsImpl.D2_TASK_STATUS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to delegate a task.
     * @static
     */
    D2_TASK_DELEGATE: RestLinkrelsImpl.D2_TASK_DELEGATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of users applicable for a task delegation.
     * @static
     */
    D2_TASK_DELEGATE_USER: RestLinkrelsImpl.D2_TASK_DELEGATE_USER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get performers of a task.
     * @static
     */
    D2_TASK_PERFORMERS: RestLinkrelsImpl.D2_TASK_PERFORMERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get dialog config to update performers of a task.
     * @static
     */
    D2_TASK_PERFORMERS_DIALOG: RestLinkrelsImpl.D2_TASK_PERFORMERS_DIALOG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get data to get resolved participant details of task.
     * @static
     */
    D2_TASK_PERFORMERS_ALIAS_PARTICIPANTS: RestLinkrelsImpl.D2_TASK_PERFORMERS_ALIAS_PARTICIPANTS,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get intention dictionary while completing a task.
     * @static
     */
    D2_TASK_INTENTION_DICTIONARY_FORWARD: RestLinkrelsImpl.D2_TASK_INTENTION_DICTIONARY_FORWARD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get intentions dictionary while rejecting a task.
     * @static
     */
    D2_TASK_INTENTION_DICTIONARY_REJECT: RestLinkrelsImpl.D2_TASK_INTENTION_DICTIONARY_REJECT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property-page while completing a task.
     * @static
     */
    D2_TASK_PROPERTY_PAGE_FORWARD: RestLinkrelsImpl.D2_TASK_PROPERTY_PAGE_FORWARD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property-page while rejecting a task.
     * @static
     */
    D2_TASK_PROPERTY_PAGE_REJECT: RestLinkrelsImpl.D2_TASK_PROPERTY_PAGE_REJECT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to change workflow status.
     * @static
     */
    D2_WORKFLOW_STATUS: RestLinkrelsImpl.D2_WORKFLOW_STATUS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check lifecycle status while completing/rejecting a task.
     * @static
     */
    D2_TASK_LIFECYCLE_CHECKER: RestLinkrelsImpl.D2_TASK_LIFECYCLE_CHECKER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check locked status of working documents while completing/rejecting a task.
     * @static
     */
    D2_TASK_CHECK_LOCK_STATE: RestLinkrelsImpl.D2_TASK_CHECK_LOCK_STATE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to launch a new workflow.
     * @static
     */
    D2_WORKFLOWS: RestLinkrelsImpl.D2_WORKFLOWS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration to launch a new workflow.
     * @static
     */
    D2_WORKFLOW_CONFIG: RestLinkrelsImpl.D2_WORKFLOW_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to validate entry conditions against a workflow config before starting a new workflow.
     * @static
     */
    D2_WORKFLOW_ENTRY_CONDITION_CHECKER: RestLinkrelsImpl.D2_WORKFLOW_ENTRY_CONDITION_CHECKER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to validate package types against a workflow config.
     * @static
     */
    D2_WORKFLOW_PACKAGETYPE_CHECKER: RestLinkrelsImpl.D2_WORKFLOW_PACKAGETYPE_CHECKER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get performer dialog config while launching workflow.
     * @static
     */
    D2_WORKFLOW_LAUNCH_PEROFMERS_DIALOG: RestLinkrelsImpl.D2_WORKFLOW_LAUNCH_PEROFMERS_DIALOG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all workflows that the user is supervisor of.
     * @static
     */
    D2_MY_WORKFLOWS: RestLinkrelsImpl.D2_MY_WORKFLOWS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all workflows running system-wide.
     * @static
     */
    D2_ALL_WORKFLOWS: RestLinkrelsImpl.D2_ALL_WORKFLOWS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get a summary of workflows supervised by user.
     * @static
     */
    D2_MY_WORKFLOWS_STATUS_SUMMARY: RestLinkrelsImpl.D2_MY_WORKFLOWS_STATUS_SUMMARY,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get available workflow templates.
     * @static
     */
    D2_WORKFLOWS_TEMPLATES: RestLinkrelsImpl.D2_WORKFLOWS_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of users to be shown for workflow filtering.
     * @static
     */
    D2_WORKFLOW_OVERVIEW_WIDGET_USERS: RestLinkrelsImpl.D2_WORKFLOW_OVERVIEW_WIDGET_USERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of user to shown while changing supervisor of a workflow.
     * @static
     */
    D2_CHANGE_WORKFLOW_SUPERVISOR_USERS: RestLinkrelsImpl.D2_CHANGE_WORKFLOW_SUPERVISOR_USERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get comment configuration of a workflow.
     * @static
     */
    D2_WORKFLOW_NOTES_CONFIG: RestLinkrelsImpl.D2_WORKFLOW_NOTES_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get event details of tasks of a workflow.
     * @static
     */
    D2_WORKFLOW_TASK_AUDITS: RestLinkrelsImpl.D2_WORKFLOW_TASK_AUDITS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get event details of a workflow.
     * @static
     */
    D2_WORKFLOW_EVENT_AUDITS: RestLinkrelsImpl.D2_WORKFLOW_EVENT_AUDITS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all tasks of a workflow.
     * @static
     */
    D2_WORKFLOW_TASKS: RestLinkrelsImpl.D2_WORKFLOW_TASKS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get number of notes attached to a workflow.
     * @static
     */
    D2_WORKFLOWS_COUNT: RestLinkrelsImpl.D2_WORKFLOWS_COUNT,

    D2_MASS_UPDATE_CONFIG: RestLinkrelsImpl.D2_MASS_UPDATE_CONFIG,
    D2_MASS_UPDATE_OBJECT_VALIDATION: RestLinkrelsImpl.D2_MASS_UPDATE_OBJECT_VALIDATION,

    D2_OBJECT_LIFECYCLE_STATE: RestLinkrelsImpl.D2_OBJECT_LIFECYCLE_STATE,
    D2_OBJECTS_LIFECYCLE_CONDITIONS_CHECKER: RestLinkrelsImpl.D2_OBJECTS_LIFECYCLE_CONDITIONS_CHECKER,
    D2_OBJECTS_LIFECYCLE_CONFIG: RestLinkrelsImpl.D2_OBJECTS_LIFECYCLE_CONFIG,
    D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY: RestLinkrelsImpl.D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY,
    D2_LIFECYCLE_PROPERTIES_PAGE: RestLinkrelsImpl.D2_LIFECYCLE_PROPERTIES_PAGE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to edit object properties.
     * @static
     */
    EDIT: RestLinkrelsImpl.EDIT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL to download content of a object.
     * @static
     */
    EXPORT_URLS: RestLinkrelsImpl.EXPORT_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get favorited objects of user.
     * @static
     */
    FAVORITES: RestLinkrelsImpl.FAVORITES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of supported content formats.
     * @static
     */
    FORMATS: RestLinkrelsImpl.FORMATS,
    LOCATE: RestLinkrelsImpl.LOCATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get objects within a folder/cabinet.
     * @static
     */
    OBJECTS: RestLinkrelsImpl.OBJECTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get location of an object within the repository.
     * @static
     */
    OBJECTS_LOCATIONS: RestLinkrelsImpl.OBJECTS_LOCATIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get objects within a folder/cabinet after applying facet filters.
     * @static
     */
    OBJECTS_FACETS: RestLinkrelsImpl.OBJECTS_FACETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get objects of a DQL doclist.
     * @static
     */
    DQL_DOCLIST_OBJECTS: RestLinkrelsImpl.DQL_DOCLIST_OBJECTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get thumbnail of object.
     * @static
     */
    OBJECTS_THUMBNAIL_URL: RestLinkrelsImpl.OBJECTS_THUMBNAIL_URL,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get immediate parent of an object.
     * @static
     */
    PARENT: RestLinkrelsImpl.PARENT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to link an object to several folders.
     * @static
     */
    PARENT_LINKS: RestLinkrelsImpl.PARENT_LINKS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get general preference data of the user.
     * @static
     */
    D2_PREFERENCES: RestLinkrelsImpl.D2_PREFERENCES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get column preference data of a widget.
     * @static
     */
    D2_COLUMN_PREFERENCES: RestLinkrelsImpl.D2_COLUMN_PREFERENCES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets preview a content.
     * @static
     */
    PREVIEW_URLS: RestLinkrelsImpl.PREVIEW_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets access to a printable content.
     * @static
     */
    PRINT_URL: RestLinkrelsImpl.PRINT_URL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property page of an object.
     * @static
     */
    PROPERTY_PAGE: RestLinkrelsImpl.PROPERTY_PAGE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to execute a quick search.
     * @static
     */
    QUICK_SEARCH: RestLinkrelsImpl.QUICK_SEARCH,
    REPLIES: RestLinkrelsImpl.REPLIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of repositories.
     * @static
     */
    REPOSITORIES: RestLinkrelsImpl.REPOSITORIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API that point to the resource itself.
     * @static
     */
    SELF: RestLinkrelsImpl.SELF,
    NEXT: RestLinkrelsImpl.NEXT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration to send email.
     * @static
     */
    SEND_MAIL: RestLinkrelsImpl.SEND_MAIL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get versions' history of an object.
     * @static
     */
    VERSION_HISTORY: RestLinkrelsImpl.VERSION_HISTORY,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get children of a virtual document.
     * @static
     */
    VD_NODE_CHILDREN: RestLinkrelsImpl.VD_NODE_CHILDREN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get children of a virtual document's snapshot.
     * @static
     */
    VD_SNAPSHOT_NODE_CHILDREN: RestLinkrelsImpl.VD_SNAPSHOT_NODE_CHILDREN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to move children of a virtual document from one sub-path to another.
     * @static
     */
    VD_MOVE_NODES: RestLinkrelsImpl.VD_MOVE_NODES,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to commit all in-process object while creating new content.
     * @static
     */
    FINISH_ACTION: RestLinkrelsImpl.FINISH_ACTION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to roll back all newly created in-process objects that are not committed yet.
     * @static
     */
    ABORT_ACTION: RestLinkrelsImpl.ABORT_ACTION,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to perform an async operation.
     * @static
     */
    ASYNC_OPERATION: RestLinkrelsImpl.ASYNC_OPERATION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all metadata of an object.
     * @static
     */
    D2_DUMP: RestLinkrelsImpl.D2_DUMP,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to validate electronic signature credentials.
     * @static
     */
    D2_SIGNOFF_VALIDATION: RestLinkrelsImpl.D2_SIGNOFF_VALIDATION,
    D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS: RestLinkrelsImpl.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch Documentum dm_sysobject type attributes for a bunch of objects.
     * @static
     */
    D2_SYSOBJECTS: RestLinkrelsImpl.D2_SYSOBJECTS
  };

  /**
   * @typedef {Object} D2RestLinkObject
   * @property {string} rel - Link relation identifier
   * @property {string} [href] - Partial URL for the D2-REST resource
   * @property {string} [hrefTemplate] - Partial templated URL for the D2-REST resource
   */
});


csui.define('d2/sdk/utils/session',[
  'nuc/lib/underscore',
  'nuc/lib/marionette',
  'dctmw/utils/authenticators/session'
], function(_, Marionette, SessionImpl){
  'use strict';

  var sessionInstance, implInstance;

  /**
   * Session utility. It is a singleton entity in D2SV runtime, used to check state of D2SV session and avail the authenticated connector instance
   * associated with the session.
   * Can also return a reference to the application state data holder a.k.a context associated with the D2SV runtime.
   *
   * @module {d2/sdk/utils/session} d2/sdk/utils/"session"
   * @name Session
   * @extends external:Marionette.Object
   * @fires module:Session#init
   * @fires module:Session#begin
   * @fires module:Session#end
   */

  /**
   * @external "Marionette.Object"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.object.html
   */

  /**
   * Marks the initialization of a session. The event is emitted when the session has created
   * its pre-requisite objects and it's ready to check authentication status
   * @event module:Session#init
   * @type {string}
   */

  /**
   * Marks the beginning of a session. The event is emitted when session reaches validated state
   * after fresh login or page reload.
   * @event module:Session#begin
   * @type {string}
   */

  /**
   * Marks the end of a session. The event is emitted when session couldn't reach a validated state
   * after page reload or the underlying connection authenticator has detected logout or session expiry.
   * @event module:Session#end
   * @type {string}
   */

  var Session = Marionette.Object.extend({
    constructor: function Session() {
      if(!implInstance) {
        implInstance = SessionImpl.get();
        implInstance.on('all', function(){
          var args = _.filter(arguments, function(arg){
            return arg !== implInstance;
          });
          this.trigger.apply(this, args);
        }.bind(this));
      }
    },

    /**
     * Check if the session is initialized or not. Right after a session object is instantiated, it is put to an un-initialized state.
     * The uninitialized state represents that the session is still setting up context, connector and an appropriate authenticator.
     * @return {Boolean} Whether the session is initialized.
     * @instance
     */
    isInitialized: function() {
      return implInstance.isInitialized();
    },

    /**
     * Checks if the session is active or not. An `initialized` session automatically tries to validate itself against an authenticated
     * connection. If the validation goes through, then the session becomes an `active` session otherwise it stays `inactive` and waits
     * for the end user to login into D2SV.
     * @return {Boolean} Whether the session is active
     * @instance
     */
    isActive: function() {
      return implInstance.isActive();
    },

    /**
     * Get a reference to the application data holder associated with this session. The context can be used to create or access
     * data created by different data factories.
     * @see {@link ./contexts/context.utils#Context|Context}
     * @return {*} Returns the session context.
     * @instance
     *
     * @example <caption>Code sample to get the connector instance inside any module</caption>
     *
     * define([
     *  'd2/sdk/utils/session',
     *  'd2/sdk/utils/contexts/factories/connector',
     *  'd2/sdk/models/node.model'
     * ], function(Session, ConnectorFactory, NodeModel){
     *  'use strict';
     *
     *  var context;
     *
     *  function createNodeModel(attributes) {
     *    if(!context) {
     *      context = Session.get().getContext();
     *    }
     *    return new NodeModel(attributes, {connector: context.getObject(ConnectorFactory)});
     *  }
     *
     *  return {
     *    cteateNodeModel: createNodeModel
     *  };
     * });
     */
    getContext: function() {
      return implInstance.getContext();
    }
  });



  return {
    /**
     * @memberof module:Session
     * @description Get a reference to the singleton instance.
     * @return {Session} Returns the session instance.
     */
    get: function() {
      if(!sessionInstance) {
        sessionInstance = new Session();
      }
      return sessionInstance;
    }
  };
});


csui.define('d2/sdk/utils/server.query.utils',[
  'd2/utils/server.query.utils'
], function(ServerQueryUtilsImpl){
  'use strict';

  /**
   * A general utility to access/process some commonly used D2-REST resources outside of a `Backbone.Model` or `Backbone.Collection`.
   * @module {d2/sdk/utils/server.query.utils} d2/sdk/utils/"server.query.utils"
   * @name ServerQueryUtils
   * @extends Object
   */

  return {
    /**
     * Form a query appended URL from a base URL, thus facilitates to make AJAX calls.
     * @param {string} url - The base URL.
     * @param {Object} options - The options hash to control URL generation.
     * @param {string} options.scope - The scope of the target D2-REST resource
     * @param {boolean} options.paginate - Whether to paginate the URL.
     * @return {String} The formed URL.
     * @static
     */
    appendQueryParams: function(url, options) {
      return ServerQueryUtilsImpl.appendQueryParams(url, options);
    },

    /**
     * Parses response from D2-REST resource.
     * @param {JSON} response - Raw response from server.
     * @param {Object} options - The options hash to control parsing.
     * @param {string} options.scope - The scope of the target D2-REST resource
     * @param {boolean} options.paginate - Whether to extract page information from the response.
     * @return {JSON} The parsed response.
     * @static
     */
    parseResponse: function(response, options) {
      return ServerQueryUtilsImpl.parseResponse(response, options);
    },

    /**
     * Fetch column preferences for a widget. It caches the preference data for a given widget type and name,
     * the first time it is fetched, and returns the data from this cache next time onwards.
     * @param {Object} options - Request options holder.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {*} options.scope - Scope of the request, usually should point to the related data model. E.g. when calling in the context of a collection, it should be the collection itself.
     * @param {string} options.widgetType - Type of the widget config.
     * @param {string} options.widgetName - Name of the widget config.
     * @param {string} [options.defaultType] - Default column types.
     * @param {Object} [options.columnOptions] - Options for the columns data, used while converting server columns to client columns
     * @param {boolean} [options.columnOptions.typeColumn] - Include type column
     * @param {boolean} [options.columnOptions.reservedColumn] - Include object lock status column
     * @param {boolean} [options.columnOptions.commentColumn] - Include comments column
     * @param {boolean} [options.columnOptions.favoriteColumn] - Include favorite status column
     * @returns {jQuery.Promise} resolves & invokes `ColumnPreferenceDoneCallback` on success, rejects otherwise.
     * @static
     */
    fetchColumnPreferences: function(options) {
      return ServerQueryUtilsImpl.fetchColumnPreferences(options);
    },

    /**
     * Save column preferences for a widget
     * @param {Object} options - Request options holder.
     * @param {string} options.widgetType - Type of the widget config.
     * @param {string} options.widgetName - Name of the widget config.
     * @param {string} [options.defaultType] - Default column types.
     * @param {external:ColumnPreferenceModel} options.columnPreference - The new preference data.
     * @param {string} options.sortOrder - Specify a sort order.
     * @returns {jQuery.Promise} resolves and invokes `ColumnPreferenceDoneCallback` on success, rejects otherwise.
     * @static
     */
    saveColumnPreferences: function(options) {
      return ServerQueryUtilsImpl.saveColumnPreferences(options);
    },

    /**
     * Get widget configuration object.
     * @param {string} widgetType - Type of the widget config.
     * @param {string} widgetName - Name of the widget config.
     * @returns {object} The widget config
     * @throws `Error` if any of the parameters are `null` or `undefined` or empty.
     * @static
     */
    getWidgetConfig: function (widgetType, widgetName) {
      return ServerQueryUtilsImpl.getWidgetConfig(widgetType, widgetName);
    },

    /**
     * Fetch user's permission level for the objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {string} options.permissionLevel - Level of permission to check. Any of Documentum permission i.e 'browse', 'read', 'relate', 'version', 'write', 'delete'
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchPermissions: function(options){
      return ServerQueryUtilsImpl.fetchPermissions(options);
    },

    /**
     * Fetch user's favorite(subscription) status of the objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchFavorites: function(options) {
      return ServerQueryUtilsImpl.fetchFavorites(options);
    },

    /**
     * Fetch allowed actions for the objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {string} options.menuType - Type of actions to be fetched. See `MenuTypes` from {@link ./constants|Constants}.
     * @param {string} options.widgetType - Type of widget for which menu is required (e.g. DoclistWidget). See `D2` from {@link ./widget.constants#module_WidgetConstants.D2|WidgetConstants.D2}
     * @param {string} options.queryAction - Types of actions to request. Possible values are PROMOTED, NON-PROMOTED and ALL. Default is ALL
     * @param {string[]} [options.parentIds] - List of parent ids in case the objects are renditions. It has to have a positional correspondence with `ids` i.e `parentIds[0]` should be the parent of `id[0]`.
     * @param {string[]} [options.associateIds] - List of associated object ids in case the objects are relations. It has to have a positional correspondence.
     * @param {string} [options.rulesType=node] - Rule collection to be used for filtering the actions. Can be one of 'user', 'node'.
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchActions: function(options){
      return ServerQueryUtilsImpl.fetchActions(options);
    },

    /**
     * Fetch locations of the given objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {boolean} [options.fullPath=false] - Whether to parse full path or just include the immediate parent.
     * @param {boolean} [options.ancestorDetails] - Whether to fetch the parent node details along with location information
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchLocations: function(options){
      return ServerQueryUtilsImpl.fetchLocations(options);
    },

    /**
     * A single call to fetch different aspects of the objects. It can be used to fetch permission, favorited status, actions, locations, external share status,
     * preview formats and relation count for multiple objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {(boolean|Object)} [options.permissions] - Fetch permissions.
     * @param {string} options.permissions.permissionLevel - Level of permission to check. Any of Documentum permission i.e 'browse', 'read', 'relate', 'version', 'write', 'delete'
     * @param {boolean} [options.favorites] - Fetch favorited status.
     * @param {ActionRequestType} [options.actions] - Fetch actions as per specified options.
     * @param {(boolean|Object)} [options.locations] - Fetch locations.
     * @param {boolean} [options.locations.fullPath=false] - Parse full path of each location.
     * @param {boolean} [options.ancestorDetails] - Whether to fetch the parent node details along with location information
     * @param {boolean} [options.externalShare=false] - Fetch external share status.
     * @param {boolean} [options.previewFormats=false] - Fetch preview formats.
     * @param {boolean} [options.relationsCount=false] - Fetch relations count.
     * @returns {jQuery.Promise} on success it resolves and invokes callback with separate maps representing permissions, favorites, actions etc. depending on what was requested.
     * @static
     */
    fetchDataForObjects: function(options) {
      return ServerQueryUtilsImpl.fetchDataForObjects(options);
    },

    /**
     * Works the same as fetchDataForObjects(), additionally collects related data for every objects individually into a
     * single object hash, as per most commonly used property naming conventions for NodeModel, so that the data can be easily merged
     * with any target NodeModel.
     * @param options Same as the options parameter for fetchDataForObjects().
     * @returns jQuery.Promise
     * @static
     */
    fetchDataAsPropertiesForObjects: function(options) {
      return ServerQueryUtilsImpl.fetchDataAsPropertiesForObjects(options);
    }
  };

  /**
   * @external ColumnPreferenceModel
   * @see ../models/table/column.preference
   */

  /**
   * Actions request type
   * @typedef {Object} ActionRequestType
   * @property {string} menuType - Type of actions to be fetched. See `MenuTypes` from {@link ./constants|Constants}.
   * @property {string} widgetType - Type of widget for which menu is required (e.g. DoclistWidget). See `D2` from {@link ./widget.constants#D2|WidgetConstants}
   * @property {string} [queryAction] - Types of actions to request. Possible values are PROMOTED, NON-PROMOTED and ALL. Default is ALL
   * @property {string[]} [parentIds] - List of parent ids in case the objects are renditions. It has to have a positional correspondence with `ids` i.e `parentIds[0]` should be the parent of `id[0]`.
   * @property {string[]} [associateIds] - List of associated object ids in case the objects are relations. It has to have a positional correspondence with `ids`.
   * @property {string} [rulesType=node] - Rule collection to be used for filtering the actions. Can be one of 'user', 'node', 'vdoc'.
   * @property {string} [vdFrameIds] - List of virtual document frame id. It has to have a positional correspondence with `ids`. Applies only if `rulesType` is set to `'vdoc'`.
   * @property {string[]} [vdRelationIds] - List of virtual document relation id. It has to have a positional correspondence with `ids`. Applies only if `vdFrameIds` is set.
   * @property {string[]} [vdmNumbers] - List of virtual document sequence numbers calculated relative to `vdFrameIds`. It has to have a positional correspondence with `ids`. Applies only if `vdFrameIds` is set.
   */

  /**
   * @callback ColumnPreferenceDoneCallback
   * @param {ResolvedColumnDefinition[]} clientColumns - Converted columns
   * @param {external:ColumnPreferenceModel} colPref - The server column preference
   */

  /**
   * Client-side column definition
   * @typedef {Object} ResolvedColumnDefinition
   * @property {string} key - unique identifier of this column
   * @property {string} column_key - Bound Documentum type attribute of this column
   * @property {number} definitions_order - Order of appearance, the order increases from left to right while laying out in a table format.
   * @property {string} [name] - Display label
   * @property {string} [title] - Tooltip
   * @property {boolean} [order=false] - If the column can be re-arranged in the client-side.
   * @property {boolean} [sort=true] - If the column supports click-to-sort behavior
   * @property {string} [d2_sort_key=<column_key>] - Specify a different sort key.
   * @property {string} [direction=''] - Sorting direction. Can be one of 'asc' or 'desc'. Ignored if `sort` is set to false.
   * @property {boolean} [filter=false] - If the column can be filtered with text search
   * @property {string} [filter_key=<column_key>] - Specify a different filter key.
   * @property {boolean} [default_action=false] - Should this column support 'click-to-execute-default-action' behavior.
   * @property {number} type - Documentum data type of this column, -7:Date, -4:Double, -1:String, 2:Integer, 5:Boolean
   * @property {string} type_name - Readable type name. One of Date, Double, String, Integer, Boolean
   *
   */
});


csui.define('d2/sdk/utils/utils',[
  'dctmw/utils/utils'
], function(UtilsImpl){
  'use strict';

  /**
   * Utility functions.
   *
   * @module {d2/sdk/utils/utils} d2/sdk/utils/utils
   * @name Utils
   * @extends {Object}
   *
   */

  return {
    /**
     * Get context path name of D2 Smart View deployment
     * @returns {string} the context path name
     * @memberOf module:Utils
     */
    getAppContext: function() {
      return UtilsImpl.getAppContext();
    },

    /**
     * Get a properly namespaced storage name for the given key. Used while creating a boundary within `localStorage` or `sessionStorage`.
     * See `getLocalStore` and `getSessionStore` below.
     * @param {string} key - original key name
     * @returns {string} namespaced key name
     * @memberOf module:Utils
     */
    getStoreKey: function(key) {
      return UtilsImpl.getStoreKey(key);
    },

    /**
     * Get a local storage area identified by the given key. A new storage area gets created if doesn't exist already.
     *
     * @param {string} key - Storage identifier
     * @returns {NamedStorage} local store instance
     * @memberOf module:Utils
     */
    getLocalStore: function(key) {
      return UtilsImpl.getLocalStore(key);
    },

    /**
     * Get a session storage area identified by the given key. A new storage area gets created if doesn't exist already.
     * @param {string} key - Storage identifier
     * @returns {NamedStorage} session store instance
     * @memberOf module:Utils
     */
    getSessionStore: function(key) {
      return UtilsImpl.getSessionStore(key);
    },

    /**
     * Detects whether the D2 Smart View runtime platform is a mobile
     * @returns {boolean} `true` if it's being run on mobile, `false` otherwise.
     * @memberOf module:Utils
     */
    isMobile: function() {
      return UtilsImpl.isMobile();
    },

    /**
     * Detects whether the D2 Smart View runtime platform is appworks.
     * @returns {boolean} `true` if it's Appworks.
     * @memberOf module:Utils
     */
    isAppworks: function() {
      return UtilsImpl.isAppworks();
    },

    /**
     * Open the given URL in window.
     * @param {string} url - The URL to open
     * @param {Window} [wnd] - The window where `url` will be opened. Defaults to current global `window` object.
     * @param {boolean} [focus=false] - Whether to focus the window
     * @param {boolean} [keepLink=false] - Whether to keep the `opener` reference. `true` keeps it.
     * @returns {void}
     * @memberOf module:Utils
     */
    openUrlInWindow: function(url, wnd, focus, keepLink) {
      UtilsImpl.openUrlInWindow(url, wnd, focus, keepLink);
    },

    /**
     * Make a single D2-REST AJAX call with a batch of operations.
     *
     * @example
     * define([
     *    'd2/sdk/utils/contexts/context.utils',
     *    'd2/sdk/utils/utils',
     *    'd2/sdk/utils/contexts/factories/connector'
     * ], function(contextUtil, util, ConnectorFactory){
     *    'use strict';
     *
     *    // Retrieve document menu actions and favorited status for object '0c0015fa8000291e' in a single batch call
     *    util.makeBatchAjaxCall({
     *      connector: contextUtil.getPerspectiveContext().getObject(ConnectorFactory),
     *      continueOnError: true,
     *      operations: [
     *        {
     *          id: 'favorites',
     *          request: {
     *            method: 'GET',
     *            uri: '/repositories/d2repo/favorites-checker?object-ids=0c0015fa8000291e'
     *          }
     *        },
     *        {
     *          id: 'actions',
     *          request: {
     *            method: 'GET',
     *            uri: '/repositories/d2repo/actions?type=MenuContext&widgetType=DoclistWidget&include-subtype=true&object-ids=0c0015fa8000291e'
     *          }
     *        }
     *      ]
     *    })
     *      .done(function(){
     *        console.log('batch call success');
     *      })
     *      .fail(function(){
     *        console.log('batch call failed');
     *      });
     * });
     *
     * @async
     * @param {object} options - Holder of different options
     * @param {Connector} options.connector - Transport for the AJAX call. See {@link ./contexts/factories/connector|Connector}.
     * @param {BatchOperationRequest[]} options.operations - Operations to be performed in this batch.
     * @param {boolean} [options.transactional=false] - Whether this batch is to be executed as a transaction. A transactional batch operates with 'Either all or none' paradigm.
     * @param {boolean} [options.sequential=false] - For a non-transactional batch, whether the operations are to be run sequentially or parallely.
     * @param {boolean} [options.continueOnError=false] - Whether remaining operations are to be run if one fails.
     * @returns {jQuery.Promise} The returned promise fails on AJAX error. It resolves otherwise invoking `BatchDoneCallback` as documented below.
     * @memberOf module:Utils
     */
    makeBatchAjaxCall: function(options) {
      return UtilsImpl.makeBatchAjaxCall(options);
    },

    /**
     * Build complete URL from a D2-REST link
     * @param {Object} link - The link as is from a D2-REST response
     * @param {boolean} isTemplate - Is this D2-REST link a templated one or regular.
     * @returns {string} the complete URL.
     * @memberOf module:Utils
     */
    buildLinkUrl: function(link, isTemplate) {
      return UtilsImpl.buildLinkUrl(link, isTemplate);
    },

    /**
     * Parse AJAX error happened as a result of D2-REST API call and return a normalized error structure.
     * @param {external:XMLHttpRequest} xhr - The XHR transport
     * @param {string} [textStatus] - Textual status associated with the error
     * @param {string} [errorThrown] - Custom error message in case the XHR response could not be parsed.
     * @param {boolean} [includeDetails=false] - Whether to include a `errorDetails` field in the parsed error structure.
     * @returns {ParsedErrorType} the parsed error
     * @memberOf module:Utils
     */
    parseAjaxError: function(xhr, textStatus, errorThrown, includeDetails) {
      return UtilsImpl.parseAjaxError(xhr, textStatus, errorThrown, includeDetails);
    },

    /**
     * Parse AJAX error happened as a result of D2-REST API call and return a compact string representing it.
     * @param {external:XMLHttpRequest} xhr - The XHR transport
     * @param {string} [textStatus] - Textual status associated with the error
     * @param {string} [errorThrown] - Custom error message in case the XHR response could not be parsed.
     * @param {boolean} [includeDetails=false] - Whether to include a `errorDetails` field in the parsed error structure.
     * @returns {string} the parsed error
     * @memberOf module:Utils
     */
    parseAjaxErrorAsString: function(xhr, textStatus, errorThrown, includeDetails) {
      return UtilsImpl.parseAjaxErrorAsString(xhr, textStatus, errorThrown, includeDetails);
    },

    /**
     * Extract error from custom object and format it similar to return format of `parseAjaxError`.
     * @param {string} responseType - Hint of how to parse `responseData`. Can be any of 'xml', 'json' or 'object'
     * @param {JSON|string} responseData - If `responseType` is 'object' then a JSON object, otherwise a string serialized error structure.
     * Irrespective of its type, every input is expected to have a `code`, `message` and `details` field in it.
     * @returns {ParsedErrorType} the parsed error
     * @memberOf module:Utils
     */
    parseError: function(responseType, responseData) {
      return UtilsImpl.parseError(responseType, responseData);
    },

    /**
     * Extract error from custom object and return a compact string representing it.
     * @param {string} responseType - Hint of how to parse `responseData`. Can be any of 'xml', 'json' or 'object'
     * @param {JSON|string} responseData - If `responseType` is 'object' then a JSON object, otherwise a string serialized error structure.
     * Irrespective of its type, every input is expected to have a `code`, `message` and `details` field in it.
     * @returns {string} the parsed error
     * @memberOf module:Utils
     */
    parseErrorAsString: function(responseType, responseData) {
      return UtilsImpl.parseErrorAsString(responseType, responseData);
    },

    /**
     * Set some text content to the browser clipboard
     * @param {string} clipboardText - The content to be copied.
     * @returns {boolean} `true` indicates the copy is successful.
     * @memberOf module:Utils
     *
     */
    copyToClipboard: function(clipboardText) {
      return UtilsImpl.copyToClipboard(clipboardText);
    },

    /**
     * Checks whether a given value is a `jQuery.Promise` instance or not
     * @param {*} value - The test value
     * @returns {boolean} `true` if it's a `jQuery.Promise`, `false` otherwise.
     * @memberOf module:Utils
     */
    isJqueryPromise: function(value) {
      return UtilsImpl.isJqueryPromise(value);
    },

    /**
     * Checks whether a given value is a non-empty `string`
     * @param {*} str - The test value
     * @returns {boolean} `true` if it's a `string`
     * @memberOf module:Utils
     */
    isNonEmptyString: function(str) {
      return UtilsImpl.isNonEmptyString(str);
    },

    /**
     * Compare two functions for equality
     * @param {function} fn1 - Left hand side
     * @param {function} fn2 - Right hand side
     * @returns {boolean} `true` only if Left hand side is equal to right hand side.
     * @memberOf module:Utils
     */
    areSameFunctions: function(fn1, fn2) {
      return UtilsImpl.areSameFunctions(fn1, fn2);
    }
  };

  /**
   * The done callback type invoked after a batch AJAX call resolves
   * @callback BatchDoneCallback
   * @param {BatchOperationResponse[]} success - Operations that succeeded.
   * @param {BatchOperationResponse[]} [failures] - Operations that failed.
   */

  /**
   * Each response from a D2-REST batch AJAX call
   * @typedef {Object} BatchOperationResponse
   * @property {string} id - `id` of the operation, as was used while forming the batch request.
   * @property {String} state - Status of the operation. Has either `FINISHED` or `FAILED` as values representing success & failure respectively.
   * @property {Object} output - HTTP Response from the D2-REST API for this operation
   */

  /**
   * Each operation of a D2-REST batch AJAX call
   * @typedef {Object} BatchOperationRequest
   * @property {string} id - A unique identifier of this operation. It has to be unique only within this current batch.
   * @property {Object} request - AJAX request for this operation
   * @property {string} request.method - HTTP method name. GET, POST, PUT, DELETE etc.
   * @property {string} request.uri - URL of the D2-REST API being invoked.
   * @property {string} [request.entity] - String serialized JSON body for the D2-REST API call.
   * @property {BatchOperationRequestHeader[]} [request.headers] - Additional headers to include in this D2-REST API call
   */

  /**
   * Request header of a batch operation
   * @typedef {Object} BatchOperationRequestHeader
   * @property {string} name - Name of the request header
   * @property {string} value - Value of the request header
   */

  /**
   * The built-in class for sending HTTP requests.
   * @external XMLHttpRequest
   * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
   */

  /**
   * Parsed AJAX error structure
   * @typedef ParsedErrorType
   * @property {string} code - Error code.
   * @property {string} message - Error message.
   * @property {string} [errorDetails] - Error details.
   */
});

csui.define('d2/sdk/utils/uri.templates',[
  'dctmw/lib/uri-templates'
], function(UriTemplatesImpl){
  'use strict';

  /**
   * Utility to help with parameter substitution for templatized URIs while turning it into an
   * accessible URI.
   *
   * @example <caption>Sample use</caption>
   * define([
   *  'd2/sdk/utils/rest.linkrels',
   *  'd2/sdk/utils/rest.resources',
   *  'd2/sdk/utils/uri.templates'
   * ], function(RestLinkrels, RestResources, UriTemplates){
   *  'use strict';
   *
   *  var LINKREL_SEND_MAIL_CFG = 'http://identifiers.emc.com/linkrel/d2-sendmail-config';
   *
   *  function getMailConfigURL() {
   *    var templateUrl = RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get('links'), LINKREL_SEND_MAIL_CFG);
   *    if (templateUrl) {
   *      var params = {
   *        'id': "default?"
   *      }, template = new UriTemplates(templateUrl);
   *
   *      return template.fill(params);
   *    }
   *  }
   *
   *  return {
   *    getMailConfigURL: getMailConfigURL
   *  };
   * });
   *
   * @module {d2/sdk/utils/uri.templates} d2/sdk/utils/"uri.templates"
   * @name UriTemplates
   *
   */

  /**
   * @constructs
   * @name UriTemplates
   * @alias module:UriTemplates
   * @param {string} templatizedUri - Templatized URI, which will later be turned into accessible URI.
   */

  var UriTemplates = UriTemplatesImpl;

  /**
   * @function
   * @name fill
   * @description Substitute template parameters with their values.
   * @param {object} templateParams - An object hash containing key-value pairs. All matching keys from the URI is replaced with the key's corresponding value.
   * @returns {String} Returns the accessible URI.
   * @instance
   */

  return UriTemplates;
});

csui.define('d2/sdk/utils/widget.constants',[
  'd2/utils/widget.constants'
], function(WidgetConstantsImpl){
  'use strict';

  /**
   * A few utility constants related to widgets
   *
   * @module {d2/sdk/utils/widget.constants} d2/sdk/utils/"widget.constants"
   * @name WidgetConstants
   * @extends Object
   *
   */

  return Object.freeze({
    /**
     * Tile config types.
     * @memberOf module:WidgetConstants
     * @type {Object}
     * @property {string} NONE - This tile requires a widget config
     * @property {string} WIDGET - This tile requires a widget config
     *
     */
    TileConfigTypes: WidgetConstantsImpl.TileConfigTypes,

    /**
     * OOTB D2 widget types that has an implementation within the D2 Smart View runtime
     * @memberOf module:WidgetConstants
     * @type {Object}
     * @property {string} RECENTLY_ACCESSED - RecentlyAccessedWidget
     * @property {string} CHECKOUT - CheckoutDocumentWidget
     * @property {string} DOCLIST - DoclistWidget
     * @property {string} FAVORITES - FavoritesWidget
     * @property {string} BRAVACSR - BravaCSRViewerWidget
     * @property {string} OPENURL - OpenURLWidget
     * @property {string} RELATIONS - DetailsRelationsWidget
     * @property {string} RENDITIONS - DetailsRenditionsWidget
     * @property {string} VERSIONS - DetailsVersionsWidget
     * @property {string} PROPERTIES - Properties
     * @property {string} SEARCH - SearchWidget
     * @property {string} MYSHARES - SharedDocumentWidget
     * @property {string} VDOC - VirtualDocWidget
     * @property {string} TASKS - TasksWidget
     * @property {string} WORKFLOWS - WorkflowOverviewWidget
     * @property {string} TASK_ATTACHMENTS - TaskAttachmentWidget
     * @property {string} BRAVAENTERPRISE - BravaEnterpriseViewerWidget
     * @property {string} BRAVAIV - OpenTextIntelligentViewingWidget
     *
     */
    D2: WidgetConstantsImpl.D2,

    /**
     * OOTB Default widget types available in D2 Smart View runtime.
     *
     * All of these default widget type names(including any new ones introduced by a D2 Plugin) could be calculated by normalizing
     * the default widget's XML tagname from the Smart View landing page xml configuration. In the normalization process any special
     * non-word character from the tagname needs to be removed.
     *
     * For an example if the xml tag name is `<my-custom-wdiget></my-custom-widget>`, it normalizes into `mycustomwidget` after removing all the `'-'` characters.
     * Another example `<task-attachments-widget></task-attachments-widget>` to `taskattachmentswidget`.
     * @memberOf module:WidgetConstants
     * @type {Object}
     * @property {string} VERSIONS - versionwidget
     * @property {string} RENDITIONS - renditionwidget
     * @property {string} RELATIONS - relationwidget
     * @property {string} SEARCH - doclistsearchresultswidget
     * @property {string} DOCLIST - doclistwidget
     * @property {string} FAVORITES - favoriteswidget
     * @property {string} BRAVACSR - bravacsrwidget
     * @property {string} VDOC - vdocwidget
     * @property {string} TASKS - taskswidget
     * @property {string} TASK_ATTACHMENTS - taskattachmentswidget
     * @property {string} MY_WORKFLOWS - myworkflowswidget
     * @property {string} ALL_WORKFLOWS - allworkflowswidget
     * @property {string} BRAVAENTERPRISE - bravaenterprisewidget
     * @property {string} BRAVAIV - otivwidget
     */
    DEFAULT: WidgetConstantsImpl.DEFAULT
  });
});

csui.define('d2/utils/contexts/context.utils',[
  'csui/utils/contexts/page/page.context',
  'dctmw/utils/authenticators/session'
], function(PageContext, Session){
  'use strict';

  return {
    createPageContext: function () {
      return new PageContext();
    },

    getPerspectiveContext: function() {
      return Session.get().getContext();
    }
  };
});

csui.define('d2/sdk/utils/contexts/context.utils',[
  'd2/utils/contexts/context.utils'
], function(ContextUtilsImpl){
  'use strict';

  /**
   * Utility to access `Context` object(s) associated with runtime.
   *
   * @todo Examples regular & unit test.
   *
   * @module {d2/sdk/utils/contexts/context.utils} d2/sdk/utils/contexts/"context.utils"
   * @name ContextUtil
   * @extends Object
   *
   */

  /**
   * @interface IContext
   * @ignore
   */

  /**
   * @interface PageContext
   * @extends Context
   *
   */

  /**
   * @interface PerspectiveContext
   * @extends Context
   */

  /**
   * @interface Context
   * @extends IContext
   */

  return {
    /**
     * Create and return a new `PageContext`. Useful while writing unit tests, where settin-up a `PerspectiveContext` is superflous.
     *
     * @returns {PageContext}
     * @memberOf module:ContextUtil
     */
    createPageContext: function () {
      return ContextUtilsImpl.createPageContext();
    },

    /**
     * Get the `PerspectiveContext` instance associated with runtime.
     *
     * @returns {PerspectiveContext}
     * @memberOf module:ContextUtil
     */
    getPerspectiveContext: function() {
      return ContextUtilsImpl.getPerspectiveContext();
    }
  };

  /* Documentation for interface Context */

  /**
   * @name isBusy
   * @function
   * @memberOf IContext#
   * @description Whether this context is still busy fetching the associated factories
   * @returns {boolean} `true` if still busy, `false` otherwise.
   */

  /**
   * @name isFetchable
   * @function
   * @memberOf IContext#
   * @description Whether a factory is fetchable in this context
   * @param {Factory} factory - The factory whose fetchability is being evaluated. See {@link ./factories/factory|Factory}.
   * @returns {boolean} `true` indicates the factory is fetchable.
   */

  /**
   * @name fetch
   * @function
   * @memberOf IContext#
   * @description Fetch all the factories associated with this context.
   * @param {object} options - options passed to each associated factories while fetching.
   * @returns {jQuery.Promise} the promise resolves when all the factories are fetched successfully.
   * @emits IContext#request
   * @emits IContext#sync
   * @emits IContext#error
   */

  /**
   * @name clear
   * @function
   * @memberOf IContext#
   * @description Destroy all factories associated with this context.
   * @param {object} options - options
   * @param {boolean} [options.all=false] - Whether to destroy all factories. By default only non-permanent factories are destroyed.
   * @returns {void}
   * @emits IContext#before:clear
   * @emits IContext#clear
   */

  /**
   * @name hasModel
   * @function
   * @memberOf IContext#
   * @description Whether a factory backed `Backbone.Model` instance exists in this context.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {boolean}
   */

  /**
   * @name hasCollection
   * @function
   * @memberOf IContext#
   * @description Whether a factory backed `Backbone.Collection` instance exists in this context.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {boolean}
   */

  /**
   * @name hasObject
   * @function
   * @memberOf IContext#
   * @description Whether a factory backed `Object` instance exists in this context.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {boolean}
   */

  /**
   * @name getModel
   * @function
   * @memberOf IContext#
   * @description Get a factory backed `Backbone.Model` instance from this context. A new instance is created for the first time or when the factory options could not be
   * generally compared with the options from other pre-existing instances.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {Backbone.Model} the model instance
   */

  /**
   * @name getCollection
   * @function
   * @memberOf IContext#
   * @description Get a factory backed `Backbone.Collection` instance from this context. A new instance is created for the first time or when the factory options could not be
   * generally compared with the options from other pre-existing instances.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {Backbone.Collection} the collection instance
   */

  /**
   * @name getObject
   * @function
   * @memberOf IContext#
   * @description Get a factory backed `Object` instance from this context. A new instance is created for the first time or when the factory options could not be
   * generally compared with the options from other pre-existing instances.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {Object} the instance
   */

  /**
   * @name destroy
   * @function
   * @memberOf IContext#
   * @description Destroy this context and all factories associated with it.
   * @returns {void}
   * @emits IContext#before:destroy
   * @emits IContext#destroy
   */

  /**
   * Context fetch started
   * @event IContext#request
   */

  /**
   * Context is fetched successfully.
   * @event IContext#sync
   */

  /**
   * Context is not fetched. It has failed due to error.
   * @event IContext#error
   */

  /**
   * Factories associated with this context are about to get destroyed.
   * @event IContext#before:clear
   */

  /**
   * Factories associated with this context are destroyed.
   * @event IContext#clear
   */

  /**
   * The context itself is about to be destroyed
   * @event IContext#before:destroy
   */

  /**
   * The context is destroyed along with associated factories
   * @event IContext#destroy
   */

  /* Documentation for interface Context */
});

csui.define('d2/sdk/utils/contexts/factories/factory',[
  'csui/utils/contexts/factories/factory'
], function(FactoryImpl){
  'use strict';

  /**
   * Interface for classes that want to implement a factory to create a `Backbone.Model` or `Backbone.Collection` or just a plain `Object`.
   *
   * The created model/collection/object is attached to the applicable `context` and all such instances are fetched when the `context` is fetched.
   *
   * @example <caption>To create a collection factory</caption>
   *
   * define([
   *   'module',
   *   'nuc/lib/underscore',
   *   'nuc/lib/backbone',
   *   'd2/sdk/utils/contexts/factories/factory',
   *   'd2/sdk/utils/contexts/factories/connector',
   *   'd2/sdk/utils/commands',
   *   'mybundle/models/sample.collection'
   *   ], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
   *    commands, SampleCollection) {
   *      'use strict';
   *
   *      var SampleCollectionFactory = CollectionFactory.extend({
   *
   *          propertyPrefix: 'sampleCollection',
   *
   *          constructor: function SampleCollectionFactory(context, options) {
   *            CollectionFactory.prototype.constructor.apply(this, arguments);
   *
   *            var collection = this.options.widget || this.options.sampleCollection || {}; //It is customary to use the same name as propertyPrefix
   *            if (!(collection instanceof Backbone.Collection)) {
   *              var connector = context.getObject(ConnectorFactory, options),
   *                config = module.config();
   *
   *              collection = new SampleCollection(collection.models, _.extend(
   *              { connector: connector },
   *              collection.options, config.options,
   *              SampleCollectionFactory.getDefaultResourceScope(),
   *              { autoreset: true }));
   *           }
   *
   *           this.property = collection;
   *         },
   *
   *         fetch: function (options) {
   *            return this.property.fetch(options);
   *         }
   *
   *      },
   *      {
   *
   *          getDefaultResourceScope: function () {
   *            return _.deepClone({
   *              commands: commands.getAllSignatures()
   *            });
   *          }
   *
   *      });
   *
   *      return SampleCollectionFactory;
   *
   * });
   *
   * @example <caption>Whereas the sample collection could be simply defined as</caption>
   *
   * define([
   *   'nuc/lib/backbone',
   *   'd2/sdk/models/mixins/collection.resource.mixin'
   * ], function(Backbone, CollectionResourceMixin){
   *  'use strict';
   *
   *  var SampleCollection = Backbone.Collection.extend({
   *    constructor: function SampleCollection(models, options) {
   *      options = options || {};
   *      this.options = options;
   *
   *      SampleCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeCollectionResource(options);
   *    }
   *  });
   *
   *  CollectionResourceMixin.mixin(SampleCollection.prototype);
   *
   *  return SampleCollection;
   * });
   *
   * @module {d2/sdk/utils/contexts/factories/factory} d2/sdk/utils/contexts/factories/factory
   * @name BaseFactory
   * @extends {Object}
   *
   */

  var Factory = FactoryImpl.extend({
    constructor: function Factory(context, options) {
      Factory.__super__.constructor.call(this, context, options);
    }
  });

  /**
   * Name against which the created model/collection/object is to be saved.
   * @name propertyPrefix
   * @type {string}
   * @memberOf module:BaseFactory
   * @instance
   * @abstract
   */

  /**
   * @name isFetchable
   * @function
   * @memberOf module:BaseFactory
   * @description Whether this factory instance is fetchable or not.
   * @returns {boolean} should return `true` when the model associated with this factory is fetchable, `false` otherwise.
   * @instance
   * @abstract
   */

  /**
   * @name fetch
   * @function
   * @memberOf module:BaseFactory
   * @description Should delegate this fetch to actually fetch the model/collection/object created by this factory.
   * @returns {void}
   * @instance
   * @abstract
   */

  return Factory;
});

csui.define('d2/sdk/utils/contexts/factories/connector',[
  'csui/utils/contexts/factories/connector'
], function(ConnectorFactoryImpl){
  'use strict';

  /**
   * Factory to create/access a `connector` object. A `connector` object acts as an
   * authenticated transport for connecting to D2-REST resources through AJAX apis.
   *
   * D2 Smartview runtime uses a single connector object created through this factory.
   *
   * Such a `connector` can be used standalone with `jQuery` AJAX apis, or it can be set as the
   * transport for a `Backbone.Model` or `Backbone.Collection` instance.
   *
   * @example <caption>To get the active connector instance in any module</caption>
   * define([
   *  'd2/utils/contexts/context.utils',
   *  'd2/utils/contexts/factories/connector'
   * ], function(contextUtils, ConnectorFactory){
   *  'use strict';
   *
   *  var context = contextUtils.getPerspectiveContext(),
   *    connector = context.getObject(ConnectorFactory);
   *
   *  // Do whatever with the connector instance
   * });
   *
   * @module {d2/sdk/utils/contexts/factories/connector} d2/sdk/utils/contexts/factories/connector
   * @name ConnectorFactory
   * @extends external:BaseFactory
   */

  /**
   * @external BaseFactory
   * @see ./factory
   */

  var ConnectorFactory = ConnectorFactoryImpl.extend({
    constructor: function ConnectorFactory(context, options) {
      ConnectorFactory.__super__.constructor.call(this, context, options);
    }
  });

  return ConnectorFactory;
});

csui.define('d2/sdk/utils/test/common.mock',[
  'd2/utils/test/common.core.mock'
], function (CommonCoreMock) {
  'use strict';

  /**
   * Not a part of D2 Smart View application runtime, rather it helps in writing unit tests.
   *
   * CommonMock abstracts out few common setup & tear-down for every unit test case written.
   *
   * @example <caption>With common.mock, structure of a unit test mymodule.spec.js could be look like</caption>
   * define(['d2/sdk/utils/test/common.mock'], function(commonMock){
   *    'use strict';
   *
   *    describe("My module", function(){
   *
   *      // Outermost setup
   *      beforeAll(function(){
   *        commonMock.enable();
   *
   *        //ohter setup code
   *      });
   *
   *      // Outermost teardown
   *      afterAll(function(){
   *        commonMock.disable();
   *
   *        //ohter teardown code
   *      });
   *
   *      describe("some group", function(){
   *         it("test1", function(){
   *            // test code
   *         });
   *
   *         it("test2", function(){
   *            // test code
   *         });
   *
   *         // any other test for this group could go here
   *      });
   *
   *      it("test3", function(){
   *        // this test is not grouped
   *        // test code
   *      });
   *    });
   * });
   *
   * @module {d2/sdk/utils/test/common.mock} d2/sdk/utils/test/"common.mock"
   * @name CommonMock
   * @extends {Object}
   */

  return {
    /**
     * Enables the common mock APIs. Should be called while setting-up unit test.
     * @memberOf module:CommonMock
     */
    enable: function() {
      CommonCoreMock.enable();
    },

    /**
     * Disables the common mock APIs. Should be called while tearing-down a unit test.
     * @memberOf module:CommonMock
     */
    disable: function() {
      CommonCoreMock.disable();
    }
  };
});


csui.define('d2/sdk/widgets/list.tile/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('d2/sdk/widgets/list.tile/impl/nls/root/lang',{
  /*
  Section Start:Simple List Tile View
   */
  dialogTitle: 'My Widget',
  expandAria: 'Expand',
  searchPlaceholder: 'Search items',
  searchAria: 'Search for items',
  openView: 'Open'

  /*
  Section End:Simple List Tile View
   */

});



csui.define('d2/sdk/widgets/list.tile/list.tile.view',[
  'd2/widgets/widgettile/widgettile.view',
  'i18n!d2/sdk/widgets/list.tile/impl/nls/lang',
], function (WidgetTileView/*, lang*/) {
  'use strict';

  /**
   * Base class for all list type of tiles in D2 Smart View landing perspective.
   *
   * Each list tile has 4 different data states - Full (non-zero items), Empty(zero items),
   * ZeroResult(non-zero items but header filter yields zero matching item)
   * and Error (AJAX error while fetching data for the list). Empty, ZeroResult and Error states are
   * represented by a non-customizable background icon and customizable text message.
   * Each tile is already equipped with default message for these states, however those can be customized
   * if needed, by setting `emptyListText`, `zeroResults` and `failedListText` keys in the `lang` constructor option.
   *
   * @example <caption>A minimum sample list derivative may look like</caption>
   * //In mybundle/widgets/my.tile/my.tile.view.js
   * define([
   *  'd2/sdk/widgets/list.tile/list.tile.view',
   *  'mybundle/utils/contexts/factories/sample.tile.collection.factory'
   * ], function(ListTileView, SampleTileCollectionFactory){
   *    'use strict';
   *
   *    var SampleListTileView = ListTileView.extend({
   *      constructor: function SampleListTileView(options) {
   *        options = options || {};
   *        options.collectionFactory = SampleTileCollectionFactory;
   *
   *        SampleListTileView.__super__.constructor.call(this, options);
   *      }
   *    });
   *
   *    return SampleListTileView;
   * });
   *
   * @example <caption>To link this definition to the list of tiles looked up at landing page resolution time</caption>
   * //in mybundle/extensions/landing.tiles.js
   * define([], function(){
   *  'use strict';
   *
   *  return [{
   *    ...
   *    tileView: 'mybundle/widgets/my.tile/my.tile.view',
   *    ...
   *  }];
   * });
   *
   * @example <caption>Then finally the extension is registered in extension.json as</caption>
   * {
   *   "d2/sdk/utils/landingpage/tiles": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/extensions/landing.tiles"
   *         }
   *      }
   *    }
   * }
   *
   * @module {d2/sdk/widget/list.tile/list.tile.view} d2/sdk/widget/list.tile/"list.tile.view"
   * @name ListTileView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  var SimpleListTileView = WidgetTileView.extend({

    /**
     * @constructs
     * @alias module:ListTileView
     * @name ListTileView
     * @param {object} options - constructor options
     * @param {ListTileData} [options.data] - Generic purpose data. Defaults to nothing.
     * @param {Factory} [options.collectionFactory] - A collection factory reference that will be used to create the collection that holds the data for this tile.
     * See {@link ../../utils/contexts/factories/factory|Factory}
     * @param {Backbone.Collection} [options.collection] - Reference to a collection instance to be used as data holder. Either one of `collectionFactory` or `collection` is required
     * If both are present in `options` then precedence is given to `collection`.
     * @param {object} [options.lang] - Translation keys to be used for displaying labels associated with this tile. Through keys `failedListText`, `emptyListText` & `zeroResults` the view's data state message can be customized.
     * @param {string} [options.orderBy] - Default sorting order for the data to be displayed in this tile. Defaults to `name asc` i.e sort by item names in ascending order.
     * @param {Boolean} [options.showTitleIcon] - Whether to show/hide icon for this tile. Defaults to `true`.
     * @param {Context} [options.context] - The application context. See {@link ../../utils/contexts/context.utils#Context|Context}
     * @param {Boolean} [options.showInlineActionBar] - Whether to show menu actions on this tile's items. Defaults to `true`. However, actual display of menu
     * depends on `toolbarItems` configuration and availability of actions against each list item.
     * @param {ToolItemsFactory} [options.toolbarItems] - The menu configuration for this tile's items. Default to Doclist menu configuration.
     * See {@link ../../controls/toolbar/toolitems.factory|ToolItemsFactory}
     * @param {string} [options.applicationScope] - Name of the application scope perspective which this tile may expand into. The value for this property
     * will be matched against all the registered application scopes. The relevant header button is enabled only if a match is found.
     * @param {Boolean} [options.hideOpenPerspective] - Whether to hide the header button that makes this tile expand into the linked application scope perspective.
     * Defaults to `false`.
     * @param {Boolean} [options.hideSearch] - Whether to hide the search box from tile header. Defaults to `false`.
     */
    constructor: function SimpleListTileView(options) {
      options = options || {};

      /*options.data.icon = options.icon;
      options.tileLang = options.lang || lang;
      if(options.showExpanded === undefined) {
        options.showExpanded = (options.perspectiveId === undefined) ? false : true;
      }

      if(!options.collectionFactory && !options.collection) {
        throw new Error('CollectionFactory or Collection is required');
      }
      if(!options.icon) {
        console.warn("Iconless tile will be rendered");
      }
      if(!options.lang) {
        console.warn("Good to have a lang file else generic messages will be shown");
      }
      if(options.showExpanded && !options.perspectiveId) {
        throw new Error("PespectiveId is required for expanded view");
      }*/


      SimpleListTileView.__super__.constructor.call(this, options);

      /*this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleReserveEvents: true
      });*/
    },

    /**
     * Get the name of factory param if this list view is backed by a collection factory.
     * For easy coupling factory param should be given a name same as the `propertyPrefix` of the backing collection factory.
     * @return {string} Should return the factory param name.
     * @instance
     */
    getFactoryParam: function() {
      var factoryProp = this.options.collectionFactory && this.options.collectionFactory.prototype.propertyPrefix;
      return factoryProp ? factoryProp : SimpleListTileView.__super__.getFactoryParam.apply(this, arguments);
    }
  });

  /**
   * @name onClickItem
   * @function
   * @description Handles what happens when a list item is clicked or equivalent user interaction happens.
   * The default implementation executes default action associated with the list item.
   * @param {Marionette.View} target - View instance associated with the item being clicked.
   * @return {void}
   * @instance
   */

  /**
   * @name onClickHeader
   * @function
   * @description Handles what happens when the tile's header is clicked. The default implementation tries to open
   * up linked application scope perspective, if any. Setting a special constructor option `avoidOpenPerspectiveOnHeader` to `true` prevents the
   * default behavior from happening.
   * @returns {void}
   * @instance
   */

  /**
   * @static
   * @name extend
   * @function
   * @description To define a derived type from `ListTileView`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  /**
   * Generic purpose data for the tile. Properties other than `icon` and `title` are directly merged with other constructor options.
   * @typedef {Object} ListTileData
   * @property {string} icon - CSS class name of the tile header icon
   * @property {string} title - Header label for the tile
   */

  return SimpleListTileView;

});


csui.define('d2/sdk/widgets/shortcut.tile/shortcut.tile.behavior',[
  'd2/widgets/shortcut/shortcut.behavior'
], function(ShortcutBehaviorImpl){
  'use strict';

  /**
   * Interface for all classes that want to implement a shortcut tile's behavior.
   * Defines what should happen when user clicks on a particular shortcut tile in D2 Smart View landing perspective and also lets customize
   * appearance of the shortcut tile upto some extent.
   *
   * @example <caption>A new shortcut behavior url.shortcut.behavior.js could be defined as</caption>
   * define([
   *    'd2/sdk/widgets/shortcut.tile/shortcut.tile.behavior',
   *    'd2/sdk/utils/utils'
   * ], function(BaseShortcutBehavior, utils){
   *    'use strict';
   *
   *    var URLShortcutBehavior = BaseShortcutBehavior.extend({
   *        onClick: function() {
   *          if(this.options.data.url) {
   *            utils.openUrlInWindow(this.options.data.url, window.open(''));
   *          }
   *        }
   *    });
   *
   *    return URLShortcutBehavior;
   * });
   *
   * @example <caption>to register this shortcut behavior with ShortcutTileBehaviorCollection, add in extension.json</caption>
   * {
   *   "d2/sdk/widgets/shortcut.tile/shortcut.tile.behaviors": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/extensions/my.shortcut.behaviors"
   *        }
   *      }
   *    }
   * }
   *
   * @example <caption>where my.shortcut.behaviors.js is defined as</caption>
   * define([
   *    'mybundle/widgets/shortcut.tile/url.shortcut.behavior'
   * ], function(URLShortcutBehavior){
   *    'use strict';
   *
   *    // see 'ShortcutBehaviorType' documentation below for all possible properties and their usage.
   *    return [
   *      {type: 'OpenURLWidget', behaviorClass: URLShortcutBehavior}
   *      // Additional behaviors can also be registered
   *    ];
   * });
   *
   * @module {d2/sdk/widgets/shortcut.tile/shortcut.tile.behavior} d2/sdk/widgets/shortcut.tile/"shortcut.tile.behavior"
   * @name ShortcutTileBehavior
   * @extends {external:Marionette.Behavior}
   */

  /**
   * @external "Marionette.Behavior"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.behavior.html
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  var ShortcutTileBehavior = ShortcutBehaviorImpl.extend({
    constructor: function ShortcutTileBehavior() {
      ShortcutTileBehavior.__super__.constructor.apply(this, arguments);
    },

    /**
     * Marionette view lifecycle hook. It can be overriden to make any changes to the DOM element of the underlying shortcut view.
     * If overriden, it should call the `onRender` method of super type as the first thing. See example above.
     * @instance
     * @abstract
     */
    onRender: function() {
      ShortcutTileBehavior.__super__.onRender.apply(this, arguments);

      // Custom logic that can't be run until the short cut is visible in the UI
    },

    /**
     * Business logic to define what happens on click. It can be overriden to provide custom logic.
     * @instance
     * @abstract
     */
    onClick: function() {
      ShortcutTileBehavior.__super__.onClick.apply(this, arguments);

      // Custom code to do something awesome.
    }
  });

  /**
   * @name view
   * @type {external:Marionette.View}
   * @description reference to the shortcut's presentation
   * @instance
   */

  /**
   * @name viewModel
   * @type {external:Backbone.Model}
   * @description the model controlling the shortcut view
   * @instance
   */

  /**
   * @name context
   * @type {Context}
   * @description active application context
   * @see {@link ../../utils/contexts/context.utils#Context|Context}
   * @instance
   */

  /**
   * @name options
   * @type {Object}
   * @description Holder of parameters passed during shortcut construction. Has a normalized reference to the D2 Smart View landing page configuration behind this shortcut tile.
   * @instance
   */

  /**
   * Extension definition to link a shortcut behavior implementation with a shortcut tile type.
   * @typedef {Object} ShortcutBehaviorType
   * @property {string} type - Type of the shortcut tile.
   * @property {ShortcutTileBehavior} behaviorClass - The behavior implementation.
   * @property {number} [sequence=1000] - Priority of this behavior for the given `type`. Among all behaviors with matching `type` value, the one with lowest `sequence` is finally used.
   */

  /**
   * @static
   * @name extend
   * @function
   * @description To define a derived type from `ShortcutTileBehavior`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return ShortcutTileBehavior;
});

csui.define('d2/sdk/widgets/nodestable/nodestable.view',[
  'nuc/lib/underscore',
  'd2/widgets/widgettable/widgettable.view'
], function(_, NodesTableViewImpl){
  'use strict';

  /**
   * Base class for all table-like widgets. Typically a subclass of this type is used whenever an
   * {@link ../../utils/perspectives/app.scope.perspectives|ApplicationScopePerspective} requires a table-like rendering.
   *
   * @example <caption>A minimum sample derivative may look like</caption>
   * //In mybundle/widgets/sample.table/sample.table.view.js
   *
   * define([
   *  'd2/sdk/widgets/nodestable/nodestable.view',
   *  'mybundle/utils/contexts/factories/sample.table.collection.factory'
   * ], function(NodesTableView, SampleTableCollectionFactory){
   *    'use strict';
   *
   *    var SampleTableView = NodesTableView.extend({
   *      constructor: function SampleTableView(options) {
   *        options = options || {};
   *        options.className = 'my-table-view';
   *        options.d2collectionFactory = SampleTableCollectionFactory;
   *
   *        SampleTableView.__super__.constructor.call(this, options);
   *      }
   *    });
   *
   *    return SampleTableView;
   * });
   *
   * @example <caption>To link it to a perspective</caption>
   * //In mybundle/utils/perspectives/table.perspective.json
   *
   *  {
   *      "type": "left-center-right",
   *      "options": {
   *        "center": {
   *          "type": "mybundle/widgets/sample.table"
   *        }
   *      }
   *  }
   *
   *
   * //In mybundle/extensions/perspectives.js
   * define([], function(){
   *  'use strict';
   *
   *  return [{
   *    ...,
   *    perspectiveJson: 'mybundle/utils/perspectives/table.perspective.json',
   *    ...
   *  }];
   * });
   *
   * @example <caption>Finally, to register the perspective definition as an application scope perspective</caption>
   * //In extensions.json
   * {
   *   "d2/sdk/utils/perspectives/app.scope.perspectives": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/extensions/perspectives"
   *         }
   *      }
   *    }
   * }
   *
   *
   * @module {d2/sdk/widgets/nodestable/nodestable.view} d2/sdk/widgets/nodestable/"nodestable.view"
   * @name NodesTableView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  /**
   * @external ToolitemsFactory
   * @see ../../controls/toolbar/toolitems.factory
   */

  /**
   * @external NodeModel
   * @see ../../models/node.model
   */

  var NodesTableView = NodesTableViewImpl.extend({

    /**
     * @constructs
     * @alias module:NodesTableView
     * @name NodesTableView
     * @param {object} [options] - Constructor options
     * @param {string} [options.cssClass] - CSS class name to be added to HTML element representing this whole table view. `options.className` will have a higher precedence over the same purpose.
     * @param {Factory} [options.d2collectionFactory] - Collection factory to be used to instantiate the collection that will hold data for this table.
     * @param {function} [options.collectionClass] - A constructor type to be used to instantiate the data holder collection.
     * @param {Backbone.Collection} [options.collection] - A collection instance to be used as data holder for the table. One of `d2collectionFactory`, `collectionClass` or
     * `collection` has to be provided as part of constructor options. Otherwise, it fails with error.
     * @param {NodesTableToolbar} [options.toolbarItems] - Menu configuration for the table view.
     */
    constructor: function NodesTableView(options) {
      options = options || {};
      if(options.className) {
        options.cssClass = options.className;
        delete options.className;
      }

      NodesTableView.__super__.constructor.call(this, options);
    },

    className: function() {
      var superClassName = NodesTableView.__super__.className,
        className = '';
      if(_.isFunction(superClassName)) {
        className += ' ' + superClassName.call(this);
      } else if(_.isString(superClassName)) {
        className += superClassName;
      }

      return className + ' ' + this.options.cssClass;
    },

    /**
     * @returns {string} Text to be shown when there are no items in the data holder collection.
     * @instance
     */
    getZeroRecordText: function() {
      return NodesTableView.__super__.getZeroRecordText.apply(this, arguments);
    },

    /**
     *
     * @returns {string} Title to show at header of this table
     * @instance
     */
    getTitle: function() {
      return NodesTableView.__super__.getTitle.apply(this, arguments);
    },

    /**
     * @returns {external:NodeModel} A node model to hold representation data for the table header.
     * @instance
     */
    getContainerNode: function() {
      return NodesTableView.__super__.getContainerNode.apply(this, arguments);
    },

    /**
     *
     * @returns {object} Additional attributes to be merged with the NodeModel returned from `getContainerNode()`.
     * @instance
     */
    getExtraIconConfig: function() {
      return NodesTableView.__super__.getExtraIconConfig.apply(this, arguments);
    },

    /**
     * @returns {object} Additional option to be used while constructing the collection from `collectionClass` constructor option.
     * @instance
     */
    getCollectionOptions: function() {
      return NodesTableView.__super__.getCollectionOptions.apply(this, arguments);
    }
  });

  /**
   * Toolbar type for NodesTable.
   * @typedef {Object} NodesTableToolbar
   * @property {external:ToolitemsFactory} inlineActionbar - Menu configuration used at individual item level.
   * @property {external:ToolitemsFactory} tableHeaderToolbar - Menu configuration for the header.
   */

  /**
   * @static
   * @name extend
   * @function
   * @description To define a derived type from `NodesTableView`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return NodesTableView;
});

/**
 * @license d2sv-sdk 23.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text.
 */
csui.define('d2/sdk/widgets/metadata.panel/metadata.panel.view',[
  'nuc/lib/marionette'
], function (Marionette) {
  'use strict';

  /**
   * Interface for all custom metadata views.
   * This is an extension of Marionette Layout View
   *
   * @example <caption>A new metadata view metadata.helloworld.view.js could be defined as</caption>
   * define([
   *   'd2/sdk/widgets/metadata.panel/metadata.panel.view'
   * ], function (MetadataPanelView) {
   *   'use strict';
   *
   *   var helloworldViewTemplate = '<script type="text/html">' +
   *       '<h3 style="\n' +
   *       '    margin-top: 48px;\n' +
   *       '    padding: 16px;\n' +
   *       '    font-size: 24px;\n' +
   *       '    color: red;\n' +
   *       '">Hello World !</h3>' +
   *       '</script>';
   *
   *   var MetadataHelloworldView = MetadataPanelView.extend({
   *     template: helloworldViewTemplate
   *   }, {
   *     enabled: function () {
   *       // This metadata view will be shown or hidden based on whether
   *       //       the enabled function returns true or false
   *       return true;
   *     }
   *   });
   *
   *   return MetadataHelloworldView;
   * });
   *
   * @example <caption>Suppose we do not want to show this metadata view for task, workflow step, repository, folders and cabinets, we can write a simple equality check for node type using [constants](../../utils/constants) utils from sdk</caption>
   *    enabled: function (options) {
   *        var nodeType = options.node && options.node.get('type');
   *
   *        if (nodeType === constants.Types.TASK ||
   *            nodeType === constants.Types.WORKFLOW_STEP ||
   *            nodeType === constants.Types.REPOSITORY ||
   *            nodeType === constants.Types.FOLDER ||
   *            nodeType === constants.Types.CABINET) {
   *            return false;
   *        }
   *
   *        return true;
   *    }
   *
   * @example <caption>To register this metadata view with metadata panel views array, add the entry in extension.json as</caption>
   * {
   *   "d2/sdk/widgets/metadata.panel/metadata.panel.views": {
   *      "extensions": {
   *        "mybundle": [
   *          "mybundle/extensions/metadata.panel.views"
   *        ]
   *      }
   *    }
   * }
   *
   * @example <caption>The metadata.panel.views.js is defined as below. Optionally a sequence value(greater than 1000) can be passed to the metadata view entry to specify their order in the dropdown</caption>
   * define([
   *    'mybundle/widgets/metadata/panels/helloworld/metadata.helloworld.view'
   * ], function(MetadataHelloworldView){
   *    'use strict';
   *
   *    // Array of metadata views added to the plugin
   *    return [
   *
   *      // Each metadata view entry should have a name, title to be shown for the dropdown option
   *      //     and content view to be shown on metadata panel when this view is selected
   *
   *      // Incase multiple metadata views(panels) are added in a plugin or multiple plugins with panels are
   *      //     deployed, then the order of these panels in dropdown are determined at runtime.
   *      //     If panels are to be placed in specific sequence in dropdown,
   *      //     then add a numeric value greater than 1000 for sequence attribute(values upto 1000 are used internally).
   *      //     The panels should appear in ascending order of their sequence in dropdown
   *
   *      {
   *             name: 'helloworld', // The metadata view name, it has to be a unique string
   *             title: 'Hello World',
   *             contentView: MetadataHelloworldView,
   *             sequence: 1010 // The sequence value determines the order in which these panels appear in the dropdown
   *      }
   *
   *      // Additional metadata views can also be registered in this array
   *    ];
   * });
   *
   * @module {d2/sdk/widgets/metadata.panel/metadata.panel.view} d2/sdk/widgets/metadata.panel/metadata.panel.view"
   * @name MetadataPanelView
   * @extends {external:Marionette.LayoutView}
   */

  /**
   * @external "Marionette.LayoutView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.layoutview.html
   */

  var MetadataPanelView = Marionette.LayoutView.extend({
    constructor: function MetadataPanelView(options) {
      MetadataPanelView.__super__.constructor.call(this, options);
    }
  }, {
    /**
     * Decides whether to show or hide dropdown option for this metadata view based on the return value(true or false).
     * @param {Object} [options] - The options object will have the selected documentum object and context details.
     * The options.node will have the selected [documentum object](../../models/node.model) reference
     * and it contains the object information like object id, name, type etc.
     * Conditions can be added based on these attributes
     * to return true/false (show/hide the dropdown option for the selected documentum object).
     * @returns {boolean}
     * @memberOf module:MetadataPanelView
     */
    enabled: function () {
      return true;
    }
  });

  /**
   * @name options
   * @type {Object}
   * @description Holder of parameters passed during metadata view construction.
   * @instance
   */

  /**
   * @name model
   * @type {NodeModel}
   * @description Selected documentum object reference. It holds information like object id, name, type etc.
   * @see {@link ../../models/node.model|NodeModel}
   * @instance
   */

  return MetadataPanelView;
});

/**
 * @license d2sv-sdk 23.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text.
 */
csui.define('d2/sdk/widgets/task.details.panel/task.details.panel.view',[
  'nuc/lib/marionette'
], function (Marionette) {
  'use strict';

  /**
   * Interface for all custom task details views.
   * This is an extension of Marionette Layout View
   *
   * @example <caption>A new task details view task.helloworld.view.js could be defined as</caption>
   * define([
   *   'd2/sdk/widgets/task.details.panel/task.details.panel.view'
   * ], function (TaskDetailsPanelViews) {
   *   'use strict';
   *
   *   var helloworldViewTemplate = '<script type="text/html">' +
   *       '<h3 style="\n' +
   *       '    padding: 16px;\n' +
   *       '    font-size: 24px;\n' +
   *       '    color: red;\n' +
   *       '">Hello World !</h3>' +
   *       '</script>';
   *
   *   var TaskHelloworldView = TaskDetailsPanelViews.extend({
   *     template: helloworldViewTemplate
   *   }, {
   *     enabled: function () {
   *       // This task details view will be shown or hidden based on whether
   *       //       the enabled function returns true or false
   *       return true;
   *     }
   *   });
   *
   *   return TaskHelloworldView;
   * });
   *
   * @example <caption>Suppose we want to show this task details view for only those task where assignee is dmadmin, we can write a simple equality check for node's type and assignee attributes and using [constants](../../utils/constants) utils from sdk</caption>
   *    enabled: function (options) {
   *        var nodeType = options.node.get('type'),
   *            assignee = options.node && options.node.get('assignee');
   *
   *        if (nodeType === constants.Types.TASK &&
   *            assignee === 'dmadmin') {
   *            return true;
   *        }
   *
   *        return false;
   *    }
   *
   * @example <caption>To register this task details view with task details panel views array, add the entry in extension.json as</caption>
   * {
   *   "d2/sdk/widgets/task.details.panel/task.details.panel.views": {
   *      "extensions": {
   *        "mybundle": [
   *          "mybundle/extensions/task.details.panel.views"
   *        ]
   *      }
   *    }
   * }
   *
   * @example <caption>The task.details.panel.views.js is defined as below. Optionally a sequence value(greater than 1000) can be passed to the task details view entry to specify their order in the tab panel</caption>
   * define([
   *    'mybundle/widgets/task.details/panels/helloworld/task.helloworld.view'
   * ], function(TaskHelloworldView){
   *    'use strict';
   *
   *    // Array of task details views added to the plugin
   *    return [
   *
   *      // Each task details view entry should have a name, title to be shown for the tab
   *      //     and the content view to be shown on the task details panel when this tab is selected
   *
   *      // Incase multiple task details views(tabs) are added in a plugin or multiple plugins with tabs are
   *      //     deployed, then the order of these tabs in tab panel are determined at runtime.
   *      //     If tabs are to be placed in specific sequence in tab panel,
   *      //     then add a numeric value greater than 1000 for sequence attribute(values upto 1000 are used internally).
   *      //     The tabs should appear in ascending order of their sequence in tab panel
   *      {
   *             name: 'helloworld', // The task details tab name, it has to be a unique string
   *             title: 'Hello World',
   *             contentView: TaskHelloworldView,
   *             sequence: 1010 // The sequence value determines the order in which these tabs appear in the tab panel
   *      }
   *
   *      // Additional task details views can also be registered in this array
   *    ];
   * });
   *
   * @module {d2/sdk/widgets/task.details.panel/task.details.panel.view} d2/sdk/widgets/task.details.panel/task.details.panel.view"
   * @name TaskDetailsPanelView
   * @extends {external:Marionette.LayoutView}
   */

  /**
   * @external "Marionette.LayoutView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.layoutview.html
   */

  var TaskDetailsPanelView = Marionette.LayoutView.extend({
    constructor: function TaskDetailsPanelView(options) {
      TaskDetailsPanelView.__super__.constructor.call(this, options);
    }
  }, {
    /**
     * Decides whether to show or hide tab for this task details view based on the return value(true or false).
     * @param {Object} [options] - The options object will have the selected task/workflow and context details.
     * The options.node will have the selected [task/workflow](../../models/node.model) reference
     * and it contains information about task/workflow attributes like id, name etc.
     * Conditions can be added based on these attributes
     * to return true/false (show/hide the tab for the selected task/workflow).
     * @returns {boolean}
     * @memberOf module:TaskDetailsPanelView
     */
    enabled: function () {
      return true;
    }
  });

  /**
   * @name options
   * @type {Object}
   * @description Holder of parameters passed during task details view construction.
   * @instance
   */

  /**
   * @name model
   * @type {NodeModel}
   * @description Selected task/workflow reference. It holds information like task/workflow id, name, type etc.
   * @see {@link ../../models/node.model|NodeModel}
   * @instance
   */

  return TaskDetailsPanelView;
});

csui.define('bundles/d2-sdk',[
  'd2/utils/sdk.ext.loader',
  'd2/utils/sdk.startup',
  'd2/dialogs/generic/dynamic.dialog',

  'd2/sdk/commands/command',
  'd2/sdk/commands/call.service.command',
  'd2/sdk/commands/create.folder.type.filters',
  'd2/sdk/commands/default.actions.rules',
  'd2/sdk/commands/node.actions.rules',
  'd2/sdk/commands/progressive.nodes.command',

  'd2/sdk/controls/action.icons/action.icons',
  'd2/sdk/controls/alerts/modal.alert',
  'd2/sdk/controls/alerts/customizable.content.modal.alert',
  'd2/sdk/controls/behaviors/open.app.scope.behavior',
  'd2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior',
  'd2/sdk/controls/blocker/blocker',
  'd2/sdk/controls/dialogs/content.assist.dialog',
  'd2/sdk/controls/dialogs/simple.dialog',
  'd2/sdk/controls/dialogs/stepper.wizard',
  'd2/sdk/controls/dialogs/generic/d2fs.state.method',
  'd2/sdk/controls/dialogs/generic/dialog.action',
  'd2/sdk/controls/dialogs/generic/dialog.content.view',
  'd2/sdk/controls/dialogs/generic/dialog.form.view',
  'd2/sdk/controls/dialogs/generic/dialog.schema.builder',
  'd2/sdk/controls/dialogs/generic/dialog.state.method',
  'd2/sdk/controls/form/form.converter',
  'd2/sdk/controls/form/form.view',
  'd2/sdk/controls/form/form.model',
  'd2/sdk/controls/globalmessage/globalmessage',
  'd2/sdk/controls/list/listitem.type.model.view',
  'd2/sdk/controls/list/listitem.type.node.view',
  'd2/sdk/controls/list/listitem.type.object.view',
  'd2/sdk/controls/list/simple.list.view',
  'd2/sdk/controls/list/sortable.list.view',
  'd2/sdk/controls/mixins/layoutview.events.propagation.mixin',
  'd2/sdk/controls/mixins/widget.view.state.mixin',
  'd2/sdk/controls/icon.sprites/tree.icon.sprites',
  'd2/sdk/controls/icon.sprites/node.icon.sprites',
  'd2/sdk/controls/query.form/query.form.view',
  'd2/sdk/controls/query.form/query.form.panel.view',
  'd2/sdk/controls/regions/non-emptying.region',
  'd2/sdk/controls/table/table.view',
  'd2/sdk/controls/table/cells/cell.registry',
  'd2/sdk/controls/table/cells/templated.cell.view',
  'd2/sdk/controls/toolbar/toolitems.factory',
  'd2/sdk/controls/tree/tree.view',

  'd2/sdk/integration/folder.browser.id.rules',

  'd2/sdk/models/mixins/browsable.collection.mixin',
  'd2/sdk/models/mixins/collection.resource.mixin',
  'd2/sdk/models/mixins/collection.delayed.data.mixin',
  'd2/sdk/models/mixins/commandable.mixin',
  'd2/sdk/models/mixins/resource.mixin',
  'd2/sdk/models/node.model',
  'd2/sdk/models/node.collection',
  'd2/sdk/models/table/column.collection',
  'd2/sdk/models/table/column.preference',

  'd2/sdk/utils/commands',
  'd2/sdk/utils/commandhelper',
  'd2/sdk/utils/constants',
  'd2/sdk/utils/content.assist',
  'd2/sdk/utils/oauth.login.dialog',
  'd2/sdk/utils/rest.resources',
  'd2/sdk/utils/rest.linkrels',
  'd2/sdk/utils/session',
  'd2/sdk/utils/server.query.utils',
  'd2/sdk/utils/utils',
  'd2/sdk/utils/uri.templates',
  'd2/sdk/utils/widget.constants',

  'd2/sdk/utils/contexts/context.utils',
  'd2/sdk/utils/contexts/factories/factory',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/utils/landingpage/default.widget.types.map',
  'd2/sdk/utils/landingpage/tiles',
  'd2/sdk/utils/perspectives/app.scope.perspectives',

  'd2/sdk/utils/test/common.mock',

  'd2/sdk/widgets/list.tile/list.tile.view',
  'd2/sdk/widgets/shortcut.tile/shortcut.tile.behavior',
  'd2/sdk/widgets/nodestable/nodestable.view',

  'd2/sdk/widgets/metadata.panel/metadata.panel.view',
  'd2/sdk/widgets/task.details.panel/task.details.panel.view'
], {});

csui.require(['require','css'], function(require, css){css.styleLoad(require, 'd2/bundles/d2-sdk', true);});
//# sourceMappingURL=d2-sdk.js.map