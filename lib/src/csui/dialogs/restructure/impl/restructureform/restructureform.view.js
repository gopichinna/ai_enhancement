/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/controls/form/form.view", "csui/dialogs/restructure/impl/memberlist/memberlist.view", "csui/behaviors/keyboard.navigation/tabkey.behavior", "i18n!csui/dialogs/restructure/impl/nls/lang" ], function(_, $, Backbone, Marionette, FormView, MemberListView, TabKeyBehaviour, lang) {
  "use strict";
  var RestructureFormView = FormView.extend({
    id: "csui-restructure-form",
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabKeyBehaviour
      }
    },
    constructor: function RestructureFormView(options) {
      options || (options = {});
      options = _.extend(options, {
        mode: "create"
      });
      FormView.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      this.$el.addClass("csui-restructure-form");
      this._assigneeCollection = this._getAssigneeCollection();
      this.listenTo(this._assigneeCollection, "changed", this._ensureAssigneeListView);
      this.assigneeListView = new MemberListView({
        collection: this._assigneeCollection,
        context: this.options.context,
        connector: this.options.connector,
        data: {
          title: lang.notificationListTitle
        }
      });
      this.listenTo(this.assigneeListView, "remove:member", function(childView) {
        if (this._removeAssignee(childView.model)) {
          this.validate("notifyUsers");
        }
      });
      this.emptyView = new Marionette.ItemView({
        template: false
      });
      this.listenTo(this, {
        render: this.onAfterRender,
        "before:destroy": function() {
          this.assigneeListView.destroy();
          this.emptyView.destroy();
          this.assigneeListRegion.destroy();
        },
        "change:field": function() {
          this.validate();
        }
      });
    },
    _getAssigneeCollection: function() {
      var collection = new Backbone.Collection();
      return collection;
    },
    _addAssignee: function(data) {
      if (data.id && !this._assigneeCollection.findWhere({
        id: data.id
      })) {
        this._assigneeCollection.add(data, {
          at: 0
        });
        this._assigneeCollection.trigger("changed");
        return true;
      }
      return false;
    },
    _removeAssignee: function(memberModel) {
      var memberId = memberModel.get("id");
      if (this._assigneeCollection.findWhere({
        id: memberId
      })) {
        this._assigneeCollection.remove(memberModel);
        this._assigneeCollection.trigger("changed");
        var e = $.Event("keydown");
        e.keyCode = 9;
        e.shiftKey = true;
        this.$el.trigger(e);
        return true;
      }
      return false;
    },
    _setCustomValidators: function() {
      var that = this, fields = this.model.get("options")["fields"];
      if (fields && fields["location"] && fields["notifyUsers"] && fields["categoryInheritance"]) {
        fields["location"].validator = function(callback) {
          if (this.fieldView && this.fieldView.pickerArgs) {
            if (this.fieldView.pickerArgs.applyProperties || this.fieldView.pickerArgs.openSelectedProperties) {
              that.openSelectedProperties = this.fieldView.pickerArgs.openSelectedProperties;
              that.selectedOptions = this.fieldView.pickerArgs.nodes;
            }
          }
          if (that.validate(this.name)) {
            callback({
              status: true
            });
            this.field.removeClass("binf-has-error alpaca-invalid");
          } else {
            callback({
              status: false
            });
            this.field.addClass("binf-has-error alpaca-invalid");
          }
        };
        fields["notifyUsers"].validator = function(callback) {
          if (this.data.id && that._addAssignee(this.data)) {
            this.fieldView.setValue("", false);
            this.field.find("input").val("");
          }
          this.data = "";
        };
        fields["categoryInheritance"].validator = function(callback) {
          that.applyProperties = this.data > 0 ? this.data : null;
        };
      }
    },
    _addAssigneeListRegion: function() {
      var $assigneeListEl = $("<div></div>").addClass("notifyUsers-list");
      this.assigneeListRegion = new Marionette.Region({
        el: $assigneeListEl
      });
      this.$el.append($assigneeListEl);
    },
    _ensureAssigneeListView: function() {
      if (this._assigneeCollection.length) {
        if (!(this.assigneeListRegion.currentView instanceof MemberListView)) {
          this.assigneeListRegion.show(this.assigneeListView, {
            preventDestroy: true
          });
        }
      } else {
        this.assigneeListRegion.show(this.emptyView, {
          preventDestroy: true
        });
      }
    },
    validate: function(location) {
      var res, values = this.getValues();
      res = !!values["location"];
      this.triggerMethod(res ? "valid:form" : "invalid:form");
      return res;
    },
    getValues: function() {
      var values = this.form.getValue();
      values.notifyUsers = _.map(this._assigneeCollection.models, function(model) {
        return model.get("id");
      }, this);
      return values;
    },
    onAfterRender: function() {
      this._setCustomValidators();
      this._addAssigneeListRegion();
      this._ensureAssigneeListView();
    }
  });
  return RestructureFormView;
});