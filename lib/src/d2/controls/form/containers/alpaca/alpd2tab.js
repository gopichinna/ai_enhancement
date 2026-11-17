/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/pub.sub", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "nuc/utils/base", "i18n!d2/controls/form/impl/nls/lang", "txt!d2/controls/form/impl/d2tab/tabcontainer.txt", "txt!d2/controls/form/impl/d2tab/tabcontaineritem.txt", "d2/controls/form/containers/alpaca/alpd2container" ], function(_, $, Backbone, Marionette, Alpaca, PubSub, PerfectScrollingBehavior, base, lang, d2tabcontainer, d2tabcontaineritem, alpd2container) {
  "use strict";
  var tabFieldName = "d2tab";
  var BinfColMd12 = "binf-col-md-12";
  var BinfColMd6 = "binf-col-md-6";
  Alpaca.Fields.D2TabField = alpd2container.extend({
    constructor: function D2TabField(container, data, options, schema, view, connector, onError) {
      this.eventArray = [];
      this.base(container, data, options, schema, view, connector, onError);
      this.resolveRequiredFields();
    },
    getFieldType: function() {
      return tabFieldName;
    },
    isValidationParticipant: function() {
      return !this.options.hidden;
    },
    onShow: function() {
      if (this.options.isSpyScrollContainer) {
        var form = this.domEl.closest(".d2-properties-form").parent();
        form.removeClass("binf-hidden");
      } else {
        this.getContainerEl().hide();
      }
      PubSub.trigger([ tabFieldName, this.propertyId, "show" ].join(":"), this.propertyId);
      this.propogateRequiredFieldsEvent();
    },
    _addScrollbar: function() {
      var setEl = this.getContainerEl();
      var self = this;
      if (PerfectScrollingBehavior.usePerfectScrollbar()) {
        setEl.css("overflow", "hidden");
        if (parseInt(setEl.css("height"))) {
          if (parseInt(setEl.css("height")) < setEl.prop("scrollHeight")) {
            !setEl.hasClass("csui-perfect-scrolling") && setEl.addClass("csui-perfect-scrolling");
            setEl.perfectScrollbar({
              suppressScrollX: true,
              minScrollbarLength: 32,
              stopPropagationOnClick: false
            });
            setEl.perfectScrollbar("update");
          } else {
            setEl.perfectScrollbar("destroy");
          }
        } else {
          setTimeout(function() {
            self._addScrollbar();
          }, 10);
        }
      } else {
        setEl.css("overflow", "auto");
      }
    },
    onHide: function() {
      if (this.options.isSpyScrollContainer) {
        var form = this.domEl.closest(".d2-properties-form").parent();
        form.addClass("binf-hidden");
      }
      PubSub.trigger([ tabFieldName, this.propertyId, "hide" ].join(":"), this.propertyId);
      if (this.options.required === true) {
        this.options.required = false;
        PubSub.trigger([ tabFieldName, this.propertyId, "optional" ].join(":"), this.propertyId);
      }
    },
    activate: function() {
      var self = this;
      this.getContainerEl().show();
      if (this.options.usePerfectScrollbar) {
        $(window).on("resize", function() {
          self._addScrollbar();
        });
        this._addScrollbar();
      } else {
        this.getContainerEl().css("overflow", "auto");
      }
      PubSub.trigger([ tabFieldName, this.propertyId, "active" ].join(":"), this.propertyId);
    },
    deactivate: function() {
      this.getContainerEl().hide();
      PubSub.trigger([ tabFieldName, this.propertyId, "deactive" ].join(":"), this.propertyId);
    },
    postRender: function(callback) {
      this.base(callback);
      var self = this;
      var tabFocusEventKey = [ tabFieldName, this.propertyId, "focus" ].join(":");
      PubSub.on(tabFocusEventKey, function() {
        self.children[0].focus();
      });
      self.eventArray.push(tabFocusEventKey);
      this.bindEventsForChildControls(this);
      this.onDomRefresh(false);
      if (!this.options.isSpyScrollContainer) {
        this.getContainerEl().children().on("keydown", function(event) {
          var handled = false;
          switch (event.keyCode) {
           case $.ui.keyCode.TAB:
            var el;
            if (event.shiftKey) {
              el = event.currentTarget.previousElementSibling;
              if (!el) {
                var tabId = $(this).parents(".d2tabcontainer").attr("id");
                $(this).parents(".d2tabgroupcontainer").find('li a[href="#' + tabId + '"]').trigger("focus");
                handled = true;
              }
            } else {
              el = event.currentTarget.nextElementSibling;
            }
            if (el) {
              var tabables = $(el).find("[tabindex]").filter(":visible");
              if (tabables && tabables.length) {
                tabables[0].focus();
                handled = true;
              }
            }
            break;
          }
          if (handled) {
            event.preventDefault();
            event.stopPropagation();
          }
        });
      }
    },
    bindEventsForChildControls: function(container) {
      var self = this;
      _.each(container.children, function(field) {
        if (field.isContainer() && field.children) {
          this.bindEventsForChildControls(field);
        }
        PubSub.on("show:" + field.id, function(control) {
          if (control.schema.required === true) {
            self.options.required = true;
            PubSub.trigger([ tabFieldName, self.propertyId, "required" ].join(":"), self.propertyId);
          }
          if (control.type !== "d2tab" && control.type !== "d2tabgroup") {
            self.getContainerEl().find("[data-alpaca-container-item-name=" + control.name + "]").parent().show();
          }
          self.onDomRefresh(true);
        });
        PubSub.on("hide:" + field.id, function(control) {
          if (self.options.required === true && control.schema.required === true) {
            self.propogateRequiredFieldsEvent();
          }
          if (!control?.options?.isGridField && control.type !== "d2tab" && control.type !== "d2tabgroup") {
            self.getContainerEl().find("[data-alpaca-container-item-name=" + control.name + "]").parent().hide();
          }
          self.onDomRefresh(true);
        });
        self.eventArray.push("show:" + field.id);
        self.eventArray.push("hide:" + field.id);
        PubSub.on("required:" + field.id, function(control) {
          if (self.options.required !== true && !control.options.hidden) {
            self.options.required = true;
            PubSub.trigger([ tabFieldName, self.propertyId, "required" ].join(":"), self.propertyId);
          }
        });
        PubSub.on("optional:" + field.id, function() {
          if (self.options.required === true) {
            var changed = self.resolveRequiredFields();
            if (changed) {
              PubSub.trigger([ tabFieldName, self.propertyId, "optional" ].join(":"), self.propertyId);
            }
          }
        });
        self.eventArray.push("required:" + field.id);
        self.eventArray.push("optional:" + field.id);
        if (field.options.isSetType === undefined && field.type === "array") {
          field.domEl.addClass("cs-form-doublecolumn");
        }
      }, this);
    },
    onDomRefresh: function(loaded) {
      var el = this.getContainerEl();
      el.children(".d2tabtopfieldpadding").removeClass("d2tabtopfieldpadding");
      el.children(".d2tabpostcontainerpadding").removeClass("d2tabpostcontainerpadding");
      var topPaddingCount = 2;
      var postContainerFieldCount = 0;
      var self = this;
      el.children().each(function() {
        var child = $(this);
        if (loaded && child.is(":hidden")) {
          return;
        }
        if (self.options.tabLevel > 2 && child.children().children().hasClass("alpaca-field-d2tabgroup")) {
          child.children().addClass("d2-tabcontainer-custom-padding");
        }
        if (child.hasClass(BinfColMd12)) {
          if (topPaddingCount < 2) {
            if (child.children().children().hasClass("alpaca-field-d2tabgroup")) {
              child.addClass("d2tabcontainertoppadding");
            } else {
              child.addClass("d2tabcontainermiddlepadding");
            }
          }
          topPaddingCount = 0;
          postContainerFieldCount = 2;
        }
        if (topPaddingCount && child.hasClass(BinfColMd6)) {
          child.addClass("d2tabtopfieldpadding");
          topPaddingCount -= 1;
        }
        if (postContainerFieldCount && child.hasClass(BinfColMd6)) {
          child.addClass("d2tabpostcontainerpadding");
          postContainerFieldCount -= 1;
        }
      });
    },
    getType: function() {
      return tabFieldName;
    },
    destroy: function() {
      _.each(this.eventArray, function(event) {
        PubSub.off(event);
      });
      Alpaca.Fields.ObjectField.prototype.destroy.call(this);
    },
    propogateRequiredFieldsEvent: function() {
      this.resolveRequiredFields();
      var eventName = this.options.required === true ? "required" : "optional";
      PubSub.trigger([ tabFieldName, this.propertyId, eventName ].join(":"), this.propertyId);
    }
  });
  Alpaca.registerFieldClass(tabFieldName, Alpaca.Fields.D2TabField, "bootstrap-csui");
  Alpaca.registerTemplate("container-" + tabFieldName, d2tabcontainer);
  Alpaca.registerTemplate("container-" + tabFieldName + "-item", d2tabcontaineritem);
  return Alpaca.Fields.D2TabField;
});