/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'dctm-ext!d2/sdk/widgets/metadata.panel/metadata.panel.views'
], function (_, extPanelViews) {
  'use strict';

  /**
   * An array of registered metadata views. These views will be added to the array of default metadata views which are already in smartview like properties, permissions, task performers.
   *
   * To create a new metadata view and get it registered with this array, see -
   * {@link ./metadata.panel.view| MetadataPanelView}
   *
   * @module {d2/sdk/widgets/metadata.panel/metadata.panel.views} d2/sdk/widgets/metadata.panel/metadata.panel.views
   * @name MetadataPanelViews
   * @extends {Array}
   */

  var panelArray = [];

  // extPanelViews will be an array of plugins and each plugin entry will be an array of metadata views added in that plugin
  extPanelViews?.forEach(function (panels) {
    panels?.forEach(function (panel) {
      panelArray.push(panel);
    });
  });

  return panelArray;
});