/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {Object as MarionetteObject} from 'nuc/lib/marionette';
import ModalAlert from 'd2/sdk/controls/alerts/modal.alert';

/**
 * DialogContentView. Base class for defining handler of dialog content view in a D2SV generic dialog screen. All derived classes should override the
 * `resolveView()` method to return appropriate view content. The `resolveView()` method can be synchronous or asynchronous.
 * The `resolveView()` method must return either instance object of 'Marionette View' (or) Marionette View Class.
 *
 * @see {@link ./dialog.content.views|DialogContentViews}
 *
 * @example <caption>A sample dialog content view implementation(dialog.content.view.a.js) that returns the Marionette View instance for generic dialog asynchronously</caption>
 * import DialogContentView from 'd2/sdk/controls/dialogs/generic/dialog.content.view';
 * import CustomFormView from 'mybundle/generic.dialog/custom.form.view';
 *
 * class DialogContentViewA extends DialogContentView {
 *  constructor(options={}) {
 *    super(options);
 *  }
 *
 *  async resolveView(options = {}) {
 *    let customFormView = new CustomFormView({...options});
 *    return customFormView;
 *  }
 * }
 *
 * @example <caption>A sample dialog content view implementation(dialog.content.view.a.js) that returns the Marionette View instance for generic dialog synchronously</caption>
 * import DialogContentView from 'd2/sdk/controls/dialogs/generic/dialog.content.view';
 * import CustomFormView from 'mybundle/generic.dialog/custom.form.view';
 *
 * class DialogContentViewA extends DialogContentView {
 *  constructor(options={}) {
 *    super(options);
 *  }
 *
 *  resolveView(options = {}) {
 *    let customFormView = new CustomFormView({...options});
 *    return customFormView;
 *  }
 * }
 *
 * @example <caption>To associate this dialog content view with binding rule, an extension(generic.dialog.content.view.js) could be defined as</caption>
 * import DialogContentViewA from 'mybundle/generic.dialog/dialog.content.view.a';
 * import DialogContentViewB from 'mybundle/generic.dialog/dialog.content.view.b';
 *
 * const dialogContentViewRules = [
 *   {equals: {"formName": "FormA"}, viewClass: DialogContentViewA},
 *   {equals: {"formName": "FormB"}, viewClass: DialogContentViewB}
 * ];
 *
 * export default dialogContentViewRules;
 *
 * @example <caption>To finally register the extension, in extensions.json</caption>
 * {
 *  "d2/sdk/controls/dialogs/generic/dialog.content.views": {
 *    "extensions": {
 *      "mybundle": [
 *        "mybundle/extensions/generic.dialog.content.view"
 *      ]
 *    }
 *  }
 * }
 * @module {d2/sdk/controls/dialogs/generic/dialog.content.view} d2/sdk/controls/dialogs/generic/"dialog.content.view"
 * @name DialogContentView
 * @extends {external:Marionette.Object}
 *
 */

/**
 * @external "Marionette.Object"
 * @see https://marionettejs.com/docs/v2.4.7/marionette.object.html
 */

/**
 * @external "Marionette.View"
 * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
 */

class DialogContentView extends MarionetteObject {
  constructor(options={}) {
    super(options);
  }

  async resolveView(options={}) {
    throw new Error(`A suitable dialog content view implementation could not be matched for '${options.formName}'`);
  }

  handleError(e, options={}) {
    console.error(e);
    ModalAlert.showError((e instanceof Error) ? e.message : e, options);
  }
}

Object.defineProperty(DialogContentView.prototype.constructor, 'name', {value: 'DialogContentView'});
export default DialogContentView;