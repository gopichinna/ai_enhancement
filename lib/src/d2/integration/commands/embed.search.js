/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/command", "d2/integration/commands/impl/embed.search.box.view" ], function($, _, Marionette, CommandModel, EmbedSearchView) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-EmbedSearch",
      command_key: "D2-EmbedSearch",
      scope: "single"
    },
    enabled: function(status) {
      return status && status.context && status.context.isFolderBrowser;
    },
    execute: function(status) {
      var me = this, destroyView = function() {
        me.searchView.destroy();
        delete me.searchView;
      };
      me.searchView && !$.contains(document, me.searchView.$el[0]) && destroyView();
      if (!me.searchView) {
        var toolbarEl = status.toolItemView && status.toolItemView._parent && status.toolItemView._parent.$el, container = $("<div>"), region = new Marionette.Region({
          el: container
        }), toolItemView = status.toolItemView;
        me.searchView = new EmbedSearchView({
          context: status.context,
          container: status.container
        });
        me.searchView.on("searchbox:show", function(options) {
          me._searchBoxShown = true;
          me._toggleSearch(false, toolItemView, options);
        });
        me.searchView.on("searchbox:hide", function(options) {
          options = options || {};
          me._searchBoxShown = false;
          me._toggleSearch(true, toolItemView, options);
          if (options.resetSearchView) {
            destroyView();
          }
        });
        me.searchView.listenTo(status.originatingView, "destroy", destroyView);
        me.searchView.listenTo(status.toolItemView, "before:destroy", function() {
          if (me._searchBoxShown === true) {
            me.searchView.clearSearchBox();
            me._searchBoxShown = false;
            destroyView();
          }
        });
        toolbarEl.prepend(container);
        region.show(me.searchView);
      }
      me.searchView.toggleSearchBox();
    },
    _toggleSearch: function(show, toolItemView, options) {
      options = options || {};
      if (!show) {
        toolItemView.model.set("iconName", "csui_action_close32");
      } else {
        toolItemView.model.set("iconName", "csui_action_search32");
      }
      toolItemView._calculateIconName();
      toolItemView.render();
      if (options.ignoreFocus !== true) {
        show && toolItemView.ui.link.trigger("focus");
      }
    }
  });
});