/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette3", "smart/controls/dialog/dialog.view", "hbs!smart/controls/image.cropper/impl/crop.edit", "i18n!smart/controls/image.cropper/impl/nls/lang", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/bundles/cropperjs/cropper", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/image.cropper/impl/crop.edit", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(module, _, $, Marionette, SmartDialogView, template, lang, TabableRegionBehavior, Cropper, theming, jatoIcons) {
  var CropEditView = Marionette.View.extend({
    template: template,
    tagName: "div",
    className: "smart-crop-canvas",
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      resetBtn: ".smart-crop-reset",
      rotateBtn: ".smart-crop-rotate",
      zoomInBtn: ".smart-crop-zoom-in",
      zoomOutBtn: ".smart-crop-zoom-out",
      toolbarBtns: ".smart-toolbar-btn",
      percentageTxt: ".smart-zoom-percentage-text"
    },
    events: {
      "click @ui.resetBtn": "_revertClick",
      "click @ui.rotateBtn": "_rotateClick",
      "click @ui.zoomInBtn": "_zoomInClick",
      "click @ui.zoomOutBtn": "_zoomOutClick",
      "keydown @ui.toolbarBtns": "_toolbarKeydown"
    },
    templateContext: function() {
      let isJATO = theming.isJATOTheme();
      return {
        isJATO: isJATO,
        resetIcon: jatoIcons.actionSync,
        resetTxt: lang.revertLabel,
        resetAriaLabel: lang.revertAriaLabel,
        rotateIcon: jatoIcons.actionRotate,
        rotateTxt: lang.rotateLabel,
        rotateAriaLabel: lang.rotateAriaLabel,
        zoomInIcon: jatoIcons.actionZoomIn,
        zoomInTxt: lang.zoomInLabel,
        zoomInAriaLabel: lang.zoomInAriaLabel,
        zoomOutIcon: jatoIcons.actionZoomOut,
        zoomOutTxt: lang.zoomOutLabel,
        zoomOutAriaLabel: lang.zoomOutAriaLabel,
        zoomTxt: lang.zoomTxt
      };
    },
    constructor: function CropEditView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.zoomCount = 0;
      this.listenTo(this, "crop:ready", this._cropImage);
    },
    _cropImage: function() {
      var file = this.options.file;
      var reader = new FileReader();
      var self = this;
      this.zoomPercent = 100;
      this.cropper = "";
      reader.onload = function(e) {
        let img = document.createElement("img");
        img.src = e.target.result;
        let image = new Image();
        image.src = e.target.result;
        image.onload = function() {
          if (this.height >= this.width) {
            self.el.classList.add("smart-crop-height");
          } else {
            self.el.classList.add("smart-crop-width");
          }
        };
        let cropBoxData, canvasData;
        img.id = "image";
        img.classList.add("binf-hidden");
        self.el.querySelector("div.smart-crop-body").innerHTML = "";
        self?.el?.querySelector("div.smart-crop-body")?.appendChild(img);
        let imgDragable = self.options.isImgDragable ? "move" : "";
        require([ "css!smart/bundles/cropperjs/cropper" ], function() {
          self.cropper = new Cropper(img, {
            viewMode: 1,
            background: false,
            autoCropArea: 1,
            cropBoxMovable: !self.options?.isImgDragable,
            dragMode: imgDragable,
            ...self.options?.roundedCropbox && {
              aspectRatio: 1 / 1
            },
            ready: function() {
              self.cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData);
              let cropBoxEle = self.cropper.cropBox;
              self.cropBox = cropBoxEle;
              self._adjustCropBox();
              cropBoxEle.setAttribute("aria-label", lang.cropBoxAriaLabel);
              cropBoxEle.setAttribute("aria-describedby", "smart-zoom-txt-id");
              cropBoxEle.setAttribute("tabindex", "0");
              self.trigger("refresh:tabindexes");
              cropBoxEle.focus();
              cropBoxEle.addEventListener("keydown", _.bind(self._onKeyDown, self));
              img.addEventListener("zoom", _.bind(e => {
                let canvasHeight = self.cropper.canvas.style.height;
                let canvasWidth = self.cropper.canvas.style.width;
                let zoomDiff = e?.detail?.ratio - e?.detail?.oldRatio;
                let zoomPercentage = self.zoomPercent;
                if (zoomPercentage == 1) {
                  zoomPercentage = 0;
                }
                if (zoomDiff > 0) {
                  zoomPercentage = zoomPercentage + 3.5;
                } else {
                  zoomPercentage = zoomPercentage - 3.5;
                }
                if (zoomPercentage < 100) {
                  if (canvasHeight == self.cropBox.style.height || canvasWidth == self.cropBox.style.width) {
                    zoomPercentage = self.zoomPercent;
                  }
                }
                if (zoomPercentage < 0) {
                  zoomPercentage = 1;
                  e.preventDefault();
                  e.stopPropagation();
                }
                self.ui.percentageTxt[0].innerHTML = Math.floor(zoomPercentage) + "%";
                self.zoomPercent = zoomPercentage;
              }, self));
            }
          });
        });
      };
      reader.readAsDataURL(file);
    },
    _adjustCropBox: function() {
      let self = this;
      let cropBoxEle = self.cropper.cropBox;
      let cropBoxEleHeight = cropBoxEle.style.height;
      let cropBoxEleWidth = cropBoxEle.style.width;
      if (!self.options?.roundedCropbox) {
        cropBoxEleHeight = parseFloat(cropBoxEleHeight, 10);
        cropBoxEleWidth = parseFloat(cropBoxEleWidth, 10);
        let centerX = self.cropper.canvasData.width / 2;
        let centerY = self.cropper.canvasData.height / 2;
        if (cropBoxEleHeight > cropBoxEleWidth) {
          self.cropper.setCropBoxData({
            height: cropBoxEleWidth
          });
          let topY = centerY - parseFloat(cropBoxEle.style.height, 10) / 2;
          self.cropper.setCropBoxData({
            top: self.cropper.cropBoxData.minTop + topY
          });
        } else {
          self.cropper.setCropBoxData({
            width: cropBoxEleHeight
          });
          let leftX = centerX - parseFloat(cropBoxEle.style.width, 10) / 2;
          self.cropper.setCropBoxData({
            left: self.cropper.cropBoxData.minLeft + leftX
          });
        }
      }
    },
    _dataURItoBlob: function(dataURI) {
      var byteString = atob(dataURI.split(",")[1]);
      var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
      const contentType = "image/png";
      var arrayBuffer = new ArrayBuffer(byteString.length);
      var intArray = new Uint8Array(arrayBuffer);
      for (var i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
      }
      var blob = new Blob([ arrayBuffer ], {
        type: contentType
      });
      return blob;
    },
    saveClick: function() {
      let blob = this._dataURItoBlob(this?.cropper?.getCroppedCanvas()?.toDataURL());
      let imgSrc = this?.cropper?.getCroppedCanvas()?.toDataURL();
      let resultObj = {
        blob: blob,
        imgSrc: imgSrc
      };
      this?.cropper?.destroy();
      this?.options?.leadingView?.trigger("destroy:dialog");
      this?.options?.leadingView?.trigger("crop:save", resultObj);
    },
    currentlyFocusedElement: function(arg) {
      if (this.$el) {
        return this?.$el?.find(".cropper-crop-box");
      }
    },
    onLastTabElement: function(shiftTab, event) {
      if (!event.shiftKey) {
        return this?.$el?.find(".smart-toolbar-btn") && event?.target === this?.$el?.find(".smart-toolbar-btn")[0];
      } else {
        return event?.target?.isSameNode(this.$el.find(".cropper-crop-box")[0]);
      }
    },
    isTabable: function() {
      return true;
    },
    _onKeyDown: function(e) {
      switch (e.keyCode) {
       case 9:
        if (!e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          this?.$el?.find(".smart-toolbar-btn")[0]?.setAttribute("tabindex", "0");
          this?.$el?.find(".smart-toolbar-btn")[0]?.focus();
        }
        break;

       case 37:
        e.preventDefault();
        e.stopPropagation();
        this._moveLeftClick();
        break;

       case 40:
        e.preventDefault();
        e.stopPropagation();
        this._moveDownClick();
        break;

       case 39:
        e.preventDefault();
        e.stopPropagation();
        this._moveRightClick();
        break;

       case 38:
        e.preventDefault();
        e.stopPropagation();
        this._moveUpClick();
        break;

       case 107:
        e.preventDefault();
        e.stopPropagation();
        this._zoomInClick();
        break;

       case 187:
        if (!!e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          this._zoomInClick();
        }
        break;

       case 109:
        e.preventDefault();
        e.stopPropagation();
        this._zoomOutClick();
        break;

       case 189:
        e.preventDefault();
        e.stopPropagation();
        this._zoomOutClick();
        break;
      }
    },
    _toolbarKeydown: function(e) {
      if (e.keyCode === 9) {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          this?.cropBox?.focus();
        } else {
          e.preventDefault();
          e.stopPropagation();
          this?.options?.leadingView?.dialogView?.el?.querySelector(".smart-crop-save-btn")?.focus();
        }
      }
    },
    _moveLeftClick: function() {
      this?.cropper?.move(10, 0);
    },
    _moveRightClick: function() {
      this?.cropper?.move(-10, 0);
    },
    _moveDownClick: function() {
      this?.cropper?.move(0, -10);
    },
    _moveUpClick: function() {
      this?.cropper?.move(0, 10);
    },
    _adjustImageOnRotate: function() {
      let cropper = this.cropper;
      const imgData = cropper.getImageData();
      const containerData = cropper.getContainerData();
      const isVertImg = imgData.naturalWidth > imgData.naturalHeight;
      const buffer = 1;
      if (isVertImg && [ 90, 270, -90, -270 ].includes(imgData.rotate)) {
        const canvasData = cropper.getCanvasData();
        cropper.setCropBoxData({
          left: canvasData.left,
          top: canvasData.top,
          width: canvasData.height,
          height: canvasData.width
        });
        const height = Math.min(imgData.width, imgData.naturalWidth);
        cropper.scale(containerData.height / height * buffer);
      } else {
        cropper.scale(1);
      }
    },
    _zoomInClick: function() {
      this?.cropper?.zoom(.1);
      this.zoomCount = this.zoomCount + 1;
    },
    _zoomOutClick: function() {
      this?.cropper?.zoom(-.1);
      this.zoomCount = this.zoomCount - 1;
    },
    onDestroy: function() {},
    _revertClick: function() {
      this?.cropper?.reset();
      this.zoomCount = 0;
      this.zoomPercent = 100;
      this.ui.percentageTxt[0].innerHTML = 100 + "%";
      this._adjustCropBox();
    },
    _rotateClick: function() {
      let roateData = this?.cropper?.getImageData()?.rotate;
      if ((roateData + 90) % 360 === 0) {
        this?.cropper?.reset();
        this.zoomPercent = 100;
        this.ui.percentageTxt[0].innerHTML = 100 + "%";
      } else {
        this?.cropper?.rotate(90);
      }
    }
  });
  var ImageCropperView = Marionette.View.extend({
    template: false,
    constructor: function ImageCropperView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      let editView = new CropEditView({
        file: this.options.photo,
        leadingView: this,
        roundedCropbox: this.options?.roundedCropbox ?? false,
        isImgDragable: this.options?.isImgDragable ?? true
      });
      let classString = "smart-crop " + (this.options?.dialogClassName ? this.options.dialogClassName : "");
      classString = classString + " " + (this.options?.roundedCropbox ? "smart-user-profile-crop-dialog" : "");
      let dialog = new SmartDialogView({
        view: editView,
        title: this?.options?.dialogTitle ?? lang.title,
        className: classString,
        buttons: [ {
          label: lang.saveLabel,
          variant: "primary",
          className: "smart-crop-save-btn",
          click: _.bind(editView.saveClick, editView)
        } ]
      });
      this.dialogView = dialog;
      dialog.show();
      editView?.listenTo(dialog, "after:show", () => {
        editView.trigger("crop:ready");
        dialog?.footerView?.el?.querySelector(".smart-crop-save-btn")?.addEventListener("keydown", e => {
          if (e.keyCode === 9 && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            editView?.$el?.find(".smart-toolbar-btn")[0]?.setAttribute("tabindex", "0");
            editView?.$el?.find(".smart-toolbar-btn")[0].focus();
          }
        });
      });
      this.listenTo(this, "destroy:dialog", () => {
        dialog?.triggerMethod("destroy");
      });
      this.listenTo(dialog, "after:destroy", () => {
        editView?.destroy();
        this.trigger("crop:dialog:destroy");
      });
    }
  });
  return ImageCropperView;
});