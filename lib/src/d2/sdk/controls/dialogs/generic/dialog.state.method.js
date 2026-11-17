/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {Object as MarionetteObject} from 'nuc/lib/marionette';

/**
 * DialogStateMethod. Base class for implementing D2SV generic dialog state transition logic. All derived classes should override the
 * asynchronous `execute()` method to actually implement the transition logic.
 *
 * Also see {@link ./dialog.state.methods|DialogStateMethods}
 *
 * @example <caption>A sample method implementation module that constructs state metadata by literal definition for a certain given state name</caption>
 * import StateMethod from 'd2/sdk/controls/dialogs/generic/dialog.state.method';
 *
 * class LiteralGetMethod extends StateMethod {
 *  async execute(options, result) {
 *    if(options.formName === 'MyFormName') {
 *      result['page-content'] = {
 *        dialog: {
 *          id: 'user_dialog',
 *          label: 'Name Form',
 *          content: {
 *            text: {
 *              order: 1,
 *              control: true,
 *              id: 'full_name',
 *              label: 'Full name',
 *              value: 'John Doe'
 *            }
 *          },
 *          buttons: {
 *            button: [
 *              {id: 'buttonOk', action: 'validDialog()', label: 'OK', order: 1}
 *            ]
 *          }
 *        }
 *      };
 *      return false; //So that no other succeeding state method applies
 *    }
 *    return true;
 *  }
 * }
 *
 * export default LiteralGetMethod;
 *
 * @module {d2/sdk/controls/dialogs/generic/dialog.state.method} d2/sdk/controls/dialogs/generic/"dialog.state.method"
 * @name DialogStateMethod
 * @extends {external:Marionette.Object}
 */

/**
 * @external "Marionette.Object"
 * @see https://marionettejs.com/docs/v2.4.7/marionette.object.html
 */

/**
 * @external NodeCollection
 * @see ../../../models/node.collection
 */

/**
 * Metadata related to current state of the dialog
 * @typedef {Object} MethodMetadata
 * @property {string} method - Name of the transition method which is getting applied
 * @property {string} formName - Form name of the current dialog state.
 * @property {external:NodeCollection} nodes - The object selection set on which this method is being applied.
 * @property {Object} actionParams - If the dialog was invoked through a menu, all the parameters associated with the menu are collection in this part of options.
 * @property {Object} [formData] -  Data collected from currently visible screen of the dialog.
 */

/**
 * Type of form data to be populated by the state method. The overall structure should match response structure returned by D2-REST 'property-page' endpoint.
 * @typedef {Object} OutputFormData
 * @property {Object} "page-content" - wrapper for the form data
 * @property {DialogMetadata} ["page-content".dialog] - Actual form data
 */

/**
 * Metadata for a single screen in a dialog.
 * @typedef {Object} DialogMetadata
 * @property {string} id - unique identifier of the form
 * @property {string} label - Displayable title of the form
 * @property {ButtonWrapper} [buttons] - Interaction buttons for the form
 * @property {*} [content] - Structure of the form.
 */

/**
 * Wrapper for buttons
 * @typedef {Object} ButtonWrapper
 * @property {ButtonMetadata[]} button - collection of buttons
 */

/**
 * Metadata definition of a button
 * @typedef {Object} ButtonMetadata
 * @property {string} id - Unique identifier of the button
 * @property {string} label - Display text for the button
 * @property {number} order - Sequential position of the button.
 * @property {string} action - The action this button represents
 * @property {boolean} [isPrimary] - Whether to visually indicate this button as primary button for the current form.
 */

/**
 * @async
 * @function execute
 * @description Implement state transition logic for D2SV generic dialog
 * @param {MethodMetadata} options - holder for various current state related metadata
 * @param {OutputFormData} result - Output parameter, should be filled in with metadata pertaining to next possible state of the dialog.
 * @returns {Promise<boolean>} Resolve with `false` to stop executing any other matching state methods that are supposed to execute after it.
 * @instance
 */

class DialogStateMethod extends MarionetteObject {
  constructor(options={}) {
    super(options);
  }

  async execute(/*options, result*/) {
    return true;
  }
}

Object.defineProperty(DialogStateMethod.prototype.constructor, 'name', {value: 'DialogStateMethod'});

export default DialogStateMethod;