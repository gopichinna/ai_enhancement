/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/base", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/dialogs/mass.update/mass.update.flyout/mass.update.flyout.view", "d2/utils/constants", "dctmw/utils/authenticators/session", "hbs!d2/controls/table/cells/field.value.count/impl/field.value.count", "i18n!d2/controls/table/cells/field.value.count/impl/nls/lang", "css!d2/controls/table/cells/field.value.count/impl/field.value.count" ], function(i18n, $, _, base, TemplatedCellView, cellViewRegistry, MassUpdateFlyoutView, constants, Session, template, lang) {
  "use strict";
  var MAX_FLYOUT_OBJECTS = 50;
  var FieldValueCount = TemplatedCellView.extend({
    template: template,
    ui: {
      valueCount: ".d2-field-value-count"
    },
    modelEvents: {
      "change:d2_field_value_count": "render"
    },
    events: {
      "focus @ui.valueCount": "onFocusCount"
    },
    constructor: function FieldValueCount() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.options.context = this.options.context || Session.get().getContext();
      this.options.tableView && this.$el.addClass("center-align");
      this.listenTo(this, "hide-popover", this.hidePopover);
    },
    onKeyupCount: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickCount(event);
        break;

       case 27:
        if (this.preventEscape) {
          event.stopPropagation();
          event.preventDefault();
          this.preventEscape = false;
        }
        break;
      }
    },
    onClickCount: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (!this.model.get("objectIds") || !this.model.get("objectIds").length) {
        return;
      }
      if (this.flyout && !this.preventToggle) {
        if (!this.ui.valueCount.data("binf.popover") || !this.ui.valueCount.data("binf.popover").options.content) {
          this.ui.valueCount.binf_popover("destroy");
          this.ui.valueCount.binf_popover(this.popoverOptions);
        }
        this.ui.valueCount.binf_popover("toggle");
        this.ui.valueCount.data("binf.popover").tip().hasClass("binf-in") && this.flyout.setFocus();
      } else if (!this.preventToggle) {
        this.showPopover(event);
      }
    },
    showPopover: function() {
      if (!this.flyout) {
        var nodes = _.filter(this.model.get("massUpdateNodes"), function(massUpdateNode) {
          return _.contains(this.model.get("objectIds"), massUpdateNode.r_object_id);
        }.bind(this)), showVersion = _.find(nodes, function(node) {
          return node.showVersionLabel;
        });
        this.flyout = new MassUpdateFlyoutView({
          nodes: nodes,
          updateInfo: this._getFlyoutTitleAndFooter().title,
          originatingView: this,
          maxItems: MAX_FLYOUT_OBJECTS,
          maxBannerTitle: this._getFlyoutTitleAndFooter().footer,
          context: this.options.context
        });
        this.flyout.render();
        this.popoverOptions = {
          content: this.flyout.$el,
          html: true,
          container: $.fn.binf_modal.getDefaultContainer(),
          template: '<div class="binf-popover d2-mass-update-info-flyout' + (showVersion ? " show-version" : "") + '" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: this._getPopoverPlacement(),
          trigger: "manual"
        };
        this.ui.valueCount.binf_popover(this.popoverOptions);
        this.ui.valueCount.binf_popover("show");
        this.flyout.setFocus();
        this.flyout.trigger("ensure:scrollbar");
      } else {
        if (!this.ui.valueCount.data("binf.popover") || !this.ui.valueCount.data("binf.popover").options.content) {
          this.ui.valueCount.binf_popover("destroy");
          this.ui.valueCount.binf_popover(this.popoverOptions);
        }
        this.ui.valueCount.binf_popover("toggle");
        this.ui.valueCount.data("binf.popover").tip().hasClass("binf-in") && this.flyout.setFocus();
      }
    },
    hidePopover: function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.type !== "focusout" && this.ui.valueCount.data("binf.popover") && this.ui.valueCount.data("binf.popover").tip().hasClass("binf-in") && (this.options.tableView ? this.$el.trigger("focus") : this.ui.valueCount.trigger("focus"));
      this.ui.valueCount.binf_popover("hide");
      event.type === "keydown" && (this.preventEscape = true);
      this.ui.valueCount.attr("title", this.ui.valueCount.attr("data-binf-original-title") || this.ui.valueCount.attr("title")).attr("data-binf-original-title", "");
    },
    _getFlyoutTitleAndFooter: function() {
      var langPrefix = this.model.get("massUpdateDocumentType") === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : this.model.get("massUpdateDocumentType") === constants.MassUpdateOptions.FILE_PROPERTIES ? "File" : "Item", itemCount = this.model.get("objectIds").length, itemOverflow = itemCount > MAX_FLYOUT_OBJECTS, noValue = this.model.get("has_value") === false, singleItem = itemCount === 1, updatedValue = !_.isUndefined(this.model.previousFieldValueCount) && this.model.previousFieldValueCount !== this.model.get("d2_field_value_count"), title = itemOverflow ? updatedValue ? lang["flyoutTitleOverflow" + langPrefix + "sWill"] : noValue ? lang["flyoutTitleOverflow" + langPrefix + "sNoValue"] : lang["flyoutTitleOverflow" + langPrefix + "s"] : singleItem ? updatedValue ? lang["flyoutTitleOne" + langPrefix + "Will"] : noValue ? lang["flyoutTitleOne" + langPrefix + "NoValue"] : lang["flyoutTitleOne" + langPrefix] : _.str.sformat(updatedValue ? lang["flyoutTitleSome" + langPrefix + "sWill"] : noValue ? lang["flyoutTitleSome" + langPrefix + "sNoValue"] : lang["flyoutTitleSome" + langPrefix + "s"], itemCount), footer = _.str.sformat(lang["maxBanner" + langPrefix + "s"], MAX_FLYOUT_OBJECTS, itemCount);
      return {
        title: title,
        footer: footer
      };
    },
    _getPopoverPlacement: function() {
      var offset = this.ui.valueCount.offset(), countWidth = this.ui.valueCount.outerWidth(), calc_width = $(window).width() - (offset.left + countWidth);
      return i18n.settings.rtl ? offset.left > 260 ? "left" : "right" : calc_width > 260 ? "right" : "left";
    },
    onFocusCount: function(event) {
      base.checkAndScrollElemToViewport(event.currentTarget);
    },
    renderValue: function() {
      TemplatedCellView.prototype.renderValue.call(this, arguments);
      var eventName = "keyup." + this.cid;
      this.$el.off(eventName).on(eventName, function(event) {
        this.onKeyupCount(event);
      }.bind(this));
    },
    _attachClickHandler: function() {
      var self = this;
      this.ui.valueCount && this.ui.valueCount.off("click." + this.cid).on("click." + this.cid, function(event) {
        self.onClickCount(event);
      });
    },
    getValueData: function() {
      this.ui.valueCount.data && this.ui.valueCount.data("binf.popover") && this.ui.valueCount.binf_popover("destroy");
      this.flyout && this.flyout.destroy();
      delete this.flyout;
      var count, className = false, tooltip = "", langPrefix = this.model.get("massUpdateDocumentType") === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : this.model.get("massUpdateDocumentType") === constants.MassUpdateOptions.FILE_PROPERTIES ? "File" : "Item";
      if (this.model.get("d2_field_value_count") === this.model.get("total_count")) {
        count = lang.allCount;
        className = "invert";
        tooltip = !_.isUndefined(this.model.previousFieldValueCount) && this.model.previousFieldValueCount !== this.model.get("d2_field_value_count") ? lang["valueSetToAll" + langPrefix + "s"] : lang["valueAll" + langPrefix + "s"];
      } else if (this.model.get("d2_field_value_count") === 0) {
        if (_.isUndefined(this.model.previousFieldValueCount)) {
          count = false;
        } else {
          count = this.model.previousFieldValueCount === 0 ? false : "-";
          tooltip = _.str.sformat(this.model.previousFieldValueCount > 1 ? lang["valueRemoveFromSome" + langPrefix + "s"] : lang["valueRemoveFromOne" + langPrefix], this.model.previousFieldValueCount, this.model.get("total_count"));
          className = this.model.previousFieldValueCount === 0 ? "invert" : "invert no-count";
        }
      } else {
        count = this.model.get("d2_field_value_count");
        var str = this.model.get("has_value") === false ? count > 1 ? lang["noValueSome" + langPrefix + "s"] : lang["noValueOne" + langPrefix] : count > 1 ? lang["valueSome" + langPrefix + "s"] : lang["valueOne" + langPrefix];
        tooltip = _.str.sformat(str, count, this.model.get("total_count"));
      }
      return {
        count: !this.model.hideCount && count,
        className: className,
        tooltip: tooltip,
        addTabIndex: !this.options.tableView
      };
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "d2-table-cell-value-count"
  });
  cellViewRegistry.registerByColumnKey("d2_field_value_count", FieldValueCount);
  return FieldValueCount;
});