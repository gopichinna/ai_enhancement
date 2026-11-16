/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/nodes", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/nodesprites", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/document.esignature.dialog/document.esignature.form.view", "i18n!d2/dialogs/document.external.esign.dialog/impl/nls/lang", "hbs!d2/dialogs/document.external.esign.dialog/impl/document.external.esign.dialog", "hbs!d2/dialogs/document.external.esign.dialog/impl/document.external.esign.doc", "css!d2/dialogs/document.external.esign.dialog/impl/document.external.esign.dialog" ], function(_, $, Backbone, Marionette, NodeCollection, NodeTypeIconView, PerfectScrollingBehavior, NodeSpriteCollection, WizardTabableRegionBehavior, DocumentESignatureFormView, lang, template, docTemplate) {
  "use strict";
  var DocumentExternalEsignDialogView = Marionette.LayoutView.extend({
    className: "d2-document-external-esign-dialog",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-document-external-esign-dialog-container",
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      formContainer: ".d2-document-esign-form-container",
      childViewContainer: ".d2-document-esign-file-container",
      currentFileContainer: ".d2-document-esign-file-select-container"
    },
    ui: {
      fileContainer: ".d2-document-esign-file-container",
      validationContainer: ".d2-document-external-file-message-error-banner",
      ValidationText: ".d2-document-doc-message-error"
    },
    events: {
      keydown: "onKeyDown"
    },
    templateHelpers: function() {
      return {
        fileName: this.model && this.model.get("name"),
        esignEachDoc: this.options.esignEachDoc && this.options.workingCollection.length > 1,
        customMessage: this.options.customMessage
      };
    },
    constructor: function DocumentExternalEsignDialogView(options) {
      options = options || {};
      this.model = options.model;
      this.currentNode = options.node;
      this.showFile = !!this.model;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this._setupChildViews();
      this.listenTo(this, "step:active", _.bind(this._setFocus, this));
      this.listenTo(this, "refresh", _.bind(this._triggerChangeMethod, this));
    },
    _setFocus: function() {
      if (this._isRendered) {
        var control = this.formView.form && this.formView.form.childrenByPropertyId && this.formView.form.childrenByPropertyId["signoff_intentions"], fieldView = control && control.fieldView;
        fieldView && fieldView.ui.writeField && fieldView.ui.writeField.trigger("focus");
      } else {
        this.listenTo(this, "step:rendered", _.bind(this._setFocus, this));
      }
    },
    getItemModel: function() {
      return this.currentNode;
    },
    _setupChildViews: function() {
      this._setupFormView();
      this._fetchDocToSign();
      this._setupListView();
      this._setupCurrentDocView();
      this._setSubTitle();
    },
    _setupFormView: function() {
      this.formView = new DocumentESignatureFormView(_.extend(this.options, {
        dialogView: this,
        model: this.model
      }));
    },
    _setupListView: function() {
      this.listingView = new DocumentExternalEsignDocListView(_.extend(this.options, {
        collection: this._getCollection(this.options.workingCollection)
      }));
    },
    _setupCurrentDocView: function() {
      this.currentFileView = new DocumentExternalEsignDocView({
        icon: NodeSpriteCollection.findClassByNode(this.model),
        model: this.model,
        name: this.model.get("name") || this.model.get("object_name"),
        successMessage: lang.ESignSuccessMessage,
        externalSigned: this.model.get("external-esigned")
      });
    },
    _triggerChangeMethod: function() {
      this.updateWorkingFileESignStatus();
      this.listingView.addCompletedDoc(this.model);
      this._fetchDocToSign();
      this._setupFormView();
      this._setupCurrentDocView();
      this._setSubTitle();
      this.onShow();
    },
    onShow: function() {
      this._showChildViews();
      this._clearError();
    },
    _showChildViews: function() {
      this.formContainer.show(this.formView);
      if (this.options.esignEachDoc) {
        this.childViewContainer.show(this.listingView);
        this.currentFileContainer.show(this.currentFileView);
      }
    },
    getAllFormValues: function() {
      return this.formView.getValues();
    },
    isValid: function() {
      if (this.isFormValid === false) {
        return this.isFormValid;
      }
      return this.formView.isValidForm();
    },
    onKeyDown: function(event) {
      if (event.which === 13 && this.formView.$form.has(event.target).length) {
        if (!this.options.wizard.blockingParentView || this.options.wizard.blockingParentView && this.options.wizard.blockingParentView._blockingCounter < 1) {
          this._executeEnter();
        }
      }
    },
    _executeEnter: _.throttle(function() {
      if (this.options.wizard && this.options.wizard.footerView) {
        var nextButton = this.options.wizard.footerView.$el.find(".btn-primary");
        !nextButton.prop("disabled") && setTimeout(function() {
          nextButton.trigger("click");
        });
      }
    }, 100, {
      trailing: false
    }),
    _getCollection: function(collection) {
      var retCollection = _.filter(collection.models, function(model) {
        return model.get("external-esigned");
      });
      return new NodeCollection(retCollection);
    },
    _fetchDocToSign: function() {
      var index = -1, model = null;
      _.find(this.options.workingCollection.models, function(modelItem, idx) {
        if (!modelItem.get("external-esigned") && index === -1) {
          index = idx;
          model = modelItem;
        }
      });
      if (index !== -1) {
        this.index = index;
        this.model = model;
      }
    },
    _setSubTitle: function() {
      var fileCount = this.options.workingCollection.length, subTitle = _.str.sformat(lang.DocumentESignSubTitle, fileCount);
      if (this.options.esignEachDoc) {
        subTitle = _.str.sformat(lang.DocumentESignEachDocumentSubtitle, this.index + 1, fileCount);
      }
      if (fileCount === 1) {
        subTitle = (this.model || this.options.workingCollection.at(0)).get("name");
      }
      if (this.options.wizard.steps["document_external_esign"]) {
        this.options.wizard.steps["document_external_esign"].subTitle = subTitle;
      }
      this.options.wizard.headerView.triggerMethod("dom:refresh");
    },
    _setFileName: function() {
      if (this.options.esignEachDoc && this.ui.fileNameContainer && this.model) {
        this.ui.fileNameContainer.text(this.model && this.model.get("name"));
      }
    },
    updateWorkingFileESignStatus: function() {
      this.options.workingCollection.get(this.model).set("external-esigned", true);
    },
    _clearError: function() {
      this.ui.validationContainer.hide();
    },
    setError: function(data) {
      if (data) {
        this.ui.validationContainer.show();
        this.ui.ValidationText.text(data.message);
      }
    }
  });
  var DocumentExternalEsignDocView = Marionette.ItemView.extend({
    className: "d2-document-esignature-doc-container",
    template: docTemplate,
    templateHelpers: function() {
      return {
        name: this.options.name,
        icon: this.options.icon,
        successMessage: this.options.successMessage,
        externalSigned: this.options.externalSigned
      };
    },
    constructor: function DocumentExternalEsignDocView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
  var DocumentExternalEsignDocListView = Marionette.CollectionView.extend({
    childView: DocumentExternalEsignDocView,
    className: "d2-document-esign-file-list-container",
    emptyView: false,
    childViewOptions: function(model) {
      return {
        icon: NodeSpriteCollection.findClassByNode(model),
        model: model,
        name: model.get("name") || model.get("object_name"),
        successMessage: lang.ESignSuccessMessage,
        externalSigned: model.get("external-esigned")
      };
    },
    constructor: function DocumentExternalEsignDocListView(options) {
      this.collection = options.collection;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },
    addCompletedDoc: function(model) {
      this.collection.add(model);
    }
  });
  return DocumentExternalEsignDialogView;
});