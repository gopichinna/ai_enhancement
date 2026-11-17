/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "nuc/utils/base", "txt!d2/controls/form/impl/d2tab/singlecoltabcontainer.txt", "txt!d2/controls/form/impl/d2tab/tabcontaineritem.txt", "css!d2/controls/form/impl/d2tab/singlecoltabcontainer", "d2/controls/form/containers/alpaca/alpd2container", "d2/controls/form/containers/d2singlecolumntab.view", "csui/controls/form/pub.sub", "i18n" ], function(_, $, Backbone, Marionette, Alpaca, base, AlpColumnTemplate, AlpColumnItemTemplate, ColCss, AlpD2Container, SingleColView, PubSub, i18n) {
  var tabFieldName = "d2tab";
  function adjustToFlowDirection(value) {
    return (i18n.settings.rtl ? 1 : -1) * value;
  }
  Alpaca.Fields.D2SingleColumnNestedTab = AlpD2Container.extend({
    constructor: function D2SingleColumnNestedTab(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
      this.resolveRequiredFields();
      var originatingView = connector.config.formView.options.originatingView;
      originatingView && originatingView.on("metadataView:relayout", function() {
        var floatingTabSection = this.field.find(">.d2-singlecolumn-tab-section");
        floatingTabSection.length > 0 && floatingTabSection.outerHeight(originatingView.tabContent.$el.outerHeight() + originatingView.tabLinks.$el.outerHeight() + floatingTabSection.closest(".item-details.right-pane").find(".item-details-header").outerHeight() + floatingTabSection.closest(".d2-create-folder-dialog").find(".folder-type-area").outerHeight());
      }, this);
    },
    postRender: function(callback) {
      this.base(callback);
      this.eventArray = [];
      var self = this;
      _.each(this.children, function(field) {
        PubSub.on("show:" + field.id, function(control) {
          if (control.schema.required === true) {
            self.options.required = true;
            PubSub.trigger([ tabFieldName, self.propertyId, "required" ].join(":"), self.propertyId);
          }
        });
        PubSub.on("hide:" + field.id, function(control) {
          if (self.options.required === true && control.schema.required === true) {
            self.propogateRequiredFieldsEvent();
          }
        });
        PubSub.on("required:" + field.id, function(control) {
          if (self.options.required !== true && !control.options.hidden) {
            self.options.required = true;
            PubSub.trigger([ tabFieldName, self.propertyId, "required" ].join(":"), self.propertyId);
          }
        });
        PubSub.on("optional:" + field.id, function() {
          if (self.options.required !== false) {
            var changed = self.resolveRequiredFields();
            if (changed) {
              PubSub.trigger([ tabFieldName, self.propertyId, "optional" ].join(":"), self.propertyId);
            }
          }
        });
        self.eventArray.push("required:" + field.id);
        self.eventArray.push("optional:" + field.id);
        self.eventArray.push("show:" + field.id);
        self.eventArray.push("hide:" + field.id);
      });
    },
    renderContainer: function(model, callback) {
      var me = this;
      var cb = function(container) {
        me.fieldView = new SingleColView({
          alpacaField: me,
          containerEl: container
        });
        me.fieldView.render();
        callback(me.fieldView.$el);
      };
      this.base(model, cb);
    },
    getFieldType: function() {
      return "d2singleTab";
    },
    activate: function(options) {
      if (base.isAppleMobile()) {
        var parentNestedTab = this.fieldView.$el.closest(".d2-singlecolumn-tab-content");
        if (parentNestedTab.length > 0) {
          parentNestedTab.addClass("d2-disable-scroll");
        } else {
          this.fieldView.$el.closest(".binf-tab-content").addClass("d2-disable-scroll");
        }
      }
      var floatingTabSection = this.field.find(">.d2-singlecolumn-tab-section");
      floatingTabSection.css({
        display: ""
      });
      if (options && options.animate) {
        floatingTabSection.css({
          right: adjustToFlowDirection(floatingTabSection.width())
        });
        floatingTabSection.animate({
          right: 0
        }, {
          duration: 300,
          complete: function() {
            var originatingView = this.connector.config.formView.options.originatingView;
            if (originatingView && originatingView.slidingList) {
              originatingView.slidingList.push(this.fieldView.$el);
              originatingView.tabContent.triggerMethod("refresh:tabable:elements", originatingView);
              if (!options.ignoreFocusOnBack) {
                this.fieldView.ui.back_button.parent().trigger("focus");
              }
            }
            this.fieldView.trigger("dom:refresh");
            floatingTabSection.addClass("d2tab-active");
            this.active = true;
          }.bind(this)
        });
      }
    },
    deactivate: function(options) {
      this.redraw();
      if (base.isAppleMobile()) {
        var parentNestedTab = this.fieldView.$el.closest(".d2-singlecolumn-tab-content");
        if (parentNestedTab.length > 0) {
          parentNestedTab.removeClass("d2-disable-scroll");
        } else {
          this.fieldView.$el.closest(".binf-tab-content").removeClass("d2-disable-scroll");
        }
        $(window).trigger("resize");
      }
      var tabSection = this.field.find(">.d2-singlecolumn-tab-section");
      if (options && options.animate) {
        tabSection.animate({
          right: adjustToFlowDirection(tabSection.width())
        }, {
          duration: 300,
          complete: function() {
            var originatingView = this.connector.config.formView.options.originatingView;
            tabSection.css({
              display: "none",
              right: 0
            });
            this.active = false;
            tabSection.removeClass("d2tab-active");
            if (originatingView && originatingView.slidingList) {
              originatingView.slidingList.pop();
              originatingView.tabContent.triggerMethod("refresh:tabable:elements", originatingView);
              !!originatingView.fetchFirstFocussableElement && !!originatingView.fetchFirstFocussableElement() && originatingView.fetchFirstFocussableElement().trigger("focus");
            }
          }.bind(this)
        });
      } else {
        tabSection.css({
          display: "none"
        });
        tabSection.removeClass("d2tab-active");
        this.active = false;
        var originatingView = this.connector.config.formView.options.originatingView;
        if (originatingView && originatingView.slidingList) {
          originatingView.slidingList.pop();
          originatingView.tabContent.triggerMethod("refresh:tabable:elements", originatingView);
          !!originatingView.fetchFirstFocussableElement && !!originatingView.fetchFirstFocussableElement() && originatingView.fetchFirstFocussableElement().trigger("focus");
        }
      }
    },
    redraw: function() {
      if (base.isIE11()) {
        $(window).trigger("resize");
      }
    },
    onShow: function() {
      PubSub.trigger([ tabFieldName, this.propertyId, "show" ].join(":"), this.propertyId);
      this.propogateRequiredFieldsEvent();
    },
    onHide: function() {
      PubSub.trigger([ tabFieldName, this.propertyId, "hide" ].join(":"), this.propertyId);
      if (this.options.required === true) {
        this.options.required = false;
        PubSub.trigger([ tabFieldName, this.propertyId, "optional" ].join(":"), this.propertyId);
      }
    },
    propogateRequiredFieldsEvent: function() {
      this.resolveRequiredFields();
      var eventName = this.options.required === true ? "required" : "optional";
      PubSub.trigger([ tabFieldName, this.propertyId, eventName ].join(":"), this.propertyId);
    },
    destroy: function() {
      _.each(this.eventArray, function(event) {
        PubSub.off(event);
      });
      var originatingView = this.connector.config.formView.options.originatingView;
      originatingView && originatingView.off("metadataView:relayout", null, this);
      AlpD2Container.prototype.destroy.call(this);
    }
  });
  Alpaca.registerFieldClass("d2singleTab", Alpaca.Fields.D2SingleColumnNestedTab, "bootstrap-csui");
  Alpaca.registerTemplate("container-d2singleTab", AlpColumnTemplate);
  Alpaca.registerTemplate("container-d2singleTab-item", AlpColumnItemTemplate);
  return $.alpaca.Fields.D2SingleColumnNestedTab;
});