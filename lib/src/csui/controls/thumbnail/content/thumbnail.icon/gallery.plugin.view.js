/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/models/nodes", "csui/controls/thumbnail/content/thumbnail.icon/util/gallery.view", "i18n!csui/controls/thumbnail/content/thumbnail.icon/impl/nls/localized.strings", "csui/controls/dialog/dialog.view", "csui/utils/log", "csui/utils/commands/download", "csui/utils/taskqueue", "csui/utils/thumbnail/thumbnail.object", "csui/lib/exif" ], function(module, _, $, Marionette, NodeCollection, GalleryView, lang, DialogView, log, DownloadCommand, TaskQueue, Thumbnail, EXIF) {
  "use strict";
  log = log(module.id);
  var galleryView;
  var config = module.config();
  _.defaults(config, {
    parallelism: 3,
    streaming: false
  });
  var disableMultipleClicks = false;
  var GalleryPluginView = Marionette.ItemView.extend({
    className: "gallery-container",
    template: false,
    constructor: function GalleryPluginView(options) {
      options.data || (options.data = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
      config.streaming = config.streaming || this.options.streaming;
    },
    resetDisableMultipleClicks: function() {
      disableMultipleClicks = false;
    },
    onRender: function() {
      var self = this;
      var thumbNailCollection = this.options.thumbNailCollection;
      var thumbnailGalleryData = [], currentItemIndex = 0;
      this.model = this.options.model;
      this.imageCount = 0;
      this.fetchGalleryImageURL(thumbNailCollection);
      this.getThumbnailContentUrl(thumbNailCollection);
      self.thumbNailCollection = thumbNailCollection;
      _.each(thumbNailCollection, function(model, idx) {
        var originalAvailable;
        if (config.streaming && model.contentURL || model.contentFetched) {
          originalAvailable = true;
        } else {
          originalAvailable = false;
        }
        var thumbnailData = {
          name: model.get("name"),
          contentURL: model.contentURL ? model.contentURL : model.thumbnail ? model.thumbnail.imgUrl : "",
          thumbnailURL: model.thumbnail && model.thumbnail.imgUrl ? model.thumbnail.imgUrl : model.contentURL ? model.contentURL : "",
          id: model.cid,
          index: idx,
          activeItem: model.get("id") === self.model.get("id"),
          downloadItem: self.downloadItem.bind(null, model),
          executeDefaultAction: self.executeDefaultAction.bind(null, self),
          updateScroll: self.updateScroll.bind(null, self),
          isVideo: model.get("mime_type").match(/^video\/*[-.\w\s]*$/g),
          videoType: model.get("mime_type"),
          model: model,
          videoNotSupportMsg: lang.videoNotSupportMsg,
          originalAvailable: originalAvailable,
          thumbnailAvailable: model.thumbnail && model.thumbnail.imgUrl ? true : false,
          streaming: config.streaming,
          closeDialog: self.closeDialog.bind(null, self)
        };
        if (model.get("id") === self.model.get("id")) {
          currentItemIndex = idx;
        }
        thumbnailGalleryData.push(thumbnailData);
      }, self);
      var galleryContainer = GalleryView.createGalleryContainer({
        galleryData: thumbnailGalleryData,
        currentItemIndex: currentItemIndex,
        lang: lang,
        view: this,
        onlyVideos: self.imageCount === 0
      }), galleryView = new GalleryContentView({
        el: galleryContainer[0]
      }), dialog = new DialogView({
        title: "",
        headerView: "",
        view: galleryView,
        className: "csui-thumbcarousel-dialog " + (self.options.customStyle ? self.options.customStyle : ""),
        userClassName: "",
        fullSize: true
      });
      if (!disableMultipleClicks) {
        dialog.show();
        disableMultipleClicks = true;
      } else {
        self.options.originatingView && self.options.originatingView.blockingView && self.options.originatingView.blockingView.disable();
        return false;
      }
      var dialogLabelElemId = _.uniqueId("dialogLabelId"), dialogHeaderTitle = dialog.headerView.$el.find(".binf-modal-title");
      if (dialogHeaderTitle) {
        dialogHeaderTitle.attr("id", dialogLabelElemId);
        dialogHeaderTitle.html(lang.GalleyViewTitle);
        dialog.headerView.$el.attr("aria-labelledby", dialogLabelElemId);
      }
      dialog.headerView.$el.find(".cs-icon-cross").removeClass("cs-icon-cross").addClass("icon-close-gallery");
      dialog.$el.find(".cs-close").on("keydown click", _.bind(this.handleShiftKey, this));
      self.options.originatingView && self.options.originatingView.blockingView && self.options.originatingView.blockingView.disable();
      self.galleryView = galleryView;
      self.dialogView = dialog;
      self.dialogView.on("destroy", _.bind(this.resetDisableMultipleClicks, this));
      var activeThumbnail = galleryContainer.find(".csui-preview-carousal .binf-active");
      setTimeout(function() {
        GalleryView.updateSlide(self.options.event, activeThumbnail);
        self.updateFilmStrip(thumbNailCollection);
      }, 200);
    },
    handleShiftKey: function(event) {
      var shiftKey = event.shiftKey;
      if (event.shiftKey && event.keyCode === 9) {
        var cid = this.thumbNailCollection[this.thumbNailCollection.length - 1].cid;
        setTimeout(function() {
          $(".binf-filmstrip-item-" + cid).trigger("focus");
        }, 200);
      }
      disableMultipleClicks = false;
    },
    downloadItem: function(nodeModel, event) {
      new DownloadCommand().execute({
        nodes: new NodeCollection([ nodeModel ])
      });
    },
    closeDialog: function(self, event) {
      self.dialogView.triggerMethod("click:close", event);
    },
    executeDefaultAction: function(self) {
      self.listenTo(self.options.originatingView, "destroy:gallery", function() {
        self.dialogView.$el.find(".cs-close").click();
      });
      self?.options?.originatingView?.thumbnail?.trigger("execute:defaultAction", self.model);
    },
    updateScroll: function(view, element, currentItem) {
      galleryView = view.galleryView;
      if (!currentItem.model.contentFetching) {
        view._fetchImageOpenURL(currentItem.model);
      }
      view.galleryView.updateScrollbar(element);
    },
    getThumbnailContentUrl: function(thumbNailCollection) {
      _.each(thumbNailCollection, function(node) {
        if (node.get("type") === 144 && node.get("mime_type").match(/^video\/!*[-.\w\s]*$/g)) {
          if (!node.thumbnail) {
            node.thumbnail = new Thumbnail({
              node: node
            });
          }
          if (!config.streaming) {
            if (!node.contentURL) {
              var photoOptionsForThumbnail = node.thumbnail.getPhotOptions(node);
              node.contentURL = photoOptionsForThumbnail.url;
            } else {
              node.addedOriginalImage = false;
            }
          } else {
            var photoOptions = node.thumbnail.getPhotOptions(node);
            node.contentURL = photoOptions.url;
          }
        }
        if (node.get("mime_type") && node.get("mime_type").match(/^image\/*[-.\w\s]*$/g)) {
          self.imageCount = self.imageCount + 1;
        }
      });
    },
    fetchGalleryImageURL: function(models) {
      if (config.streaming) {
        var self = this, queue = new TaskQueue({
          parallelism: config.parallelism
        }), promises = _.map(models, function(model) {
          var deferred = $.Deferred();
          if (!model.contentURL) {
            queue.pending.add({
              worker: function() {
                self._fetchImageOpenURL(model).done(function(node) {
                  deferred.resolve(node);
                }).fail(function(node) {
                  deferred.reject(node);
                });
                return deferred.promise();
              }
            });
          }
          return deferred.promise(promises);
        });
        return $.whenAll.apply($, promises);
      }
    },
    _fetchImageOpenURL: function(node) {
      var self = this, deferredObject = $.Deferred();
      if (!node.thumbnail) {
        node.thumbnail = new Thumbnail({
          node: node
        });
      }
      var photoOptions = node.thumbnail.getPhotOptions(node);
      if (node.get("type") === 144) {
        if (!config.streaming) {
          node.contentFetching = true;
          node.connector.makeAjaxCall(photoOptions).done(_.bind(function(response, textStatus, jqXHR) {
            node.contentURL = node.thumbnail.getContentUrl(response);
            node.addedOriginalImage = true;
            node.contentFetched = true;
            self.displayGalleryItems(node, response);
            deferredObject.resolve();
          }, this)).fail(_.bind(function(jqXHR, textStatus, errorThrown) {
            node.contentURL = node.thumbnail && node.thumbnail.defaultImgUrl;
            node.addedOriginalImage = false;
            self.displayGalleryItems(node, undefined);
            deferredObject.reject(errorThrown);
          }, this));
        } else if (config.streaming && !node.get("mime_type").match(/^video\/!*[-.\w\s]*$/g)) {
          node.connector.makeAjaxCall(photoOptions).done(_.bind(function(response, textStatus, jqXHR) {
            node.contentURL = node.thumbnail.getContentUrl(response);
            node.addedOriginalImage = true;
            self.displayGalleryItems(node, response);
            deferredObject.resolve();
          }, this)).fail(_.bind(function(jqXHR, textStatus, errorThrown) {
            node.contentURL = node.thumbnail && node.thumbnail.defaultImgUrl;
            node.addedOriginalImage = false;
            self.displayGalleryItems(node, undefined);
            deferredObject.reject(errorThrown);
          }, this));
        }
      }
      return deferredObject.promise();
    },
    displayGalleryItems: function(node, response) {
      let self = this;
      if (node.get("mime_type").match(/^video\/!*[-.\w\s]*$/g)) {
        var video = galleryView && galleryView.$el.find(".binf-item-" + node.cid).find("video");
        if (video.length > 0) {
          video.attr("src", node.contentURL);
          galleryView.$el.find(".binf-item-" + node.cid).addClass("csui-item-original");
          galleryView.$el.find(".binf-item-" + node.cid + " .csui-img-loader").addClass("binf-hidden");
        }
      } else {
        var galleryItem = galleryView && galleryView.$el.find(".binf-item-" + node.cid), thumbnailImage = galleryItem.find(".csui-gallery-thumbnail-icon"), originalImage = galleryItem.find(".csui-gallery-original-icon");
        if (thumbnailImage.length > 0) {
          thumbnailImage.addClass("binf-hidden");
        } else {
          galleryView.$el.find(".binf-item-" + node.cid + " .outer-border").addClass("binf-hidden");
        }
        originalImage.find("img").attr("src", node.contentURL);
        originalImage.find("img").addClass("csui-item-original");
        originalImage.removeClass("binf-hidden");
        var filmstripItem = galleryView && galleryView.$el.find(".binf-filmstrip-item-" + node.cid);
        if (!filmstripItem.find("img").attr("src") || !!filmstripItem.find("img").attr("src") && filmstripItem.find("img").hasClass("binf-hidden")) {
          filmstripItem.find("img").attr("src", node.contentURL).removeClass("binf-hidden");
          filmstripItem.find(".mime_image").addClass("binf-hidden");
        }
      }
    },
    updateFilmStrip: function(thumbNailCollection) {
      thumbNailCollection.forEach(node => {
        if (node.get("csuiThumbnailImageUrl")) {
          if (node.get("mime_type").match(/^image\/!*[-.\w\s]*$/g)) {
            const filmstripItem = galleryView && galleryView.$el.find(`.binf-filmstrip-item-${node.cid}`);
            const imgElement = filmstripItem.find("img");
            const imgSrc = imgElement.attr("src");
            if (!imgSrc || imgSrc && imgElement.hasClass("binf-hidden")) {
              imgElement.attr("src", node.get("csuiThumbnailImageUrl")).removeClass("binf-hidden");
              filmstripItem.find(".mime_image").addClass("binf-hidden");
            }
          }
        }
      });
    }
  });
  var GalleryContentView = Marionette.View.extend({
    constructor: function GalleryContentView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    updateScrollbar: function(element) {
      var container = this.$el.find(".binf-filmstrip-container"), scrollX = container.scrollLeft(), adjustScrollLeft;
      if (element.offset().left + element.width() >= container.width()) {
        adjustScrollLeft = element.offset().left - container.width() + scrollX + element.width() + 20;
      } else if (element.offset().left <= 0) {
        adjustScrollLeft = element.offset().left + scrollX - 5;
      }
      container.animate({
        scrollLeft: adjustScrollLeft
      }, "fast");
    }
  });
  return GalleryPluginView;
});