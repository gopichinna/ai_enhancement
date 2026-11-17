/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'dctm-ext!d2/sdk/widgets/task.details.panel/task.details.panel.views'
], function(_, extraTaskDetailsPanelViews) {
  'use strict';

  /**
   * An array of registered task details views. These views will be added to the array of default task details views
   * which are already in smartview like working files, supporting files and task notes.
   *
   * To create a new task details view and get it registered with this array, see -
   * {@link ./task.details.panel.view| TaskDetailsPanelView}
   *
   * @module {d2/sdk/widgets/task.details.panel/task.details.panel.views} d2/sdk/widgets/task.details.panel/task.details.panel.views
   * @name TaskDetailsPanelViews
   * @extends {Array}
   */

  var panelArray = [];

  // extraTaskDetailsPanelViews will be an array of plugins and each plugin entry will be an array of task details views added in that plugin
  extraTaskDetailsPanelViews?.forEach(function (panels) {
    panels?.forEach(function (panel) {
      panelArray.push(panel);
    });
  });

  return panelArray;
});