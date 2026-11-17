/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from 'nuc/lib/underscore';
import dialogStateMethods from 'd2/dialogs/generic/dialog.state.methods';
import extMethods from 'dctm-ext!d2/sdk/controls/dialogs/generic/dialog.state.methods';

/**
 * In D2SV, a Generic Dialog consists of an arbitrary number of UI screens. A "Dialog State" represents the metadata associated with each of such screens.
 * A dialog state "Method" dynamically defines a transition path between two screens in a loosely coupled
 * manner, by being able to generate metadata for the next possible state, from a given dialog state. In other words, a "Method" could be applied on
 * the current state of a dialog to generate metadata for the next state.
 *
 * DialogStateMethods holds all the registered state method implementations. New "Method" implementations could be registered with this collection
 * by means of extension, such that each extension associates a method implementation with a set of qualifying conditions to limit the scope
 * of applying that particular method implementation.
 *
 * When a "Method" is being applied on a dialog state, the "Method name" along with several other current state related parameters are used
 * to find matches against all the qualifying conditions across all registered method implementations. Method implementations, found after this lookup, are
 * executed in order to derive the next state of the dialog.
 *
 * By default, D2SV defines three method names "GET", "VALIDATE" and "CANCEL" to align itself with `getDialog()`, `validDialog()` & `cancelDialog()`
 * state transitions supported by D2FS Dialog Service. However, based on how dialog state transition is requested, registered state method implementations
 * could react to any other method name to respond with a possible next state data.
 *
 * See also {@link ./dialog.state.method|DialogStateMethod}
 *
 * @example <caption>To register a new method implementation, in extension.json</caption>
 *
 * {
 *  "d2/sdk/controls/dialogs/generic/dialog.state.methods": {
 *   "extensions": {
 *     "mybundle": [
 *       "mybundle/extensions/my.state.methods"
 *     ]
 *   }
 *  }
 * }
 *
 * @example <caption>Whereas my.state.methods.js could be defined as</caption>
 * import AStateMethod from 'mybundle/dialogs/states/state.method.a';
 * import BStateMethod from 'mybundle/dialogs/states/state.method.b';
 * import CStateMethod from 'mybundle/dialogs/states/state.method.c';
 * // N number of state methods could by bound by a single extension.
 * // AStateMethod, BStateMethod, CStateMethod all are subclasses of DialogStateMethod i.e. d2/sdk/controls/dialogs/generic/dialog.state.method module.
 *
 * export default [
 *  {equals:{method: 'GET'}, sequence: 100, methodClass: AStateMethod}, //Method will be applied only for 'GET'
 *  {includes:{method: ['GET', 'VALIDATE', 'CANCEL']}, sequence: 101, methodClass: BStateMethod}, //Method will be applied for all of 'GET', 'VALIDATE', 'CANCEL'. however for 'GET' case it will be executed after AStateMethod
 *  {equals:{method: 'SOME_NAME'}, sequence: 100, methodClass: CStateMethod} //Method will be applied only for non-default method name 'SOME_NAME'
 * ];
 *
 * @module {d2/sdk/controls/dialogs/generic/dialog.state.methods} d2/sdk/controls/dialogs/generic/"dialog.state.methods"
 * @name DialogStateMethods
 * @extends {external:Backbone.Collection}
 */

/**
 * @external "Backbone.Collection"
 * @see https://backbonejs.org/#Collection
 */

if(extMethods) {
  let methods = [].concat(_.flatten(extMethods, true));
  dialogStateMethods.add(methods, {merge:false});
}

export default dialogStateMethods;