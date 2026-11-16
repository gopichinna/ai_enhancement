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
   * By default, this view will be visible for all metadata dropdowns. Add conditions in enabled function to restrict this view based on the usecase.
   *
   * Modify this boilerplate view code based on the usecase.
   *
   * In case of complex views, it is better to break it into smaller independent views and keeping them under impl folder.
   *
   * When user selects the view from metadata dropdown, the onShow function is executed and view is shown.
   *
   * The lang file is used for defining translation strings and css file for view styling.
   * 
   **/
   
define([
  'nuc/lib/marionette',
  'd2/sdk/widgets/metadata.panel/metadata.panel.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'hbs!<%= namespace %>/widgets/metadata/panels/<%= viewName.toLowerCase() %>/impl/<%= viewPanelName %>',
  'i18n!<%= namespace %>/widgets/metadata/panels/<%= viewName.toLowerCase() %>/impl/nls/lang',
  'css!<%= namespace %>/widgets/metadata/panels/<%= viewName.toLowerCase() %>/impl/<%= viewPanelName %>'
], function (Marionette, MetadataPanelView, PerfectScrollingBehavior, template, lang) {
  'use strict';

  var Metadata<%= viewName %>View = MetadataPanelView.extend({
	template: template,
    className: 'd2-metadata-<%= viewName.toLowerCase() %>-wrapper',

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
        contentParent: '.d2-metadata-<%= viewName.toLowerCase() %>',
      }
    },

    constructor: function Metadata<%= viewName %>View(options) {
      Metadata<%= viewName %>View.__super__.constructor.call(this, options);
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
        '<li>' + lang.viewBodyLine9 + '</li>' +
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

  return Metadata<%= viewName %>View;
});
