/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/models/form", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "i18n!d2/dialogs/ba.actions.comments.dialog/impl/nls/lang", "hbs!d2/dialogs/ba.actions.comments.dialog/impl/ba.actions.comments", "css!d2/dialogs/ba.actions.comments.dialog/impl/ba.actions.comments" ], function($, _, Backbone, Marionette, FormModel, WizardTabableRegionBehavior, D2FormView, MetadataConverter, lang, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-ba-comments-view",
    constructor: function BaCommentsView(options) {
      options || (options = {});
      this.options = options;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.formView = this._getBaCommentsForm(this._checkBAComments(this.options));
      this.formView.listenTo(this.formView, "valid:field", this.formView._raiseValidChangeEvent);
      this.formView.listenTo(this.formView, "invalid:field", this.formView._raiseInvalidChangeEvent);
      this.formView.listenTo(this.formView, "render:form", function() {
        if (this.formView.form?.childrenByPropertyId["ba_comments"]) {
          this.formView.form?.childrenByPropertyId["ba_comments"].fieldView.ui.writeField.attr("tabindex", "0");
        }
      }.bind(this));
    },
    template: template,
    templateHelpers: function() {
      return {
        showMessage: this.options.showMessage,
        message: this.options.message,
        showCustomView: this.options.customView
      };
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      formRegion: ".ba-comments-form",
      customViewRegion: ".custom-view"
    },
    onShow: function() {
      if (this.isBaAction()) {
        this.formRegion.show(this.formView);
      }
      if (this.options.customView) {
        this.customViewRegion.show(this.options.customView);
      }
    },
    isBaAction: function() {
      return this.baData.isBaAction && this.baData.showComments;
    },
    _checkBAComments: function(options) {
      var isBaAction = false;
      var showComments = false;
      var commentsMandatory = false;
      options.nodes.each(function(node) {
        if (node.actions.find({
          signature: options.signature
        }).get("commandData").isBaActions === "true") {
          isBaAction = true;
        }
        if (node.actions.find({
          signature: options.signature
        }).get("commandData").showComments === "true") {
          showComments = true;
        }
        if (node.actions.find({
          signature: options.signature
        }).get("commandData").commentsMandatory === "true") {
          commentsMandatory = true;
        }
      });
      this.baData = {
        isBaAction: isBaAction,
        showComments: showComments,
        commentsMandatory: commentsMandatory
      };
      return this.baData;
    },
    _getBaCommentsForm: function(oBaData) {
      var baCommentsForm = {
        dialog: {
          content: {
            order: 1
          }
        }
      };
      if (oBaData.isBaAction) {
        if (oBaData.showComments === true) {
          baCommentsForm["dialog"]["content"]["memo"] = {
            id: "ba_comments",
            label: lang.Comment,
            order: 1
          };
          if (oBaData.commentsMandatory === true) {
            baCommentsForm["dialog"]["content"]["memo"]["condition_required"] = true;
          }
        }
      }
      var form = MetadataConverter.convertConfig(baCommentsForm, {
        actionMode: "create",
        layoutMode: "singleCol"
      });
      var options = {};
      options.topAlignedLabel = true;
      options.model = new FormModel(form.propertiesConfig[0]);
      if (oBaData.isBaAction && oBaData.showComments) {
        options.model.get("schema")["initial_invalid"] = true;
      }
      options.mode = "create";
      return new D2FormView(options);
    },
    getFormView: function() {
      return this.formView;
    },
    getValues: function() {
      return this.formView.getValues();
    }
  });
});