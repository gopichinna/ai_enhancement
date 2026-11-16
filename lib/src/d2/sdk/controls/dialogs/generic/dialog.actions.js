/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from 'nuc/lib/underscore';
import dialogActions from 'd2/dialogs/generic/dialog.action.collection';
import extDialogActions from 'dctm-ext!d2/sdk/controls/dialogs/generic/dialog.actions';

/**
 * Collection of actionables for D2SV generic dialogs. Each screens of D2SV generic dialog offers a few footer buttons for the end user to
 * interact with in order to change state of the dialog. Items from this collection acts as handler of button clicks for D2SV generic dialog
 * such that each item could be loosely attached to any of generic dialog's footer button after evaluating the action's matching conditions.
 *
 * By default, D2SV runtime registers actions that matches buttons with id 'buttonOk', 'buttonCancel', 'cancel' & 'previous'. New actions could
 * be registered by means of extensions.
 *
 * @see {@link ./dialog.action|DialogAction}
 *
 * @example <caption>To register new actions, in extensions.json</caption>
 * {
 *  "d2/sdk/controls/dialogs/generic/dialog.actions": {
 *    "extensions": {
 *      "mybundle": [
 *        "mybundle/extensions/generic.dialog.actions"
 *      ]
 *    }
 *  }
 * }
 *
 * @example <caption>whereas generic.dialog.actions.js could be defined as</caption>
 * import ActionA from 'mybundle/generic.dialog/action.a';
 * import ActionB from 'mybundle/generic.dialog/action.b';
 *
 * const actionRules = [
 *  {equals: {"button.id": "custom1"}, action: ActionA},
 *  {equals: {"button.id": "custom2"}, action: ActionB}
 * ];
 *
 * export default actionRules;
 *
 * @module {d2/sdk/controls/dialogs/generic/dialog.actions} d2/sdk/controls/dialogs/generic/"dialog.actions"
 * @name DialogActions
 * @extends {external:Backbone.Collection}
 */

/**
 * @external "Backbone.Collection"
 * @see https://backbonejs.org/#Collection
 */

if(extDialogActions) {
  const actions = [].concat(_.flatten(extDialogActions, true));
  dialogActions.add(actions ,{merge: true});
}

export default dialogActions;
