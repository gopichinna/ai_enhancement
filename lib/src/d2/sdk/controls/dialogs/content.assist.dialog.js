/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
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