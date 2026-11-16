/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        showConfirmationDialog: function(options) {
          const deferred = $.Deferred();
          var self = this;
          require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/ba.actions.comments.dialog/ba.actions.comments.view", "csui/controls/form/pub.sub" ], function(ModalAlert, BaCommentsView, PubSub) {
            var baCommentsView = new BaCommentsView({
              signature: options.signature,
              message: options.message,
              nodes: options.nodes,
              showMessage: options.showMessage,
              customView: options.customView
            });
            var className = "ba-comments-dialog";
            className = options.modalClass ? className + " " + options.modalClass : className;
            function getYesButton() {
              var $modelContent = baCommentsView.$el.closest(".binf-modal-content");
              return $modelContent.find(".binf-modal-footer .csui-yes");
            }
            function enableYesButtton() {
              var $delegateButton = getYesButton();
              $delegateButton.removeAttr("disabled");
            }
            function disableYesButtton() {
              var $delegateButton = getYesButton();
              $delegateButton.attr("disabled", "disabled");
            }
            function onFieldValueUpdate() {
              var baComments = baCommentsView.getValues()["ba_comments"];
              if (baCommentsView.isBaAction()) {
                options["ba_data"] = {
                  comment: baComments
                };
              }
              var validateNote = true;
              if (baCommentsView?.baData?.commentsMandatory) {
                validateNote = baComments !== "";
              }
              if (validateNote) {
                enableYesButtton();
              } else {
                disableYesButtton();
              }
              if (!baCommentsView.formView.validate()) {
                disableYesButtton();
              }
            }
            if (baCommentsView.isBaAction()) {
              self.listenToOnce(baCommentsView.getFormView(), "render:form", disableYesButtton);
              self.listenToOnce(PubSub, "dctm:custom:modal:alert:show", disableYesButtton);
              baCommentsView.getFormView().on("d2:change:formValidation", onFieldValueUpdate);
            }
            var modelDeffered = ModalAlert.confirmQuestion(function(result) {
              if (result) {
                deferred.resolve(options["ba_data"]);
              } else {
                deferred.reject();
              }
            }, "", options.labelTitle, {
              buttons: {
                showYes: true,
                labelYes: options.labelYes,
                showNo: false,
                showCancel: true
              },
              contentView: baCommentsView,
              className: className
            });
            modelDeffered.progress(function(options) {
              if (options) {
                if (options.state === "shown") {
                  deferred.notify({
                    state: "shown"
                  });
                }
              }
            });
          }, deferred.reject);
          return deferred;
        }
      });
    }
  };
});