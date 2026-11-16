/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {Object as MarionetteObject} from 'nuc/lib/marionette';

/**
 * DialogAction. Base class for defining handler of footer buttons in a D2SV generic dialog screen. All derived classes should override the
 * asynchronous `execute()` method to implement appropriate handler logic. In its abstract notion, A dialog action should collect/validate the data
 * state of currently showing screen of D2SV generic dialog and then call 'DialogState' method to trigger transition to a next possible state.
 * A dialog action could be thought of as a 'controller' in an MVC pattern.
 *
 * @see {@link ./dialog.actions|DialogActions}
 *
 * @example <caption>A sample action implementation(goto.search.js) that triggers non-default state transition in generic dialog</caption>
 * import DialogAction from 'd2/sdk/controls/dialogs/generic/dialog.action';
 *
 * class GotoSearch extends DialogAction {
 *  constructor(options={}) {
 *    super(options);
 *  }
 *
 *  async execute(options) {
 *    const {formView, dialogState, dialog} = options;
 *    const formValues = formView.getFlatFormValueMap(formView.getValues());
 *    const {formName, formSchema: {generalConfig}} = await dialogState.applyFormStateMethod({
 *      method: 'SEARCH',
 *      formData: formValues
 *    });
 *
 *    if(generalConfig) {//Go to search step only if the metadata indicates it.
 *      dialog.gotoStep(formName);
 *    }
 *  }
 * }
 *
 * @example <caption>To associate this action with binding rule, an extension(my.dialog.actions.js) could be defined as</caption>
 * import GotoSearch from 'mybundle/dialogs/generic/actions/goto.search';
 *
 * const rules = [
 *  {equals:{"button.id": "search"}, action: GotoSearch}
 * ];
 *
 * export default rules;
 *
 * @example <caption>To finally register the extension, in extensions.json</caption>
 * {
 *  "d2/sdk/controls/dialogs/generic/dialog.actions": {
 *    "extensions": {
 *      "mybundle": [
 *        "mybundle/extensions/my.dialog.actions"
 *      ]
 *    }
 *  }
 * }
 *
 * @module {d2/sdk/controls/dialogs/generic/dialog.action} d2/sdk/controls/dialogs/generic/"dialog.action"
 * @name DialogAction
 * @extends {external:Marionette.Object}
 */

/**
 * @external "Marionette.Object"
 * @see https://marionettejs.com/docs/v2.4.7/marionette.object.html
 */

/**
 * @external "Marionette.View"
 * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
 */

/**
 * @external NodeCollection
 * @see ../../../models/node.collection
 */

/**
 * @class DynamicDialog
 * @classdesc Dynamic dialog UI interface.
 * @extends {external:Marionette.View}
 */

/**
 * @function show
 * @description Shows a generic dialog post construction.
 * @param {string} formName - Show the generic dialog starting from this step
 * @returns {this}
 * @memberOf module:DialogAction~DynamicDialog
 * @instance
 */

/**
 * @function gotoStep
 * @description Triggers transition of the dialog to given step.
 * @param {string} formName - Id of the dialog state to transition into
 * @returns {void}
 * @memberOf module:DialogAction~DynamicDialog
 * @instance
 */

/**
 * @function handleError
 * @description handles error during the dialog operations. DynamicDialog internally uses delegation pattern to handoff the error into a fitting UI representation.
 * @param {Error} e - The error to be handled.
 * @returns {void}
 * @memberOf module:DialogAction~DynamicDialog
 * @instance
 */

/**
 * @function cancel
 * @description Execute cancellation flow on this dialog. Upon successful cancellation the dialog is finally closed & disposed off.
 * @returns {void}
 * @memberOf module:DialogAction~DynamicDialog
 * @instance
 */

/**
 * @function close
 * @description Close the dialog and dispose it off.
 * @returns {void}
 * @memberOf module:DialogAction~DynamicDialog
 * @instance
 */

/**
 * @class DialogState
 * @classdesc State model of the current dialog
 * @extends {external:Marionette.Object}
 */

/**
 * @function gotoForm
 * @description Retrieve metadata of the given form name & update state accordingly.
 * @param {string} formName - Name of the form whose metadata is to be retrieved
 * @returns {Promise} Resolves with form's metadata or rejects with error.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function validateForm
 * @description Apply validation flow on current dialog state & auto-transition to next possible state.
 * @param {*} formData - Key value pairs representing data from currently visible screen.
 * @returns {Promise} Resolves with next possible state's metadata or rejects with error.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function cancelForm
 * @description Apply cancellation flow on current dialog state & auto-transition to next possible state.
 * @param {*} formData - Key value pairs representing data from currently visible screen.
 * @returns {Promise} Resolves with next possible state's metadata or rejects with error.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function applyFormStateMethod
 * @description Apply an arbitrary flow on current dialog state & auto-transition to next possible state.
 * @param {module:DialogAction~StateMethodInput} options - holder of input parameters.
 * @returns {Promise} Resolves with next possible state's metadata or rejects with error.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function getCurrentFormName
 * @description Get form name of the current state of dialog.
 * @returns {string} Returns current form name.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function getRelativeFormPosition
 * @description Given two form names, calculates relative positioning between them and hints whether the second form comes after/before the first one.
 * @param {string} srcForm - Calculate positioning w.r.t this form.
 * @param {string} destForm - Name of the form whose positioning is being calculated.
 * @returns {boolean} Returns `true` if destForm comes after srcForm, returns `false` otherwise.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function nextForm
 * @description Go to the next form state. Works only if the next form was already retrieved earlier as part of an earlier state transition.
 * @returns {Promise} Resolves with next form's metadata, if exists locally otherwise rejects with error.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * @function previousForm
 * @description Go to the previous form state. Works only if the previous form was already retrieved earlier as part of an earlier state transition.
 * @returns {Promise} Resolves with previous form's metadata, if exists locally otherwise rejects with error.
 * @memberOf module:DialogAction~DialogState
 * @instance
 */

/**
 * Holder of input parameters while applying an arbitrary flow on dialog's current state. Any number of arbitrary properties along with the ones
 * documented below could be passed, they are in turn handed off to matching method implementors. See {@link ./dialog.state.method|DialogStateMethod}
 * @typedef {Object} StateMethodInput
 * @property {string} method - Name of the state transition method to apply
 * @property {string} [formName] - Apply state transition method w.r.t this form name. Defaults to form name of the current state.
 */

/**
 * Button properties. Additional attributes apart from the ones documented below might be present.
 * @typedef {Object} ButtonProperties
 * @property {string} id - Unique identifier of the button that was clicked. Scope of uniqueness is limited to current state/visible screen of the dialog only.
 * @property {string} label - Display name of the button clicked.
 */

/**
 * Holder for data relevant to this action's execution
 * @typedef {Object} ActionExecutionData
 * @property {string} formName - Dialog's visible screen's unique name
 * @property {module:DialogAction~ButtonProperties} button - Properties of the the UI button which was clicked.
 * @property {external:Marionette.View} formView - Instance of the view associated with currently visible screen
 * @property {module:DialogAction~DialogState} dialogState - Reference to the state model of the dialog.
 * @property {external:NodeCollection} nodes - Set of objects on which this dialog is operating.
 * @property {module:DialogAction~DynamicDialog} dialog - Reference to the overall dialog UI.
 *
 */

/**
 * @async
 * @function execute
 * @description Implement controlling logic behind this action
 * @param {module:DialogAction~ActionExecutionData} options - holder for various contextual data related to the action's execution
 * @returns {Promise}
 * @instance
 */

class DialogAction extends MarionetteObject {
  constructor(options={}) {
    super(options);
  }

  async execute(options={}) {
    const {button} = options;
    throw new Error(`A suitable implementation could not be matched for '${button.label||button.id}'`);
  }
}

Object.defineProperty(DialogAction.prototype.constructor, 'name', {value: 'DialogAction'});

export default DialogAction;