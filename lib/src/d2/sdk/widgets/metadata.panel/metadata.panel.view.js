/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
/**
 * @license d2sv-sdk 23.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text.
 */
define([
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