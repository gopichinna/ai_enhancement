/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
/**
 * @license d2sv-sdk 23.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text.
 */
define([
  'nuc/lib/marionette'
], function (Marionette) {
  'use strict';

  /**
   * Interface for all custom task details views.
   * This is an extension of Marionette Layout View
   *
   * @example <caption>A new task details view task.helloworld.view.js could be defined as</caption>
   * define([
   *   'd2/sdk/widgets/task.details.panel/task.details.panel.view'
   * ], function (TaskDetailsPanelViews) {
   *   'use strict';
   *
   *   var helloworldViewTemplate = '<script type="text/html">' +
   *       '<h3 style="\n' +
   *       '    padding: 16px;\n' +
   *       '    font-size: 24px;\n' +
   *       '    color: red;\n' +
   *       '">Hello World !</h3>' +
   *       '</script>';
   *
   *   var TaskHelloworldView = TaskDetailsPanelViews.extend({
   *     template: helloworldViewTemplate
   *   }, {
   *     enabled: function () {
   *       // This task details view will be shown or hidden based on whether
   *       //       the enabled function returns true or false
   *       return true;
   *     }
   *   });
   *
   *   return TaskHelloworldView;
   * });
   *
   * @example <caption>Suppose we want to show this task details view for only those task where assignee is dmadmin, we can write a simple equality check for node's type and assignee attributes and using [constants](../../utils/constants) utils from sdk</caption>
   *    enabled: function (options) {
   *        var nodeType = options.node.get('type'),
   *            assignee = options.node && options.node.get('assignee');
   *
   *        if (nodeType === constants.Types.TASK &&
   *            assignee === 'dmadmin') {
   *            return true;
   *        }
   *
   *        return false;
   *    }
   *
   * @example <caption>To register this task details view with task details panel views array, add the entry in extension.json as</caption>
   * {
   *   "d2/sdk/widgets/task.details.panel/task.details.panel.views": {
   *      "extensions": {
   *        "mybundle": [
   *          "mybundle/extensions/task.details.panel.views"
   *        ]
   *      }
   *    }
   * }
   *
   * @example <caption>The task.details.panel.views.js is defined as below. Optionally a sequence value(greater than 1000) can be passed to the task details view entry to specify their order in the tab panel</caption>
   * define([
   *    'mybundle/widgets/task.details/panels/helloworld/task.helloworld.view'
   * ], function(TaskHelloworldView){
   *    'use strict';
   *
   *    // Array of task details views added to the plugin
   *    return [
   *
   *      // Each task details view entry should have a name, title to be shown for the tab
   *      //     and the content view to be shown on the task details panel when this tab is selected
   *
   *      // Incase multiple task details views(tabs) are added in a plugin or multiple plugins with tabs are
   *      //     deployed, then the order of these tabs in tab panel are determined at runtime.
   *      //     If tabs are to be placed in specific sequence in tab panel,
   *      //     then add a numeric value greater than 1000 for sequence attribute(values upto 1000 are used internally).
   *      //     The tabs should appear in ascending order of their sequence in tab panel
   *      {
   *             name: 'helloworld', // The task details tab name, it has to be a unique string
   *             title: 'Hello World',
   *             contentView: TaskHelloworldView,
   *             sequence: 1010 // The sequence value determines the order in which these tabs appear in the tab panel
   *      }
   *
   *      // Additional task details views can also be registered in this array
   *    ];
   * });
   *
   * @module {d2/sdk/widgets/task.details.panel/task.details.panel.view} d2/sdk/widgets/task.details.panel/task.details.panel.view"
   * @name TaskDetailsPanelView
   * @extends {external:Marionette.LayoutView}
   */

  /**
   * @external "Marionette.LayoutView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.layoutview.html
   */

  var TaskDetailsPanelView = Marionette.LayoutView.extend({
    constructor: function TaskDetailsPanelView(options) {
      TaskDetailsPanelView.__super__.constructor.call(this, options);
    }
  }, {
    /**
     * Decides whether to show or hide tab for this task details view based on the return value(true or false).
     * @param {Object} [options] - The options object will have the selected task/workflow and context details.
     * The options.node will have the selected [task/workflow](../../models/node.model) reference
     * and it contains information about task/workflow attributes like id, name etc.
     * Conditions can be added based on these attributes
     * to return true/false (show/hide the tab for the selected task/workflow).
     * @returns {boolean}
     * @memberOf module:TaskDetailsPanelView
     */
    enabled: function () {
      return true;
    }
  });

  /**
   * @name options
   * @type {Object}
   * @description Holder of parameters passed during task details view construction.
   * @instance
   */

  /**
   * @name model
   * @type {NodeModel}
   * @description Selected task/workflow reference. It holds information like task/workflow id, name, type etc.
   * @see {@link ../../models/node.model|NodeModel}
   * @instance
   */

  return TaskDetailsPanelView;
});