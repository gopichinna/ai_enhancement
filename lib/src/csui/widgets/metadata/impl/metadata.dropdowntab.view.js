/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/controls/tab.panel/tab.panel.view", "csui/widgets/metadata/metadata.panels", "csui/controls/tab.panel/tab.links.dropdown.view", "csui/lib/binf/js/binf" ], function(_, $, Backbone, TabPanelView, metadataPanels, TabLinkDropDownCollectionView) {
  "use strict";
  var MetadataDropdownTabView = TabPanelView.extend({
    className: "metadata-content-wrapper binf-panel binf-panel-default",
    ui: {
      dropdownToggle: ".binf-dropdown-toggle"
    },
    contentView: function() {
      return this.options.contentView;
    },
    contentViewOptions: function() {
      return {
        context: this.options.context,
        model: this.options.node,
        originatingView: this.options.originatingView,
        metadataView: this.options.metadataView,
        blockingParentView: this.options.blockingParentView,
        selectedProperty: this.options.selectedProperty
      };
    },
    constructor: function MetadataDropdownTabView(options) {
      this.isDocReadonlyMode = options?.isDocReadonlyMode;
      this.options = options || (options = {});
      _.defaults(options, {
        TabLinkCollectionViewClass: TabLinkDropDownCollectionView,
        implementTabContentsDefaultKeyboardHandling: false,
        delayTabContent: options.delayTabContent !== false
      });
      options.tabs = this._buildTabs();
      TabPanelView.prototype.constructor.call(this, options);
      this.listenTo(this.options.node, "change", this._nodeChanged).listenTo(Backbone, "closeToggleAction", this._closeToggle);
    },
    _buildTabs: function() {
      return metadataPanels.chain().filter(function(panel) {
        if (this.isDocReadonlyMode) {
          if (!([ "properties", "workflow-properties", "document-type" ].indexOf(panel.attributes.name) > -1)) {
            return false;
          }
        }
        var contentView = panel.get("contentView"), enabled = contentView.enabled;
        if (this.options.node.attributes.customProperties) {
          if (panel.attributes.executeCommand) {
            return !enabled || enabled({
              context: this.options.context,
              node: this.options.node
            });
          } else {
            return false;
          }
        } else {
          return !enabled || enabled({
            context: this.options.context,
            node: this.options.node
          });
        }
      }, this).map(function(panel) {
        return panel.attributes;
      }).value();
    },
    onRender: function() {
      this.$el.prepend("<div class='csui-metadata-tab-bar'></div>");
      this.$el.find(".binf-dropdown-menu").addClass("csui-normal-scrolling");
    },
    onActivateTab: function(tabContent, tabPane, tabLink) {
      tabContent && tabContent.triggerMethod("panel:activated");
    },
    _closeToggle: function() {
      var dropdownToggleEl = this.$el.find(".binf-dropdown-toggle");
      if (dropdownToggleEl.parent().hasClass("binf-open")) {
        if (dropdownToggleEl.length && dropdownToggleEl.length > 1) {
          dropdownToggleEl.each(function(index, dropdownElement) {
            if ($(dropdownElement).parent().hasClass("binf-open")) {
              !$(dropdownElement).is(":hidden") && $(dropdownElement).binf_dropdown("toggle");
            }
          });
        } else {
          !dropdownToggleEl.is(":hidden") && dropdownToggleEl.binf_dropdown("toggle");
        }
      }
    },
    _updateTabs: function() {
      var tabs = this._buildTabs();
      this.collection.reset(this._convertCollection({
        tabs: tabs
      }).models);
    },
    _nodeChanged: function() {
      if (this.options.node.hasChanged("id") || this.options.node.hasChanged("type")) {
        this._updateTabs();
      }
    }
  });
  return MetadataDropdownTabView;
});