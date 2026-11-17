/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/dialogs/modal.alert/modal.alert", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/themes/csui.jato.branding.icons", "i18n!csui/controls/image.picker/impl/nls/lang", "hbs!csui/controls/image.picker/impl/image.picker.view", "css!csui/controls/image.picker/impl/image.picker.view" ], function($, _, Marionette, ModalAlert, theming, jatoIcons, jatoBrandingIcons, lang, template) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "csui-image-picker",
    template: template,
    templateHelpers: function() {
      return {
        brandingDefaultLogo: jatoBrandingIcons.brandingOtLogoShort,
        uploadLabel: lang.upload,
        helpText: lang.helpText,
        uploadAria: `${lang.uploadAria} ${lang.helpText}`,
        logoImageId: _.uniqueId("csui-logo-upload"),
        iconSVG: jatoIcons.actionUpload,
        isJATO: this.isJATO,
        hideNewImgComponent: !this.prevLogoDetails?.brandLogoUri || typeof this.prevLogoDetails?.brandLogoUri == "number",
        theme: this.model.get("options")?.theme
      };
    },
    ui: {
      imgComponent: ".csui-logo-image",
      newImgComponent: ".csui-newLogo-image",
      defaultImgComponent: "div.csui-default-image-logo",
      uploadcomponent: ".csui-logo-upload-input",
      uploadcomponentArea: ".csui-logo-btns",
      uploadButtonJato: ".csui-logo-upload-button"
    },
    events: {
      "change @ui.uploadcomponent": "uploadNewLogo",
      "keydown @ui.uploadcomponentArea": "keydownUpload",
      "click @ui.uploadButtonJato": "clickUpload"
    },
    constructor: function ImagePickerFieldView(options = {}) {
      this.supportedTypes = [ "image/jpeg", "image/jpg", "image/png" ];
      this.prevLogoDetails = options.imgData;
      this.newLogoImage = "";
      this.logoImageNode = "";
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.isJATO = theming.isJATOTheme();
    },
    onShow: function(view) {
      this.ui.uploadcomponent.attr("accept", this.supportedTypes.join());
      if (!this.prevLogoDetails?.brandLogoUri || typeof this.prevLogoDetails?.brandLogoUri == "number") return;
      this.updateNewImageLogo(this.prevLogoDetails.brandLogoUri);
    },
    uploadNewLogo: function() {
      let file = this.ui.uploadcomponent[0].files;
      if (file.length) {
        this.newLogoImage = URL.createObjectURL(new Blob(file));
        const data = {
          logo: this.newLogoImage,
          fileDetails: file?.[0]
        };
        this.fileValidation(data);
      }
    },
    fileValidation: function(data) {
      if (!this.validateFileSize(data) || !this.validateFileType(data)) {
        ModalAlert.showError(function() {}, lang.uploadFailedMessage, lang.uploadFailedTitle, {});
        this.ui.uploadcomponent[0].value = null;
        return false;
      } else {
        this.trigger("change", data);
        this.updateNewImageLogo(data.logo);
      }
    },
    validateFileSize: function(data) {
      let fileSize = parseFloat(data.fileDetails.size / 1024).toFixed(2), validFileSize = fileSize > 500 ? false : true;
      return validFileSize;
    },
    validateFileType: function(data) {
      let fileType = data.fileDetails.type, validFileType = this.supportedTypes.indexOf(fileType) > -1;
      return validFileType;
    },
    clickUpload: function() {
      this.ui.uploadcomponent.trigger("click");
    },
    keydownUpload: function(event) {
      if (event.type === "keypress" || (event.keyCode === 13 || event.keyCode === 32)) {
        this.ui.uploadcomponent.trigger("click");
      }
    },
    updateNewImageLogo: function(url) {
      if (url) {
        let backgroundImageStyle = `background-image: url(${url});`;
        this.ui.imgComponent.css("display", "none");
        this.ui.newImgComponent.attr("style", backgroundImageStyle);
        this.ui.newImgComponent.css("display", "block");
        this.ui.defaultImgComponent.css("display", "none");
      } else {
        this.ui.newImgComponent.css("display", "none");
        this.ui.defaultImgComponent.css("display", "block");
        this.trigger("change");
      }
    }
  });
});