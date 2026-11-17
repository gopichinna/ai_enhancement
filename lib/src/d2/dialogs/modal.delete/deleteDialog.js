/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/log", "nuc/utils/base", "hbs!d2/dialogs/modal.delete/impl/deleteDialog", "i18n!d2/dialogs/modal.delete/impl/nls/lang", "csui/behaviors/keyboard.navigation/tabkey.behavior", "csui/lib/binf/js/binf", "css!d2/dialogs/modal.delete/impl/deleteDialog" ], function(module, _, $, Marionette, log, base, template, lang, TabKeyBehavior) {
  log = log(module.id);
  var ModalVersionToDeleteView = Marionette.ItemView.extend({
    className: function() {
      return "d2-version-to-delete binf-modal binf-fade";
    },
    template: template,
    ui: {
      defaultButton: ".binf-modal-footer > .csui-default"
    },
    triggers: {
      "click .csui-yes": "click:yes",
      "click .csui-no": "click:no"
    },
    events: {
      "shown.binf.modal": "onShown",
      "hide.binf.modal": "onHiding",
      "hidden.binf.modal": "onHidden",
      keydown: "onKeyDown"
    },
    behaviors: {
      TabKeyBehavior: {
        behaviorClass: TabKeyBehavior,
        recursiveNavigation: true
      }
    },
    constructor: function ModalVersionToDeleteView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      options = this.options;
      _.defaults(options, {
        showHeader: options.title !== ""
      });
      this._deferred = $.Deferred();
    },
    templateHelpers: function() {
      var templateVals = _(this.options).clone();
      templateVals.dlgTitleId = _.uniqueId("dlgTitle");
      templateVals.dlgMsgId = _.uniqueId("dlgMsg");
      templateVals.DeleteButtonLabel = lang.DeleteButtonLabel;
      templateVals.CancelButtonLabel = lang.CancelButtonLabel;
      templateVals.Links = lang.Links;
      templateVals.Folders = lang.Folders;
      templateVals.Files = lang.Files;
      templateVals.DeleteFileAndLinks = lang.DeleteFileAndLinks;
      templateVals.DeleteFolderAndDecendants = lang.DeleteFolderAndDecendants;
      templateVals.DeleteFileAndVersions = lang.DeleteFileAndVersions;
      templateVals.DeleteVDocAndDecendants = lang.DeleteVDocAndDecendants;
      templateVals.DeleteSearchGroupAndDescendants = lang.DeleteSearchGroupAndDescendants;
      templateVals.showMultiLinkSeparator = this.options.isMultiLink && (this.options.isContainer || this.options.isFile || this.options.isVirtualDoc);
      templateVals.showFolderSeparator = this.options.isContainer && (this.options.isFile || this.options.isVirtualDoc);
      return templateVals;
    },
    show: function() {
      this.render();
      this.$el.attr("tabindex", 0);
      this.centerVertically();
      this.$el.binf_modal("show");
      this.triggerMethod("show");
      var promise = this._deferred.promise(), self = this;
      promise.close = function() {
        self.$el.binf_modal("hide");
        return promise;
      };
      return promise;
    },
    centerVertically: function() {
      var $clone;
      var top;
      $clone = this.$el.clone();
      $clone.css("display", "block");
      $clone.appendTo($.fn.binf_modal.getDefaultContainer());
      top = Math.round(($clone.height() - $clone.find(".binf-modal-content").height()) / 2);
      top = top > 0 ? top : 0;
      $clone.remove();
      this.$el.find(".binf-modal-content").css("margin-top", top);
    },
    onShown: function() {
      this._deferred.notify({
        state: "shown"
      });
      this._setTabFocus(false);
    },
    onHiding: function() {
      this._deferred.notify({
        state: "hiding"
      });
    },
    onHidden: function() {
      var deleteFileAndLinks, deleteFolderAndDecendants, deleteFileAndVersions, deleteVDocAndDecendants, deleteSearchGroupAndDescendants;
      if (this._result) {
        if (this.options.isMultiLink) {
          deleteFileAndLinks = $("#delete-file-and-links").prop("checked");
        }
        if (this.options.isContainer) {
          deleteFolderAndDecendants = $("#delete-folder-and-decendants").prop("checked");
        }
        if (this.options.isFile) {
          deleteFileAndVersions = $("#delete-file-and-versions").prop("checked");
        }
        if (this.options.isVirtualDoc) {
          deleteVDocAndDecendants = $("#delete-vdoc-and-decendants").prop("checked");
        }
        if (this.options.isSavedSearchCategory) {
          deleteSearchGroupAndDescendants = $("#delete-search-group-and-descendants").prop("checked");
        }
      }
      this.destroy();
      if (this._result) {
        this._deferred.resolve({
          deleteFileAndLinks: deleteFileAndLinks,
          deleteFolderAndDecendants: deleteFolderAndDecendants,
          deleteFileAndVersions: deleteFileAndVersions,
          deleteVDocAndDecendants: deleteVDocAndDecendants,
          deleteSearchGroupAndDescendants: deleteSearchGroupAndDescendants
        });
      } else {
        this._deferred.reject(this._result);
      }
    },
    onKeyDown: function(event) {
      var keyCode = event.keyCode;
      switch (keyCode) {
       case 13:
        if (event.target === this.el) {
          this.ui.defaultButton.trigger("click");
        } else {
          $(event.target).trigger("click");
        }
        break;

       case 9:
        return this._setTabFocus(event.shiftKey);
      }
    },
    onClickYes: function() {
      this._result = true;
    },
    onClickNo: function() {
      this._result = false;
    },
    _setTabFocus: function(tabShift) {
      var tabElements = this.$("*[tabindex=0]"), lastIndex = tabElements.length - 1, i = this._getStartIndex(lastIndex, tabShift, tabElements);
      if (lastIndex > -1) {
        var activeIndex = this.activeIndex !== undefined ? this.activeIndex : tabShift ? 0 : lastIndex;
        do {
          var $tabElem = $(tabElements[i]);
          if (base.isVisibleInWindowViewport($tabElem)) {
            this.activeIndex = i;
            $tabElem.trigger("focus");
            break;
          }
          if (tabShift) {
            i = i === 0 ? lastIndex : i - 1;
          } else {
            i = i === lastIndex ? 0 : i + 1;
          }
        } while (i !== activeIndex);
      }
      return false;
    },
    _getStartIndex: function(lastIndex, tabShift) {
      var startIndex = 0, activeIndex = this.activeIndex;
      if (tabShift) {
        startIndex = lastIndex;
        if (activeIndex !== undefined && activeIndex > 0) {
          startIndex = this.activeIndex - 1;
        }
      } else {
        if (activeIndex !== undefined && activeIndex < lastIndex) {
          startIndex = activeIndex + 1;
        }
      }
      return startIndex;
    }
  }, {
    confirmQuestion: function(title, options) {
      options = this._makeOptions(arguments, {
        title: lang.DefaultQuestionTitle
      });
      return this._show(options);
    },
    _makeOptions: function(parameters, defaultOptions) {
      var title = parameters[0], options = parameters[1];
      options = _.defaults({
        title: title
      }, options);
      return _.defaults(options, defaultOptions);
    },
    _show: function(options) {
      return new ModalVersionToDeleteView(options).show();
    }
  });
  return ModalVersionToDeleteView;
});