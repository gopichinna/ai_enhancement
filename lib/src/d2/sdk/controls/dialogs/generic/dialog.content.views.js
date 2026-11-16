/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from 'nuc/lib/underscore';
import dialogContentViewResolver from 'd2/dialogs/generic/dialog.content.view.resolver';
import extDialogContentViews from 'dctm-ext!d2/sdk/controls/dialogs/generic/dialog.content.views';

/**
 * Collection of content view for D2SV generic dialogs. Each screen of the D2SV generic dialog offers the content area for the end user to
 * interact with in order to view and enter the data for the dialog. Items from this collection act as handlers for resolving the view
 * in D2SV generic dialog such that views are loosely attached to the generic dialog's view content after evaluating the view's matching conditions.
 *
 * By default, D2SV runtime registers default form content view for dynamic dialog. New dialog content view could
 * be registered by means of extensions.
 *
 * @see {@link ./dialog.content.views|DialogContentView}
 *
 * @example <caption>To register new dialog content view, in extensions.json</caption>
 * {
 *  "d2/sdk/controls/dialogs/generic/dialog.content.views": {
 *    "extensions": {
 *      "mybundle": [
 *        "mybundle/extensions/generic.dialog.content.view"
 *      ]
 *    }
 *  }
 * }
 *
 * @example <caption>whereas generic.dialog.content.view.js could be defined as</caption>
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
 * @module {d2/sdk/controls/dialogs/generic/dialog.content.views} d2/sdk/controls/dialogs/generic/"dialog.content.views"
 * @name DialogContentViews
 * @extends {external:Backbone.Collection}
 */

/**
 * @external "Backbone.Collection"
 * @see https://backbonejs.org/#Collection
 */

if (extDialogContentViews) {
  const views = [].concat(_.flatten(extDialogContentViews, true));
  dialogContentViewResolver.add(views, {merge: true});
}

export default dialogContentViewResolver;
