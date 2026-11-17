/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuiarrayfield", "i18n!d2/controls/form/impl/nls/lang", "txt!d2/controls/form/impl/d2singlelayoutarray/d2singlelayoutarray.txt", "txt!d2/controls/form/impl/d2singlelayoutarray/d2singlelayoutarrayitem.txt", "css!d2/controls/form/impl/d2singlelayoutarray/d2singlelayoutarray" ], function(_, $, Backbone, Marionette, Alpaca, AlpacaCsuiArrayField, lang, AlpColumnTemplate, AlpColumnItemTemplate) {
  Alpaca.Fields.D2SingleLayoutArrayField = Alpaca.Fields.CsuiArrayField.extend({
    constructor: function D2SingleLayoutArrayField(container, data, options, schema, view, connector, onError) {
      var toolBarOptions = {
        hideToolbarWithChildren: false,
        toolbarPosition: "bottom",
        toolbarStyle: "link",
        toolbar: {
          showLabels: true,
          actions: [ {
            label: lang.showMore,
            action: "showMore",
            click: function() {
              this._showAllRows();
              this.updateToolbars();
            }
          }, {
            label: lang.showLess,
            action: "showLess",
            click: function() {
              this._showOnlyFirstRow();
              this.updateToolbars();
            }
          }, {
            action: "add",
            enabled: false
          } ]
        }
      };
      _.extend(options, toolBarOptions);
      this.base(container, data, options, schema, view, connector, onError);
    },
    updateToolbars: function() {
      const oReadOnlyFlag = this.schema.readOnly;
      this.schema.readonly = false;
      this.base(arguments);
      this.schema.readOnly = oReadOnlyFlag;
      var self = this;
      var toolbarEl = $(this.getFieldEl()).find(".alpaca-array-toolbar[data-alpaca-array-toolbar-field-id='" + self.getId() + "']");
      if (this.children.length > 1 && !self.options.hideToolbarWithChildren) {
        $(toolbarEl).css({
          display: ""
        });
        $(toolbarEl).removeClass("binf-hidden");
        $(toolbarEl).find("[data-alpaca-array-toolbar-action]").each(function() {
          var actionKey = $(this).attr("data-alpaca-array-toolbar-action");
          var action = self.findAction(self.toolbar.actions, actionKey);
          if (action) {
            $(this).off().on("click", function(e) {
              e.preventDefault();
              action.click.call(self, actionKey, action);
            });
          }
        });
        var showLessLink = toolbarEl.find("[data-alpaca-array-toolbar-action=showLess]");
        var showMoreLink = toolbarEl.find("[data-alpaca-array-toolbar-action=showMore]");
        if (this._getCurrentlyVisisbleRowCount() === this.children.length) {
          showMoreLink.addClass("binf-hidden");
          showLessLink.removeClass("binf-hidden");
        } else if (this._getCurrentlyVisisbleRowCount() < this.children.length) {
          showMoreLink.removeClass("binf-hidden");
          showLessLink.addClass("binf-hidden");
        }
      } else {
        $(toolbarEl).addClass("binf-hidden");
      }
      this.connector.config.formView.options.originatingView.trigger("update:scrollbar");
    },
    removeItem: function(itemIndex, callback) {
      if (!this.options.prevChildData) {
        this.options.prevChildData = !!this.children && this.children.slice();
      }
      this.deletedItemCount = this.deletedItemCount ? this.deletedItemCount + 1 : 1;
      Alpaca.Fields.ArrayField.prototype.removeItem.call(this, itemIndex, _.bind(function() {
        if (this.options.mode === "create") {
          this._raiseValueChanged(this.getValue(), this.name, this.path, this.getValue(), this.name, this.path);
        }
        if (this._getCurrentlyVisisbleRowCount() === 0) {
          this.children[0].containerItemEl.show();
        }
        if (callback) {
          callback();
        }
      }, this));
      this._hideSetActionIcon();
      this.options.isArraySchemaChanged = true;
    },
    postRender: function(callback) {
      this.base(callback);
      this._showOnlyFirstRow();
    },
    getFieldType: function() {
      return "d2singlearray";
    },
    _showOnlyFirstRow: function() {
      _.each(this.children, function(row, index) {
        if (index !== 0) {
          row.containerItemEl.hide();
        }
      });
    },
    _showAllRows: function() {
      _.each(this.children, function(row) {
        row.containerItemEl.show();
      });
    },
    _getCurrentlyVisisbleRowCount: function() {
      var count = 0;
      _.each(this.children, function(row) {
        if (row.containerItemEl.is(":visible")) {
          count++;
        }
      });
      return count;
    }
  });
  Alpaca.registerFieldClass("d2singlearray", Alpaca.Fields.D2SingleLayoutArrayField, "bootstrap-csui");
  Alpaca.registerTemplate("container-d2singlearray", AlpColumnTemplate);
  Alpaca.registerTemplate("container-d2singlearray-item", AlpColumnItemTemplate);
  return $.alpaca.Fields.D2SingleLayoutArrayField;
});