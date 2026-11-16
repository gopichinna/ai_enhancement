/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/url", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/dialogs/create.relation/impl/empty.views/empty.relations.view", "d2/dialogs/create.relation/impl/empty.views/empty.child.view", "d2/controls/form/fields/d2selectfield.view", "d2/dialogs/create.relation/impl/relationItem/child.item.view", "i18n!d2/dialogs/create.relation/impl/nls/lang", "hbs!d2/dialogs/create.relation/impl/create.relation.form", "d2/utils/content.assist", "d2/dialogs/create.relation/create.relation.form.mixin", "d2/utils/constants", "css!d2/dialogs/create.relation/impl/create.relation.form" ], function(_, $, Backbone, Marionette, Url, TabableRegionBehavior, WizardTabableRegionBehavior, PerfectScrollingBehavior, FormConverter, D2GeneralFormModel, D2FormView, RestResources, RestLinkrels, EmptyRelationView, EmptyChildView, D2SelectField, relationChildItemView, lang, template, ContentAssist, CreateRelationMixin, constants) {
  var CreateRelationFormView = Marionette.LayoutView.extend({
    className: "d2-create-relation",
    template: template,
    regions: {
      parentRegion: ".relation-parent",
      relationTypeRegion: ".relation-type-selection",
      emptyRelationRegion: ".empty-relations-view",
      childViewRegion: ".child-list-view",
      descriptionRegion: ".relations-description-box"
    },
    ui: {
      addButton: ".relation-toolbar-panel .relation-add-child-button",
      addButton2: ".child-list-view .d2-add-button",
      iconDirection: ".relation-direction",
      removeBtn: ".binf-list-group-item .remove-button",
      relationsDropdown: ".d2-create-relation-form > button",
      multipleFilesHelpMessageBlock: ".d2-mulitple-object-message-container"
    },
    events: {
      "click @ui.addButton": "openChildPicker",
      "keydown @ui.addButton": "onKeyOpenChildPicker",
      "click @ui.addButton2": "openChildPicker",
      "keydown @ui.addButton2": "onKeyOpenChildPicker",
      "click @ui.iconDirection": "onClickDirection",
      "keydown @ui.iconDirection": "onKeyInDirection"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    onClickDirection: function(event) {
      event.stopPropagation();
      var me = this;
      if (this.ui.iconDirection.hasClass("reverse")) {
        this.ui.iconDirection.removeClass("reverse");
        me.reverseRelation = false;
      } else {
        this.ui.iconDirection.addClass("reverse");
        me.reverseRelation = true;
      }
      this.validate();
    },
    onKeyOpenChildPicker: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.openChildPicker(event);
      }
    },
    onKeyInDirection: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.stopPropagation();
        this.ui.iconDirection.trigger("click");
      }
    },
    openChildPicker: function(event) {
      if (event.currentTarget.classList && !event.currentTarget.classList.contains("disabled")) {
        var me = this, deferred = $.Deferred();
        event.stopPropagation();
        require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
          me.getContentAssistOptions(NodePicker, deferred);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise();
      }
    },
    displayContentAssist: function(NodePicker, deferred) {
      var me = this, pickerOptions = this.createPickerOptions();
      pickerOptions.storeContainer = true;
      pickerOptions.restoreContainer = true;
      pickerOptions.dataId = constants.StorageKey.CREATE_RELATION_FORM_VIEW + constants.StorageKey.ANCESTOR_INFO;
      var pickerCategroy = me.reverseRelation ? "parentType" : "childType";
      pickerOptions.subTypeFilters = me.findTypeAndSubTypes(me.selectedRelationModel.get(pickerCategroy));
      this.nodePicker = new NodePicker(pickerOptions);
      this.nodePicker.show().done(function(selectedNodes) {
        if (selectedNodes.nodes.length > 0) {
          me.relationChildrenSelected = true;
          me.options.isChildCollection = true;
          me.ui.addButton.removeClass("binf-hidden disabled");
          if (!me.selectedRelationModel.get("isMultiRelation")) {
            me.ui.addButton.addClass("disabled");
          }
          if (me.options.selectedNodes) {
            me.options.selectedNodes.add(selectedNodes.nodes);
          } else {
            me.options.selectedNodes = new Backbone.Collection(selectedNodes.nodes);
          }
          me.emptyChildView.remove();
          me.ChildSectionView = new relationChildItemView(me.options);
          me.childViewRegion.show(me.ChildSectionView);
          me.descriptionView = new D2FormView({
            model: me._getDescriptionModel(),
            mode: "create",
            context: this.context,
            className: "d2-create-relation-description-box",
            templateWrapperClassName: "d2-create-relation-description-wrapper"
          });
          me.descriptionRegion.show(me.descriptionView);
          me.validate();
        }
        deferred.resolve(selectedNodes);
      }).fail(function() {
        deferred.reject(arguments);
      });
    },
    constructor: function CreateRelationFormView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(this, "childView:refresh", function() {
        if (this.options.selectedNodes.length === 0) {
          this.descriptionView.remove();
          var emptyChildView = new EmptyChildView();
          this.childViewRegion.show(emptyChildView);
        }
        this.validate();
      });
      _.extend(this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
    },
    initialize: function() {
      this._init();
    },
    templateHelpers: function() {
      return {
        noRelationSelected: !this.relationTypeSelected,
        parentHeader: lang.RelationParentHeaderTitle,
        RelationDirectionTooltip: lang.RelationDirectionTooltip,
        AddbuttonToolTip: lang.AddbuttonToolTip,
        MulitpleRelationsNotSupportErrorMsg: lang.MulitpleRelationsNotSupportErrorMsg,
        InvalidTypeErrorMsg: lang.InvalidTypeErrorMsg
      };
    },
    onRender: function() {
      this._initializeViews();
      this.parentRegion.show(this.parentItemView);
      if (!this.relationTypeSelected) {
        this.emptyRelationRegion.show(this.emptyRelationView);
        this.relationTypeRegion.show(this.relationTypeSelectionField);
      } else {
        this.relationTypeRegion.show(this.relationTypeSelectionField);
        this.emptyChildView = new EmptyChildView();
        this.childViewRegion.show(this.emptyChildView);
      }
    },
    setValueAndValidate: function() {
      return true;
    },
    _initializeViews: function() {
      this.relationTypesList = this.configRelationTypes.map(function(model) {
        return {
          name: model.content.properties["parent_child_label"],
          id: model.content.properties.relation_name,
          isMultiRelation: model.content.properties["is_multiple_relation"],
          childType: model.content.properties["child_type"],
          parentType: model.content.properties["parent_type"]
        };
      });
      this.parentItemView = new relationChildItemView(this.options);
      this.relationTypeSelectionField = new D2SelectField({
        selected: this.selectedRelationModel ? this.selectedRelationModel : new (Backbone.Model.extend())({
          id: "",
          name: lang.DefaultRelationTypeLabel
        }),
        collection: new (Backbone.Collection.extend())(this.relationTypesList)
      });
      this.listenTo(this.relationTypeSelectionField, "field:changed", this.validate.bind(this));
      this.emptyRelationView = new EmptyRelationView();
    },
    _getDescriptionModel: function() {
      var form = {
        data: {
          description_box: ""
        },
        schema: {
          properties: {
            description_box: {
              readonly: false,
              required: false,
              type: "string"
            }
          }
        },
        options: {
          fields: {
            description_box: {
              hideInitValidationError: true,
              readonly: false,
              type: "textarea",
              isEditable: true,
              rows: 1,
              placeholder: lang.DescriptionPlaceHolder
            }
          }
        },
        expressions: {}
      };
      form.options.originatingView = this;
      form.options.connector = this.connector;
      FormConverter.generateFormModelConfig([ form ]);
      this.descriptionFormModel = new D2GeneralFormModel({
        id: "create-relation-form"
      });
      this.descriptionFormModel.set(form);
      return this.descriptionFormModel;
    },
    validate: function(item) {
      var self = this;
      setTimeout(function() {
        if (item && !_.isEmpty(item.get("id"))) {
          self.relationTypeSelected = true;
          self.selectedRelationModel = item;
        }
        var multiFileValid = self.validateMultiFileSupport();
        var validTypeFlag = self.validateType();
        self.isCreateButtonDisabled = !multiFileValid || !validTypeFlag;
        self.options.wizard.refreshFooter();
        if (self.emptyRelationView.isRendered) {
          self.render();
        }
      });
    },
    validateMultiFileSupport: function() {
      let validate = false;
      if (this.relationTypeSelected && !this.selectedRelationModel.get("isMultiRelation")) {
        if (this.options.selectedNodes && this.options.selectedNodes.length === 1) {
          validate = true;
          this.ui.multipleFilesHelpMessageBlock.addClass("binf-hidden");
          this.ui.addButton.addClass("disabled");
        } else if (this.options.selectedNodes && this.options.selectedNodes.length > 1) {
          validate = false;
          this.ui.addButton.addClass("disabled");
          this.ui.multipleFilesHelpMessageBlock.removeClass("binf-hidden");
        }
      } else {
        if (this.options.selectedNodes && this.options.selectedNodes.length > 0) {
          validate = true;
          this.ui.addButton.removeClass("disabled binf-hidden");
        } else {
          validate = false;
          this.ui.addButton.addClass("binf-hidden");
        }
        this.ui.multipleFilesHelpMessageBlock.addClass("binf-hidden");
      }
      return validate;
    },
    validateType: function() {
      let validTypeFlag = true;
      var sourceType = !this.reverseRelation ? this.selectedRelationModel.get("parentType") : this.selectedRelationModel.get("childType");
      var targetType = this.reverseRelation ? this.selectedRelationModel.get("parentType") : this.selectedRelationModel.get("childType");
      var sourceValidation = !this.parentItemView.validate(sourceType);
      var targetValidation = !this.ChildSectionView?.validate(targetType);
      if (sourceValidation || targetValidation) {
        validTypeFlag = false;
      }
      return validTypeFlag;
    }
  });
  CreateRelationMixin.mixin(CreateRelationFormView.prototype);
  return CreateRelationFormView;
});