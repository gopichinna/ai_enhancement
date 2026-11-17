/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/group.panel/impl/group.content.header.view", "hbs!d2/controls/group.panel/impl/group.content", "css!d2/controls/group.panel/impl/group.content" ], function(_, Marionette, GroupContentHeaderView, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-group-content",
    template: template,
    regions: {
      headerRegion: ".d2-group-content-header-region",
      contentRegion: ".d2-group-content-view-region"
    },
    constructor: function GroupContentView(options) {
      options = options || {};
      if (!options.contentView) {
        throw Error("Content view is required for group");
      }
      this.groupPanelView = options.groupPanelView;
      this.initialExpand = options.initialExpand;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this._setChildViews(options);
      this.listenTo(this.headerView, "d2:group:expand:collapse", this._onGroupExpandCollapse.bind(this));
    },
    _onGroupExpandCollapse: function(isExpanded) {
      this.$el[isExpanded ? "addClass" : "removeClass"]("group-expanded");
      this.groupPanelView.trigger("d2:group:expand:collapse", isExpanded);
    },
    _setChildViews: function(options) {
      this._setHeaderView(options);
      this._setContentView(options);
    },
    _setHeaderView: function(options) {
      this.headerView = new GroupContentHeaderView({
        name: options.name,
        groupContentView: this,
        subtitle: options.subtitle || null,
        indicateRequired: !!options.indicateRequired,
        initialExpand: !!this.initialExpand
      });
    },
    _setContentView: function(options) {
      var contentViewClass = options.contentView;
      this.contentView = new contentViewClass(this._getContentViewOptions(options));
    },
    _getContentViewOptions: function(options) {
      var contentViewOptions = _.isFunction(options.contentViewOptions) ? options.contentViewOptions() : options.contentViewOptions, groupData = _.isFunction(options.groupData) ? options.groupData() : options.groupData ? options.groupData : {};
      return _.extend({}, contentViewOptions, groupData, {
        originatingView: this,
        groupPanelView: this.groupPanelView,
        context: options.context
      });
    },
    onRender: function() {
      this._showChildView();
    },
    _showChildView: function() {
      this._showHeaderView();
      this._showContentView();
    },
    _showHeaderView: function() {
      this.headerRegion.show(this.headerView);
    },
    _showContentView: function() {
      this.contentRegion.show(this.contentView);
      this.initialExpand && this.$el.addClass("group-expanded");
    },
    getContentView: function() {
      return this.contentView;
    }
  });
});