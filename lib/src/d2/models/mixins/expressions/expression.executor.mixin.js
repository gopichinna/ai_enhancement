/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "csui/controls/form/pub.sub", "d2/models/mixins/expressions/expression", "d2/utils/mass.update.utils" ], function(module, _, Backbone, log, PubSub, ExpressionModel, MassUpdateUtils) {
  "use strict";
  log = log(module.id);
  var ExpressionExecutorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        expressionExecutor: function() {
          return this;
        },
        initExpressions: function() {
          this.controlEvents = [];
          this.postRenderExpressions = [];
          this.evaluateBeforeRender(this.expressions);
          this.subscribe(this.expressions);
        },
        cleanupExpressions: function() {
          if (this.$form) {
            _.each(this.controlEvents, function(ev) {
              this.$form.off(ev);
            }, this);
            this.controlEvents = [];
          }
        },
        getParentFormForControl: function(controlName) {
          var controlPathObj = this._keyPathMap[controlName];
          if (controlPathObj) {
            var formId = controlPathObj.formId;
            var formModel = this.model.collection.get(formId);
            var form = this.options.originatingView.tabContent.children.findByModel(formModel);
            return form.content;
          }
        },
        subscribe: function(expressions) {
          if (!_.isEmpty(expressions)) {
            _.each(expressions, function(expConfig) {
              var events = expConfig.events;
              var controls = expConfig.controls;
              var methodName = expConfig.methodName;
              var eventHandler = this.createEventHandler(expConfig);
              var sourceControlOpts = this.getFieldForPath(this.model.get("options"), "fields", ".", expConfig.sourceControl);
              var ignoreMethodNames = [ "reInitialize" ];
              if (sourceControlOpts?.valueExistsInDB === true) {
                ignoreMethodNames.push("doComboReload");
              }
              _.each(events, function(event) {
                _.each(controls, function(control) {
                  var sourceForm = this.getParentFormForControl(control);
                  if (sourceForm) {
                    var ev = event + ":field:" + control;
                    this.controlEvents.push(ev);
                    this.listenTo(sourceForm, ev, eventHandler);
                    if (sourceControlOpts?._d2Containertype === "d2grid" || sourceControlOpts?.row_based_condition && !_.contains(ignoreMethodNames, methodName)) {
                      this.postRenderExpressions.push(_.bind(eventHandler, this, {
                        view: sourceForm
                      }));
                    }
                  } else {
                    console.warn("Error subscribing to event. Unable to find field: " + control);
                  }
                }, this);
              }, this);
            }, this);
          }
        },
        unSubscribe: function() {
          if (!_.isEmpty(this.expressions)) {
            _.each(this.expressions, function(expConfig) {
              var events = expConfig.events;
              var controls = expConfig.controls;
              _.each(events, function(event) {
                _.each(controls, function(control) {
                  var sourceForm = this.getParentFormForControl(control);
                  if (sourceForm) {
                    var ev = event + ":field:" + control;
                    this.stopListening(sourceForm, ev);
                  } else {
                    console.warn("Error subscribing to event. Unable to find field: " + control);
                  }
                }, this);
              }, this);
            }, this);
          }
        },
        createEventHandler: function(expConfig) {
          var targetControlPath = expConfig.sourceControl;
          var methodName = expConfig.methodName;
          var evtHandler = function(args) {
            var sourceView = args.view, sourceForm = sourceView.form;
            var targetControl = this.getAlpacaControlByPath(targetControlPath);
            if (_.isArray(targetControl)) {
              if (!_.isUndefined(args.index) && (methodName === "reInitialize" || methodName === "doComboReload")) {
                evaluateControlForCondition(sourceForm, sourceView, targetControl[args.index]);
              } else {
                _.each(targetControl, function(celControl) {
                  evaluateControlForCondition(sourceForm, sourceView, celControl);
                }, this);
                if (methodName === "setVisible") {
                  targetControl[0].parent.parent.containerItemEl.trigger("d2:refresh:setcontainer");
                }
              }
            } else {
              evaluateControlForCondition(sourceForm, sourceView, targetControl);
            }
          };
          var evaluateControlForCondition = _.bind(function evaluateControlForCondition(sourceForm, sourceView, targetControl) {
            var me = this;
            var getValue = function(sourceControlName) {
              var sourceControlPathObj = sourceView._keyPathMap[sourceControlName];
              if (sourceControlPathObj) {
                var sourceViewForm = me.getParentFormForControl(sourceControlName);
                var alpControl = sourceViewForm.getAlpacaControlByPath(sourceControlPathObj.fieldPath);
                var value;
                if (_.isArray(alpControl)) {
                  var rowControl = sourceViewForm.shouldApplyRowBasedEvaluation(targetControl, sourceControlName);
                  alpControl = rowControl ? [ rowControl ] : alpControl;
                  value = _.pluck(alpControl, "data");
                } else {
                  value = alpControl.getValue();
                }
                value = _.isArray(alpControl) && alpControl[0].options && alpControl[0].options.massUpdateFileCount || alpControl.options && alpControl.options.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(value) : value;
                return new ExpressionModel(value, alpControl);
              }
            };
            var value = this.evaluate(expConfig.function, getValue);
            if (targetControl) {
              if (methodName === "setRequired") {
                this.setRequired(targetControl, value);
              } else if (methodName === "setEnabled") {
                this.setEnabled(targetControl, value);
              } else if (methodName === "setVisible") {
                this.setVisible(targetControl, value);
              } else if (methodName === "setValid") {
                this.setValid(targetControl);
              } else if (methodName === "reInitialize") {
                this.reInitialize(targetControl);
              } else if (_.isFunction(targetControl.fieldView[methodName])) {
                targetControl.fieldView[methodName](value);
              }
            } else if (this.model.has("enableNonFieldExpression")) {
              PubSub.trigger("d2:form:expression:executed", targetControlPath, methodName, value);
            }
          }, this);
          return evtHandler;
        },
        fetchValidFormat: function(type) {
          return type.type === "date" || type.type === "datetime" ? this.model && this.model.attributes && this.model.attributes.schema && this.model.attributes.schema.value_format : "";
        },
        evaluateBeforeRender: function(expressions) {
          var me = this;
          var getValue = function(controlName) {
            var controlPathObj = me._keyPathMap[controlName];
            if (controlPathObj) {
              var formId = controlPathObj.formId;
              var fieldPath = controlPathObj.fieldPath;
              var formModel = me.model.collection.get(formId);
              var val = me.getFieldForPath(formModel.get("data"), "", ".", fieldPath);
              var option = me.getFieldForPath(formModel.get("options"), "fields", ".", fieldPath);
              var type = {
                options: {
                  _type: option._type
                }
              };
              var control = type;
              if (option._repeating === true) {
                control = [];
                _.each(val, function() {
                  control.push(_.clone(type));
                });
              }
              val = option && option.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(val) : val === null ? "" : val;
              return new ExpressionModel(val, control);
            }
          };
          if (!_.isEmpty(expressions)) {
            _.each(expressions, function(expConfig) {
              var value = this.evaluate(expConfig.function, getValue);
              var methodName = expConfig.methodName;
              var sourceControl = expConfig.sourceControl;
              if (methodName === "setRequired") {
                this.getFieldForPath(this.model.get("schema"), "properties", ".", sourceControl)["required"] = value;
              } else if (methodName === "setEnabled") {
                var alpControlSchema = this.getFieldForPath(this.model.get("schema"), "properties", ".", sourceControl);
                if (alpControlSchema) {
                  var disabledFromParentContainer = !!alpControlSchema["disabledByParent"];
                  alpControlSchema["disabledBySelf"] = !value;
                  if (disabledFromParentContainer === false && !value) {
                    alpControlSchema["disabled"] = !value;
                    this.recursivelyApplyDisablementToChildren(alpControlSchema, !value);
                  }
                } else if (this.model.has("enableNonFieldExpression")) {
                  PubSub.trigger("d2:form:expression:executed", sourceControl, methodName, value);
                }
              } else if (methodName === "setVisible") {
                var alpControlFieldOption = this.getFieldForPath(this.model.get("options"), "fields", ".", sourceControl);
                if (alpControlFieldOption) {
                  var hiddenFromParentContainer = !!alpControlFieldOption["hiddenByParent"];
                  alpControlFieldOption["hiddenBySelf"] = !value;
                  if (hiddenFromParentContainer === false && !value) {
                    alpControlFieldOption["hiddenInit"] = !value;
                    this.recursivelyApplyHiddenToChildren(alpControlFieldOption, !value);
                  }
                } else if (this.model.has("enableNonFieldExpression")) {
                  PubSub.trigger("d2:form:expression:executed", sourceControl, methodName, value);
                }
              }
            }, this);
          }
        },
        recursivelyApplyHiddenToChildren: function(alpControlFieldOption, value) {
          _.each(alpControlFieldOption.fields, function(childControl) {
            childControl["hiddenInit"] = value;
            childControl["hiddenByParent"] = value;
            if (_.isObject(childControl.fields)) {
              this.recursivelyApplyHiddenToChildren(childControl, value);
            }
          }, this);
        },
        recursivelyApplyDisablementToChildren: function(alpControlSchema, value) {
          _.each(alpControlSchema.properties, function(childControl) {
            childControl["disabled"] = value;
            childControl["disabledByParent"] = value;
            if (_.isObject(childControl.properties)) {
              this.recursivelyApplyDisablementToChildren(childControl, value);
            } else if (childControl._d2Containertype === "d2grid" && childControl.items && childControl.items.properties) {
              this.recursivelyApplyDisablementToChildren(childControl.items, value);
            }
          }, this);
        },
        evaluate: function(fn, valFn) {
          var getValue = valFn;
          var value;
          try {
            value = eval(fn);
          } catch (e) {
            console.error("Error evaluating " + fn, e);
          }
          return value;
        }
      });
    }
  };
  return ExpressionExecutorMixin;
});