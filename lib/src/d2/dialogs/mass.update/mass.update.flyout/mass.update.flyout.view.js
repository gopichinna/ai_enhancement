/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "dctmw/server.adaptors/converters/node", "d2/utils/constants", "hbs!d2/dialogs/mass.update/mass.update.flyout/impl/mass.update.flyout", "hbs!d2/dialogs/mass.update/mass.update.flyout/impl/mass.update.flyout.item", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.flyout/impl/mass.update.flyout" ], function($, _, Backbone, Marionette, NodeTypeIconView, PerfectScrollingBehavior, nodeConverter, constants, template, itemTemplate, lang) {
  "use strict";
  var INCLUDE_OPTION_TO_STRING_MAP = {};
  INCLUDE_OPTION_TO_STRING_MAP[constants.MassUpdateOptions.ALL_VERSIONS] = lang.includeAllVersions;
  INCLUDE_OPTION_TO_STRING_MAP[constants.MassUpdateOptions.FILES_IN_SUB_FOLDERS] = lang.includeFilesInSubFolders;
  INCLUDE_OPTION_TO_STRING_MAP[constants.MassUpdateOptions.VIRTUAL_DOCUMENTS] = lang.includeVirtualDocuments;
  INCLUDE_OPTION_TO_STRING_MAP[constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS] = lang.includeVirtualDocumentsDescendants;
  INCLUDE_OPTION_TO_STRING_MAP[constants.MassUpdateOptions.SUB_FOLDERS] = lang.includeSubFolders;
  var stopEvent = function(event) {
    event.stopPropagation();
    event.preventDefault();
  };
  var MassUpdateFlyoutItem = Marionette.ItemView.extend({
    className: "d2-mass-update-flyout-item",
    template: itemTemplate,
    templateHelpers: function() {
      return {
        name: this.model.get("name"),
        showVersionLabel: this.model.get("showVersionLabel"),
        versionLabel: this.model.get("r_version_label")
      };
    },
    onRender: function() {
      if (this.model.get("id")) {
        this._nodeIconView = new NodeTypeIconView({
          el: this.$(".flyout-item-icon").get(0),
          node: this.model
        });
        this._nodeIconView.render();
      }
    },
    constructor: function() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return Marionette.CompositeView.extend({
    className: "d2-mass-update-flyout",
    childViewContainer: ".d2-mass-update-flyout-list",
    childView: MassUpdateFlyoutItem,
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "> .d2-mass-update-flyout-list",
        suppressScrollX: true
      }
    },
    ui: {
      updateInfo: ".d2-mass-update-info",
      flyoutList: ".d2-mass-update-flyout-list"
    },
    events: {
      keydown: "onKeyDown",
      focusout: "onFocusOut"
    },
    templateHelpers: function() {
      return {
        updateInfo: this.options.massUpdateOptions ? lang["update" + this.options.langPrefix + "Properties"] : this.options.updateInfo,
        showMaxBanner: this.options.showMaxBanner,
        maxBannerMessage: this.options.maxItems ? _.str.sformat(this.options.maxBannerTitle || lang.defaultFlyoutMaxBannerTitle, this.options.maxItems, this.options.totalItems) : ""
      };
    },
    constructor: function MassUpdateFlyoutView(options) {
      options = options || {};
      options.collection = new Backbone.Collection(this._getModels(options));
      if (options.maxItems && options.collection.length > options.maxItems) {
        options.totalItems = options.collection.length;
        options.collection.models = _.first(options.collection.models, options.maxItems);
        options.collection.length = options.collection.models.length;
        options.showMaxBanner = true;
      }
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      options.nodes && this.$el.addClass("flyout-for-items");
      options.showMaxBanner && this.$el.addClass("max-items-shown");
      $("*").on("scroll", this.onMouseLeave.bind(this));
    },
    _getModels: function(options) {
      var models = [];
      if (options.massUpdateOptions) {
        models = _.map(options.massUpdateOptions["include-options"], function(includeOption) {
          return {
            name: INCLUDE_OPTION_TO_STRING_MAP[includeOption]
          };
        });
      } else if (options.nodes) {
        _.each(options.nodes, function(node) {
          models.push(nodeConverter.convertNode(_.clone(node)));
        });
      } else if (options.items) {
        models = _.map(options.items, function(item) {
          return {
            name: item
          };
        });
      }
      return models;
    },
    setFocus: function() {
      if (this.collection.length) {
        this.selectedIndex = 1;
        this.$el.find(".d2-mass-update-flyout-item:first-child .flyout-item").trigger("focus");
      } else {
        this.ui.updateInfo.trigger("focus");
      }
    },
    onMouseLeave: function(event) {
      !$(event.target).hasClass("flyout-item") && this.options.originatingView && this.options.originatingView.trigger("hide-popover", event);
    },
    onKeyDown: function(event) {
      var listFocused = this.ui.flyoutList.has(event.target).length;
      switch (event.which) {
       case 9:
        if (this.ui.updateInfo[0] === event.target) {
          !event.shiftKey && this.setFocusOnListItem(this.selectedIndex);
        } else if (this.$el.find(".max-banner-message")[0] === event.target) {
          event.shiftKey && this.setFocusOnListItem(this.selectedIndex);
        } else {
          event.shiftKey ? this.ui.updateInfo.trigger("focus") : this.$el.find(".max-banner-message").trigger("focus");
        }
        stopEvent(event);
        break;

       case 33:
       case 36:
        if (this.collection.length && listFocused) {
          this.selectedIndex = 1;
          this.setFocusOnListItem(this.selectedIndex);
        }
        stopEvent(event);
        break;

       case 34:
       case 35:
        if (this.collection.length && listFocused) {
          this.selectedIndex = this.collection.length;
          this.setFocusOnListItem(this.selectedIndex);
        }
        stopEvent(event);
        break;

       case 38:
        if (this.collection.length && this.selectedIndex > 1 && listFocused) {
          this.setFocusOnListItem(--this.selectedIndex);
        }
        stopEvent(event);
        break;

       case 40:
        if (this.collection.length && this.selectedIndex !== this.collection.length && listFocused) {
          this.setFocusOnListItem(++this.selectedIndex);
        }
        stopEvent(event);
        break;

       case 37:
        if (this.collection.length && listFocused) {
          this.$el.find(".d2-mass-update-flyout-item:nth-child(" + this.selectedIndex + ") .flyout-item-version .version-label").is(event.target) && this.setFocusOnListItem(this.selectedIndex);
        }
        stopEvent(event);
        break;

       case 39:
        if (this.collection.length && listFocused) {
          this.$el.find(".d2-mass-update-flyout-item:nth-child(" + this.selectedIndex + ") .flyout-item").is(event.target) && this.$el.find(".d2-mass-update-flyout-item:nth-child(" + this.selectedIndex + ") .flyout-item-version .version-label").trigger("focus");
        }
        stopEvent(event);
        break;

       case 27:
        this.options.originatingView && this.options.originatingView.trigger("hide-popover", event);
        break;
      }
    },
    setFocusOnListItem: function(index) {
      index && this.$el.find(".d2-mass-update-flyout-item:nth-child(" + index + ") .flyout-item").trigger("focus");
    },
    onFocusOut: function(event) {
      setTimeout(function() {
        if (this.$el.has(document.activeElement).length === 0) {
          if (this.options.originatingView) {
            this.options.originatingView.trigger("hide-popover", event);
            this.options.originatingView.preventToggle = true;
            setTimeout(function() {
              this.options.originatingView.preventToggle = false;
            }.bind(this), 301);
          }
        }
      }.bind(this));
    },
    onRender: function() {
      !this.collection.length && this.ui.flyoutList.addClass("binf-hidden");
    }
  });
});