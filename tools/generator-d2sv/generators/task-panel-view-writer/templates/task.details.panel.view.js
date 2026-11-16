  /**
   *
   * This is a simple hello world view.
   *
   * The base template for this view and wrapper class names are specified.
   *
   * The hashes for ui, regions, events are defined.
   *
   * Event handlers for mouseenter and mouseleave are defined to change css style color for ui element.
   *
   * By default, this view will be visible in task and workflow tab panel. Add conditions to restrict this view based on the usecase.
   *
   * Modify this boilerplate view code based on the usecase.
   *
   * When user selects this view from tab panel, the onShow function is executed and view is shown.
   *
   * The lang file is used for defining translation strings and css file for view styling.
   * 
   **/
   
define([
  'nuc/lib/marionette',
  'd2/sdk/widgets/task.details.panel/task.details.panel.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'hbs!<%= namespace %>/widgets/task.details/panels/<%= viewName.toLowerCase() %>/impl/<%= viewPanelName %>',
  'i18n!<%= namespace %>/widgets/task.details/panels/<%= viewName.toLowerCase() %>/impl/nls/lang',
  'css!<%= namespace %>/widgets/task.details/panels/<%= viewName.toLowerCase() %>/impl/<%= viewPanelName %>'
], function (Marionette, TaskDetailsPanelView, PerfectScrollingBehavior, template, lang) {
  'use strict';

  var Task<%= viewName %>View = TaskDetailsPanelView.extend({
	template: template,
    className: 'd2-task-<%= viewName.toLowerCase() %>-wrapper',

    ui: {
      helloworldElement: '.helloworld'
    },

    regions: {
      helloworldRegion: '@ui.helloworldElement'
    },

    events: {
      'mouseenter @ui.helloworldElement': '_onMouseEnterHelloworldElement',
      'mouseleave @ui.helloworldElement': '_onMouseLeaveHelloworldElement'
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.d2-task-<%= viewName.toLowerCase() %>',
      }
    },

    constructor: function Task<%= viewName %>View(options) {
      Task<%= viewName %>View.__super__.constructor.call(this, options);
    },

    onShow: function () {
      this._showViews();
    },

    _showViews: function () {
      this._showHelloworldView();
    },

    _showHelloworldView: function () {
      var helloworldViewTemplate = this._getHelloworldViewTemplate()

      var helloworldView = Marionette.ItemView.extend({
        template: helloworldViewTemplate,
        className: 'helloworld-div'
      });

      this.helloworldRegion.show(new helloworldView());
    },

    _getHelloworldViewTemplate: function () {
      var text = '<script type="text/html">' +
        '<h3><b>' + lang.viewHeader + '</b></h3><br>' +
        '<ul>' +
        '<li>' + lang.viewBodyLine1 + '</li>' +
        '<li>' + lang.viewBodyLine2 + '</li>' +
        '<li>' + lang.viewBodyLine3 + '</li>' +
        '<li>' + lang.viewBodyLine4 + '</li>' +
        '<li>' + lang.viewBodyLine5 + '</li>' +
        '<li>' + lang.viewBodyLine6 + '</li>' +
        '<li>' + lang.viewBodyLine7 + '</li>' +
        '<li>' + lang.viewBodyLine8 + '</li>' +
        '</ul>'
      '</script>';
      return text;
    },	

    _onMouseEnterHelloworldElement: function () {
      this.ui.helloworldElement.css("color", "blue");
    },

    _onMouseLeaveHelloworldElement: function () {
      this.ui.helloworldElement.css("color", "red");
    }
  }, {
    enabled: function () {
      return true;
    }
  });

  return Task<%= viewName %>View;
});
