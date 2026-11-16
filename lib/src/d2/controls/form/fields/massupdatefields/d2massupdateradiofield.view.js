/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/form/fields/d2radiofield.view", "d2/controls/table/cells/field.value.count/field.value.count.view", "d2/utils/mass.update.utils", "css!d2/controls/form/fields/massupdatefields/impl/d2massupdateradiofield" ], function(i18n, $, _, Marionette, D2RadioFieldView, FieldValueCountView, MassUpdateUtils) {
  "use strict";
  return D2RadioFieldView.extend({
    className: D2RadioFieldView.prototype.className + " d2-massupdateradiofield",
    constructor: function D2MassUpdateRadioFieldView() {
      D2RadioFieldView.prototype.constructor.apply(this, arguments);
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
      rightStyle = this.$el.find(".d2-radio-item-container")[0].scrollWidth - maxLabelWidth - maxCountWidth - 16;
      this.$el.find(".count-region").css(i18n.settings.rtl ? "left" : "right", rightStyle);
      if (this.options.model.get("options").maxObjectThresholdReached) {
        this.$el.find(".d2-radio-item-container").each(function() {
          var input = $(this).find("input.radio-item"), id = input.attr("value");
          if (MassUpdateUtils.fieldHasMultipleValues(id)) {
            $(this).parent().prependTo(".cs-formfield.d2-radio-group ul");
          }
        });
      }
    },
    onRender: function() {
      D2RadioFieldView.prototype.onRender.apply(this, arguments);
      if (!this.options.model.get("options").maxObjectThresholdReached) {
        var me = this;
        this.$el.find(".d2-radio-item-container").each(function() {
          var input = $(this).find("input.radio-item"), id = input.attr("value"), model = me.collection.findWhere(function(model) {
            var mId = model.get("id") + "";
            return mId === id;
          });
          if (model.get("category") === "multivalue") {
            $(this).parent().addClass("binf-hidden");
          } else {
            var countData;
            if (me.options.model.get("options").multiFileCountData) {
              countData = me.options.model.get("options").multiFileCountData[id] || {
                value: id,
                count: 0,
                objectIds: [],
                totalCount: me.options.model.get("options").massUpdateFileCount
              };
            } else {
              countData = {
                count: input.is(":checked") ? me.options.model.get("options").massUpdateFileCount : 0,
                objectIds: input.is(":checked") ? _.pluck(me.options.model.get("options").massUpdateNodes, "r_object_id") : [],
                totalCount: me.options.model.get("options").massUpdateFileCount
              };
            }
            var countView = new FieldValueCountView({
              model: MassUpdateUtils.getCountDataModel(countData, me.options.model.get("options"))
            });
            $(this).append('<div class="count-region" style="position: absolute; top: 6px"></div>');
            var countRegion = new Marionette.Region({
              el: $(this).find(".count-region")
            });
            model.countView = countView;
            countRegion.show(countView);
          }
        });
        this.multiFileCountData = this.options.model.get("options").multiFileCountData;
      }
    },
    onShow: function() {
      D2RadioFieldView.prototype.onShow.apply(this, arguments);
      this._setCountPosition();
    },
    onSelectionChange: function(event) {
      if (!this.options.model.get("options").maxObjectThresholdReached) {
        var id = $(event.target).attr("value"), changeModel = this.collection.findWhere(function(model) {
          var mId = model.get("id") + "";
          return mId === id;
        }), changeCount = this.options.model.get("options").massUpdateFileCount;
        changeModel.countView.model.hideCount = false;
        changeModel.countView.model.previousFieldValueCount = _.isUndefined(changeModel.countView.model.previousFieldValueCount) ? changeModel.countView.model.get("d2_field_value_count") : changeModel.countView.model.previousFieldValueCount;
        changeModel.countView.model.set("objectIds", _.pluck(this.options.model.get("options").massUpdateNodes, "r_object_id"), {
          silent: true
        });
        changeModel.countView.model.set("d2_field_value_count", changeCount);
        if (this.multiFileCountData) {
          if (this.multiFileCountData[id]) {
            this.multiFileCountData[id].count = changeCount;
            this.multiFileCountData[id].objectIds = _.pluck(this.options.model.get("options").multiFileData, "object-id");
          } else {
            this.multiFileCountData[id] = {
              count: changeCount,
              objectIds: _.pluck(this.options.model.get("options").multiFileData, "object-id"),
              totalCount: changeCount,
              value: id
            };
          }
        }
        this._deSelectRestRadioItems(changeModel);
      }
      D2RadioFieldView.prototype.onSelectionChange.apply(this, arguments);
    },
    _deSelectRestRadioItems: function(changeModel) {
      var restModels = _.without(this.collection.models, changeModel), me = this;
      _.each(restModels, function(restModel) {
        if (restModel.get("category") !== "multivalue" && restModel.countView.model.get("d2_field_value_count")) {
          restModel.countView.model.hideCount = true;
          restModel.countView.model.previousFieldValueCount = _.isUndefined(restModel.countView.model.previousFieldValueCount) ? restModel.countView.model.get("d2_field_value_count") : restModel.countView.model.previousFieldValueCount;
          restModel.countView.model.set("objectIds", [], {
            silent: true
          });
          restModel.countView.model.set("d2_field_value_count", 0);
          var id = restModel.get("id") + "";
          if (me.multiFileCountData && me.multiFileCountData[id]) {
            if (restModel.countView.model.previousFieldValueCount === 0) {
              delete me.multiFileCountData[id];
            } else {
              me.multiFileCountData[id].count = 0;
              me.multiFileCountData[id].objectIds = [];
            }
          }
        }
      });
    }
  });
});