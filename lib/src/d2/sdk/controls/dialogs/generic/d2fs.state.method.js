/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import D2FSStateMethodImpl from 'd2/dialogs/generic/impl/state.methods/d2fs.state.method';

/**
 * D2FSStateMethod. A default, contextful implementation of state methods that makes it possible to retrieve and transition through
 * different states of D2FS dialogs. To customize the default implementation with lesser amount of coding, this class can
 * be extended into scenario specific subclass and added to state methods collection by means of extension with proper binding rules.
 *
 * Also see {@link ./dialog.state.methods|DialogStateMethods}
 *
 * @module {d2/sdk/controls/dialogs/generic/d2fs.state.method} d2/sdk/controls/dialogs/generic/"d2fs.state.method"
 * @name D2FSStateMethod
 * @extends {external:DialogStateMethod}
 */

/**
 * @external "DialogStateMethod"
 * @see {@link ./dialog.state.method}
 */

/**
 * @async
 * @function execute
 * @description Implements contextful state transition logic for D2FS dialog.
 * @param {MethodMetadata} options - holder for various current state related metadata
 * @param {OutputFormData} result - Output parameter, should be filled in with metadata pertaining to next possible state of the dialog.
 * @returns {Promise<boolean>} Resolve with `false` to stop executing any other matching state methods that are supposed to execute after it.
 * @instance
 */

/**
 * @function setDialogContextForm
 * @description Set the context before applying this method to current state of the dialog.
 * @param {string} dialogId - A unique identifier associated with current dialog.
 * @param {string} action - Name of the method getting applied
 * @param {string} currentFormName - Present state's metadata name for the dialog.
 * @returns {void}
 * @instance
 */

/**
 * @function getDialogContextForm
 * @description Get context before applying this method to current state of the dialog.
 * @param {string} dialogId - A unique identifier associated with current dialog.
 * @param {string} action - Name of the method about to be applied.
 * @returns {string|null} Should return contextual state name, however can return `null` to implement a contextless flow.
 * @instance
 */

/**
 * @function clearDialogContextForm
 * @description Clears context for given dialog when the dialog has reached a terminal state.
 * @param {string} dialogId - A unique identifier associated with current dialog.
 * @returns {void}
 * @instance
 */

/**
 * @function getDialogAdditonalParams
 * @description Prepares the set of attributes (key-value pairs) to be sent to Backend(REST-API) as additional attributes
 * @param {MethodMetadata} options - holder for various current state related metadata. It is the same `options` parameter passed to `execute()`.
 * @returns {object} Should return a simple JSON object having key-value pairs. All the members of this object is serialized as additional parameter before they are sent to Backend.
 * @instance
 */

/**
 * @function extractMergeableFormDataFromResponse
 * @description Extracts flow-back properties from the `success` response of a Backend(REST-API) method execution such that those properties are saved as part of the input form data.
 * @param {object} success - JSON converted success response received after Backend invocation.
 * @returns {object} Should return a simple JSON object having key-value pairs. The members of the object is merged onto the same input form data that was earlier passed to Backend.
 * @instance
 */

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

export default D2FSStateMethod;