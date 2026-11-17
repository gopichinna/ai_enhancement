/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/widgets/metadata/metadata.general.form.fields", "csui/widgets/metadata/general.form.fields/impl/general.form.fields.view", "csui/dialogs/modal.alert/modal.alert" ], function(_, $, Backbone, Marionette, metadataGeneralFormFields, GeneralFormFieldCollectionView, ModalAlert) {
  "use strict";
  var GeneralFormFieldBehavior = Marionette.Behavior.extend({
    constructor: function GeneralFormFieldBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.listenTo(this.view, "render", this._insertFieldExtensions).listenTo(this.view, "destroy", this._emptyExtensionRegion).listenTo(this.view.options?.originatingView, "render:general:fields", this.onRenderGeneralFields);
      this.fieldDescriptorsPromise = $.Deferred().resolve().promise();
      var self = this;
      view.getGeneralFormFieldValues = function() {
        var formValues = {};
        if (self.fieldRegion) {
          self.fieldRegion.currentView.children.each(function(formView) {
            var values = formView.getValues(), roleName = formView.model.get("role_name"), roles, role;
            if (values) {
              if (roleName) {
                roles = formValues.roles || (formValues.roles = {});
                role = roles[roleName] || (roles[roleName] = {});
                _.extend(role, values);
              } else {
                _.extend(formValues, values);
              }
            }
          });
        }
        return formValues;
      };
    },
    onRenderGeneralFields: function(loadGeneralFormFields) {
      const originatingView = this.view.options?.originatingView;
      if (originatingView) {
        originatingView.blockActions();
        if (loadGeneralFormFields) this.fieldDescriptorsPromise = originatingView._loadGeneralFormFields();
      }
      this._insertFieldExtensions();
    },
    _insertFieldExtensions: function() {
      var fieldParent = this.getOption("fieldParent");
      const originatingView = this.view.options?.originatingView;
      if (_.isFunction(fieldParent)) {
        fieldParent = fieldParent.call(this.view);
      }
      if (fieldParent) {
        fieldParent = this.view.$(fieldParent)[0];
      }
      if (!fieldParent) {
        return;
      }
      this.fieldDescriptorsPromise.then(_.bind(function() {
        const fieldDescriptors = originatingView?._generalFormFieldDescriptors;
        if (!fieldDescriptors || !fieldDescriptors.length) {
          this.view.triggerMethod("show:left:pane");
          return;
        }
        this.fieldRegion = new Marionette.Region({
          el: fieldParent
        });
        var fieldViewOptions = this.getOption("fieldViewOptions");
        if (_.isFunction(fieldViewOptions)) {
          fieldViewOptions = fieldViewOptions.call(this.view);
        }
        var fieldModels = new Backbone.Collection(_.pluck(fieldDescriptors, "formModel")), fieldViews = new GeneralFormFieldCollectionView(_.extend({
          context: this.view.options.context,
          fieldDescriptors: fieldDescriptors,
          collection: fieldModels,
          node: this.view.options.node,
          mode: this.view.options.mode,
          generalFormView: this.view,
          fetchedModels: this.view.options.fetchedModels,
          displayedModels: this.view.options.displayedModels,
          originatingView: this.view.options.originatingView,
          metadataView: this.view.options.metadataView
        }, fieldViewOptions));
        this.listenTo(fieldViews, "render:forms", function() {
          this.view.triggerMethod("render:general:form:fields", fieldViews);
          this.view.triggerMethod("show:left:pane");
        });
        this.fieldRegion.show(fieldViews);
      }, this)).always(function() {
        originatingView?.unblockActions();
      });
    },
    _emptyExtensionRegion: function() {
      if (this.fieldRegion) {
        this.fieldRegion.empty();
      }
    }
  }, {
    getFieldDescriptors: function(options) {
      var methodName, parameters;
      if (options.action === "create") {
        methodName = "getGeneralFormFieldsForCreate";
        parameters = [ {
          forms: options.forms
        } ];
      } else if (options.action === "copy") {
        methodName = "getGeneralFormFieldsForCopy";
        parameters = [ {
          forms: options.forms
        } ];
      } else if (options.action === "move") {
        methodName = "getGeneralFormFieldsForMove";
        parameters = [ {
          forms: options.forms
        } ];
      } else if (options.action === "restructure") {
        methodName = "getGeneralFormFieldsForMove";
        parameters = [ {
          forms: options.forms
        } ];
      } else {
        methodName = "getGeneralFormFields";
      }
      var promises = metadataGeneralFormFields.chain().map(function(fieldControllerDescriptor) {
        var Controller = fieldControllerDescriptor.get("controller"), controllerOptions = fieldControllerDescriptor.get("controllerOptions"), controller = new Controller(_.extend({
          context: options.context,
          model: options.node,
          fetchedModels: options.forms
        }, controllerOptions)), method = controller[methodName];
        return method && method.apply(controller, parameters);
      }).compact().value();
      return $.when.apply($, promises).then(function() {
        return _.flatten(arguments);
      });
    }
  });
  return GeneralFormFieldBehavior;
});