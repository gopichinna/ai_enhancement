/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/form/fields/d2checkboxfield.view", "d2/controls/table/cells/field.value.count/field.value.count.view", "d2/utils/mass.update.utils", "css!d2/controls/form/fields/massupdatefields/impl/d2massupdatecheckboxfield" ], function(i18n, $, _, Marionette, D2CheckboxFieldView, FieldValueCountView, MassUpdateUtils) {
  "use strict";
  return D2CheckboxFieldView.extend({
    className: D2CheckboxFieldView.prototype.className + " d2-massupdatecheckboxfield",
    constructor: function D2MassUpdateCheckboxFieldView() {
      D2CheckboxFieldView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "after:visible", this._setCountPosition);
    },
    _setCountPosition: function() {
      var rightStyle, maxLabelWidth = 0, maxCountWidth = 0;
      this.ui.listitems.each(function() {
        maxLabelWidth = Math.max(maxLabelWidth, this.scrollWidth);
      });
      this.$el.find(".count-region").each(function() {
        maxCountWidth = Math.max(maxCountWidth, this.scrollWidth);
      });
      maxCountWidth = maxCountWidth || 24;
      rightStyle = this.$el.find(".dctmw-checkbox-item-container")[0].scrollWidth - maxLabelWidth - maxCountWidth - 16;
      this.$el.find(".count-region").css(i18n.settings.rtl ? "left" : "right", rightStyle);
      if (this.model.get("options").maxObjectThresholdReached) {
        this.$el.find(".dctmw-checkbox-container").each(function() {
          var input = $(this).find("input.checkbox-item"), id = input.attr("value");
          if (MassUpdateUtils.fieldHasMultipleValues(id)) {
            $(this).parent().prependTo(".dctmw-cb-container-parent");
          }
        });
      }
    },
    onRender: function() {
      D2CheckboxFieldView.prototype.onRender.apply(this, arguments);
      if (!this.model.get("options").maxObjectThresholdReached) {
        var me = this;
        this.$el.find(".dctmw-checkbox-container").each(function() {
          var input = $(this).find("input.checkbox-item"), id = input.attr("value"), model = me.collection.findWhere(function(model) {
            var mId = model.get("id") + "";
            return mId === id;
          });
          if (model.get("category") === "multivalue") {
            $(this).parent().addClass("binf-hidden");
          } else {
            var countData;
            if (me.model.get("options").multiFileCountData) {
              countData = me.model.get("options").multiFileCountData[id] || {
                value: id,
                count: 0,
                objectIds: [],
                totalCount: me.model.get("options").massUpdateFileCount
              };
            } else {
              countData = {
                count: input.is(":checked") ? me.model.get("options").massUpdateFileCount : 0,
                objectIds: input.is(":checked") ? _.pluck(me.model.get("options").massUpdateNodes, "r_object_id") : [],
                totalCount: me.model.get("options").massUpdateFileCount
              };
            }
            var countView = new FieldValueCountView({
              model: MassUpdateUtils.getCountDataModel(countData, me.model.get("options"))
            });
            $(this).append('<div class="count-region" style="position: absolute"></div>');
            var countRegion = new Marionette.Region({
              el: $(this).find(".count-region")
            });
            model.countView = countView;
            countRegion.show(countView);
          }
        });
        this.multiFileCountData = this.model.get("options").multiFileCountData;
      }
    },
    onShow: function() {
      D2CheckboxFieldView.prototype.onShow.apply(this, arguments);
      this._setCountPosition();
    },
    onSelectionChange: function(event) {
      if (!this.model.get("options").maxObjectThresholdReached) {
        var id = $(event.target).attr("value"), changeModel = this.collection.findWhere(function(model) {
          var mId = model.get("id") + "";
          return mId === id;
        });
        if (changeModel.get("category") !== "multivalue") {
          var changeCount = $(event.target).is(":checked") ? this.model.get("options").massUpdateFileCount : 0;
          changeModel.countView.model.previousFieldValueCount = _.isUndefined(changeModel.countView.model.previousFieldValueCount) ? changeModel.countView.model.get("d2_field_value_count") : changeModel.countView.model.previousFieldValueCount;
          changeModel.countView.model.set("objectIds", changeCount ? _.pluck(this.model.get("options").massUpdateNodes, "r_object_id") : [], {
            silent: true
          });
          changeModel.countView.model.set("d2_field_value_count", changeCount);
          if (this.multiFileCountData) {
            if (this.multiFileCountData[id]) {
              if (changeModel.countView.model.previousFieldValueCount === 0) {
                delete this.multiFileCountData[id];
              } else {
                this.multiFileCountData[id].count = changeCount;
                this.multiFileCountData[id].objectIds = changeCount ? _.pluck(this.model.get("options").multiFileData, "object-id") : [];
              }
            } else {
              this.multiFileCountData[id] = {
                count: changeCount,
                objectIds: changeCount ? _.pluck(this.model.get("options").multiFileData, "object-id") : [],
                totalCount: this.model.get("options").massUpdateFileCount,
                value: id
              };
            }
            this.updateMultiValueCheckbox();
          }
        }
      }
      D2CheckboxFieldView.prototype.onSelectionChange.apply(this, arguments);
    },
    updateMultiValueCheckbox: function() {
      var me = this, deSelectMultiValue = !_.chain(me.multiFileCountData).filter(function(countData) {
        return countData.hasValue !== false;
      }).pluck("count").find(function(count) {
        return count !== 0 && count !== me.model.get("options").massUpdateFileCount;
      }).value();
      this.$el.find(".dctmw-checkbox-container input.checkbox-item").each(function() {
        var id = $(this).attr("value"), model = me.collection.findWhere(function(model) {
          var mId = model.get("id") + "";
          return mId === id;
        });
        if (model.get("category") === "multivalue" && deSelectMultiValue && $(this).is(":checked")) {
          $(this).trigger("click");
        }
      });
    }
  });
});