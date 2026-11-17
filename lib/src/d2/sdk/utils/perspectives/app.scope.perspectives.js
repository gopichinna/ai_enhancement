/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
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
