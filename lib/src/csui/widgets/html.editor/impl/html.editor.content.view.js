/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/radio", "csui/utils/contexts/factories/connector", "csui/utils/url", "csui/utils/base", "csui/utils/froala/bootstrap", "csui/models/node/node.model", "csui/utils/contexts/factories/user", "csui/widgets/html.editor/impl/html.editor.model", "hbs!csui/widgets/html.editor/impl/html.editor", "csui/dialogs/modal.alert/modal.alert", "csui/controls/progressblocker/blocker", "csui/controls/error/error.view", "csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view", "csui/controls/rich.text.editor/rich.text.editor", "csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu.view", "csui/controls/globalmessage/globalmessage", "csui/utils/node.links/node.links", "i18n!csui/widgets/html.editor/impl/nls/lang", "hbs!csui/widgets/html.editor/impl/edit.icon", "hbs!csui/widgets/html.editor/impl/html.editor.action.buttons", "css!csui/widgets/html.editor/impl/html.editor" ], function($, _, Backbone, Marionette, Radio, ConnectorFactory, Url, base, BootstrapFroalaEditor, NodeModel, UserModelFactory, HtmlEditorModel, htmlEditorTemplate, ModalAlert, BlockingView, ErrorView, LinkPreview, RichTextEditor, DropdownMenu, GlobalMessage, NodeLinks, lang, template, htmlEditorButtonsTemplate) {
  "use strict";
  var HtmlEditorContentView = Marionette.ItemView.extend({
    className: "csui-html-editor-wrapper",
    modelEvents: {
      change: "render",
      error: "render"
    },
    ui: {
      richText: ".csui-richtext-message"
    },
    events: {
      'mouseenter .csui-richtext-message[contenteditable="false"] a': "_showPreview",
      'focusin .csui-richtext-message[contenteditable="true"]': "_actionButtonsPositionInEdge",
      'focusin .csui-richtext-message[contenteditable="false"] a': "_updateUrl"
    },
    getTemplate: function() {
      return this.model.error ? false : htmlEditorTemplate;
    },
    templateHelpers: function() {
      return {
        placeholder: lang.PageDefaultContent,
        id: this.model.get("id"),
        data: this.model.get("data")
      };
    },
    constructor: function HtmlEditorContentView(options) {
      options || (options = {});
      options.id = options.wikiPageId;
      options = _.extend(options, options.data = {});
      this.parentView = options.parentView;
      this.ui.richTextEle = "#csui-richtext-content-body" + options.id;
      BlockingView.imbue(this);
      this.context = options.context;
      this.connector = this.context.getObject(ConnectorFactory);
      this.node = new NodeModel({
        id: options.id
      }, {
        connector: this.connector,
        expand: {
          properties: [ "original_id", "parent_id" ]
        },
        commands: [ "permissions", "properties", "reserve", "unreserve", "addcategory", "editpermissions" ]
      });
      this.user = this.context.getModel(UserModelFactory);
      if (!options.model) {
        options.model = new HtmlEditorModel({
          connector: this.connector,
          context: this.context,
          id: options.id
        });
        var url = Url.combine(this.connector.connection.url, "nodes/" + options.id + "/content");
        options.model.fetch({
          url: url,
          success: options.model.fetchSuccess,
          error: options.model.fetchError,
          dataType: "text"
        }).done(_.bind(function(htmlContent) {
          Radio.channel("quicklink:Tiles").trigger("transparent:background");
          this._getLatestVersion().done(_.bind(function() {
            this.oldVersion = this.model.get("version");
          }, this));
        }, this));
      }
      options.richTextElementId = "csui-richtext-content-body-" + options.id;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._errorRegion = new Marionette.Region({
        el: this.el
      });
      this.listenTo(this.model, "sync", _.bind(function() {
        if (!this.model.error) {
          this.user.ensureFetched().done(this._renderActionsDropdown.bind(this));
        }
      }, this));
      this.mode = "read";
      this.utils = RichTextEditor.getRichTextEditorUtils();
      this.enableSaveButton = false;
      this.previewLinkViews = {};
    },
    onRender: function() {
      var error = this.model.error;
      this.$el[error ? "addClass" : "removeClass"]("csui-disabled");
      error ? this.$el.parent().addClass("csui-html-editor-error") : this.$el.parent().removeClass("csui-html-editor-error");
      if (error) {
        this._errorRegion.show(new ErrorView({
          model: new Backbone.Model({
            message: lang.noWikiPageFound,
            title: error.message
          })
        }));
      }
      this.$el.addClass(this.options.header ? "" : "csui-html-editor-no-header");
      this.$el.parent().addClass(this.options.header || error ? "" : "tile");
      this.filterHtmlContent();
      this.refreshTabableElements();
    },
    filterHtmlContent: function() {
      this.$el.find("table").each(function(index, table) {
        $(table).css({
          border: table.getAttribute("border") + "px solid",
          borderSpacing: table.getAttribute("cellspacing") + "px",
          "text-align": table.getAttribute("align")
        }).removeAttr("cellpadding cellspacing border align");
        $(table).find("th,td").css("padding", table.getAttribute("cellpadding") + "px");
      });
      this.$el.find("big").each(function(index, bigEle) {
        $(bigEle).replaceWith('<span class="csui-big">' + $(bigEle).html() + "</span>");
      });
    },
    refreshTabableElements: function() {
      if (this.mode === "read") {
        this.tabableElements = this.$el.find("a").toArray();
      } else {
        this.tabableElements = [];
        this.tabableElements.push(this.editorInstance.$el[0]);
        this.tabableElements = this.tabableElements.concat($(".froala-save-cancel" + ".csui-html-editor-action-buttons > button:not([disabled])").toArray());
      }
      this.currentlyFocusedElementIndex = -1;
    },
    moveTab: function(event) {
      this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
      var currentFocus = $(this.tabableElements[this.currentlyFocusedElementIndex]), resetTabIndex = false;
      if (event.keyCode === 9) {
        if (event.shiftKey) {
          if (this.currentlyFocusedElementIndex > 0) {
            this.currentlyFocusedElementIndex -= 1;
            $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger("focus");
            event.stopPropagation();
            event.preventDefault();
          } else {
            resetTabIndex = true;
          }
        } else {
          if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
            this.currentlyFocusedElementIndex += 1;
            $(this.tabableElements[this.currentlyFocusedElementIndex]).prop("tabindex", 0).trigger("focus");
            event.stopPropagation();
            event.preventDefault();
          } else {
            resetTabIndex = true;
          }
        }
        if (resetTabIndex) {
          if (this.mode === "write") {
            if (event.shiftKey) {
              this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
            } else {
              this.currentlyFocusedElementIndex = 0;
            }
            $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger("focus");
          } else {
            currentFocus.on("focusout", _.bind(function() {
              currentFocus.off("focusout");
              this.currentlyFocusedElementIndex = -1;
            }, this));
          }
        }
        if (this.mode === "write") {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    },
    _showPreview: function(event) {
      var linkPreview, options;
      this.utils.getUrl(this, event).done(_.bind(function() {
        options = _.extend({
          targetEle: event.target,
          connector: this.connector
        }, this.options);
        if (!this.previewLinkViews[event.target.href]) {
          linkPreview = new LinkPreview(options);
          this.listenTo(linkPreview, "model:fetched", function(model) {
            this.previewLinkViews[event.target.href] = model;
          });
        } else {
          options.previewModel = this.previewLinkViews[event.target.href];
          linkPreview = new LinkPreview(options);
        }
        linkPreview.render();
      }, this));
    },
    _updateUrl: function(event) {
      this.utils.getUrl(this, event);
    },
    _renderActionsDropdown: function() {
      this.node.fetch().done(_.bind(function(response) {
        this.dropdownMenu = new DropdownMenu({
          openForEdit: this._openForEdit.bind(this),
          node: this.node,
          user: this.user,
          context: this.options.context,
          parentView: this
        });
        new Marionette.Region({
          el: this.parentView.$el.find(".tile-controls")
        }).show(this.dropdownMenu);
        this.grandParentEle = this.$el.closest(".csui-html-editor-grand-parent");
        this.listenTo(this.dropdownMenu, "render", _.bind(function() {
          this.refreshTabableElements();
          this.trigger("refresh:tabindexes");
        }, this));
        this.editIconEle = this.parentView.$el.find(".tile-controls");
        if (!!this.options.header) {
          var tileHeaderEleTitle = this.options.titlefield || "";
          this.editIconEle.closest(".tile-header").attr({
            title: tileHeaderEleTitle,
            "aria-label": tileHeaderEleTitle
          });
        }
      }, this));
    },
    editModeAccessibility: function() {
      $(document).on("keydown.html.editor", _.bind(function(event) {
        const element = $(".fr-toolbar")[0];
        if (element && element.style.display != "none" && !$.contains(element, event.target)) {
          if (event.keyCode === 9) {
            this.moveTab(event);
          } else if ([ 13, 32 ].indexOf(event.keyCode) !== -1 && $(event.target).hasClass("csui-html-edit-icon")) {
            $(event.target).trigger("click");
            event.preventDefault();
          }
        }
      }, this));
    },
    removeEditModeAccessibility: function() {
      $(document).off("keydown.html.editor");
    },
    _openForEdit: function() {
      this.editModeAccessibility();
      this.blockActions();
      this._getLatestVersion().done(_.bind(function() {
        this._toggleReserve(true).done(_.bind(function() {
          if (this.oldVersion === this.model.get("version")) {
            this._getLatestContent().done(_.bind(function() {
              this._editContent();
            }, this));
          } else {
            ModalAlert.confirmQuestion(_.bind(function(result) {
              if (result) {
                this._editContent();
                this.enableSaveButton = true;
              } else {
                this._getLatestContent().done(_.bind(function() {
                  this._editContent();
                  this.oldVersion = this.model.get("version");
                  this.enableSaveButton = false;
                }, this));
              }
              this.alreadyTriggered = true;
            }, this), lang.versionDifferenceConfirmMessage, lang.versionDifferenceConfirmTitle);
          }
        }, this)).fail(this.unblockActions.bind(this));
      }, this)).fail(this.unblockActions.bind(this));
      if (base.isAppleMobile()) {
        this.$el.find(".csui-richtext-message").attr("contenteditable", true).trigger("focus");
      }
    },
    destroyFREditor: function(FREditor) {
      $(".csui-rich-text-mask").remove();
      $(".csui-html-editor-zindex").removeClass("csui-html-editor-zindex");
      $("#csui-richtext-sharedspace").remove();
      $(".cui-rich-editor-widget-wrapper").removeAttr("style");
      this.editIconEle.removeClass("binf-hidden");
      this.unblockActions();
      this._unbindEvents();
      $("body").find(".csui-html-editor-action-buttons").remove();
      window.removeEventListener("resize", this._positionActionButtonsInstance, true);
      this.removeEditModeAccessibility();
      this.mode = "read";
      this.refreshTabableElements();
      $(".csui-html-editor-zero-zindex").removeClass("csui-html-editor-zero-zindex");
      FREditor.destroy();
    },
    extractSelectionData: function(selection) {
      if (!selection) {
        return null;
      }
      return {
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset
      };
    },
    _editContent: async function() {
      var self = this;
      self.contentChanged = !!self.autoSaved;
      const imageFolderId = self.node.get("parent_id_expand").image_folder_id;
      async function getImageId(file) {
        try {
          var formData = new FormData();
          formData.append("parent_id", imageFolderId), formData.append("type", 144);
          formData.append("name", self.editorInstance.opts.imageUploadParams.name);
          formData.append("file", file);
          var saveParams = {
            url: self.connector.connection.url + "/nodes",
            type: "POST",
            data: formData,
            connector: self.connector
          };
          var response = await self.updateAjaxCall(saveParams);
          return response.id;
        } catch (error) {
          console.error("Error fetching image ID:", error);
          throw error;
        }
      }
      var connectionUrl = new Url(this.connector.connection.url), cgiUrl = connectionUrl.getCgiScript();
      var froalaConfig = {
        placeholderText: lang.PageDefaultContent,
        externalParams: {
          getImageId: getImageId.bind(this),
          connectionUrl: cgiUrl,
          imageBrowseEnabled: self.node.get("parent_id_expand").imagebrowseenabled,
          enableSaveButton: self._enableSaveButton,
          disableSaveButton: self._disableSaveButton,
          widgetSelector: "div[data-csui-widget_type]"
        },
        requestHeaders: {
          otcsticket: self.connector.connection.session.ticket
        },
        events: {
          cancel: function() {
            var e = this;
            self.blockActions();
            if (self.contentChanged) {
              this.$tb.hide();
              this.opts.externalParams.actionButtons.hide();
              ModalAlert.confirmQuestion(function(result) {
                if (result) {
                  self._getLatestVersion().done(function() {
                    if (self.oldVersion !== self.model.get("version")) {
                      self._getLatestContent().done(_.bind(function() {
                        self.oldVersion = this.model.get("version");
                        e.html.set(self.model.get("oldData"));
                      }, self)).fail(function(xhr) {
                        self.editorInstance.events.trigger("onFailure", [ xhr ]);
                      });
                    } else {
                      e.html.set(self.model.get("oldData"));
                    }
                    self.trigger("updateScrollbar");
                    self.destroyFREditor(e);
                    self.autoSaved && self.deleteAutoSavedContent({
                      connector: self.connector,
                      wikiId: self.node.get("parent_id"),
                      pageId: self.model.get("id")
                    });
                    self._toggleReserve();
                  }).fail(function(xhr) {
                    self.editorInstance.events.trigger("onFailure", [ xhr ]);
                  });
                } else {
                  this.$tb.show();
                  this.opts.externalParams.actionButtons.show();
                  $(self.options.richTextElementId).trigger("focus");
                  self.unblockActions();
                }
              }.bind(this), lang.CancelConfirmMessage, lang.cancelTitle, ModalAlert.buttonData.Yes = {
                label: lang.Yes,
                tooltip: lang.Yes,
                aria: ""
              }, ModalAlert.buttonData.No = {
                label: lang.No,
                tooltip: lang.No,
                aria: ""
              });
            } else {
              self._getLatestVersion().done(function() {
                if (self.oldVersion !== self.model.get("version")) {
                  self._getLatestContent().done(_.bind(function() {
                    self.oldVersion = this.model.get("version");
                    e.html.set(self.model.get("oldData"));
                  }, self)).fail(function(xhr) {
                    self.editorInstance.events.trigger("onFailure", [ xhr ]);
                  });
                } else {
                  e.html.set(self.model.get("oldData"));
                }
                self.destroyFREditor(e);
                self._toggleReserve();
              }).fail(function(xhr) {
                self.editorInstance.events.trigger("onFailure", [ xhr ]);
              });
            }
          },
          "save.before": function() {
            self._autoSaveContent();
          },
          onSave: function() {
            self.blockActions();
            self._getLatestVersion().done(function() {
              if (!!self.alreadyTriggered || self.oldVersion === self.model.get("version")) {
                self.enableSaveButton = false;
                self._saveContent().done(() => {
                  self.editorInstance.events.trigger("onSuccess");
                }).fail(xhr => {
                  self.editorInstance.events.trigger("onFailure", [ xhr ]);
                });
              } else {
                ModalAlert.confirmQuestion(function(result) {
                  if (result) {
                    self.enableSaveButton = false;
                    self._saveContent().done(() => {
                      self.editorInstance.events.trigger("onSuccess");
                    }).fail(xhr => {
                      self.editorInstance.events.trigger("onFailure", [ xhr ]);
                    });
                  } else {
                    $(self.options.richTextElementId).trigger("focus");
                    self._enableSaveButton();
                    self.unblockActions();
                  }
                }, lang.versionDifferenceConfirmMessage, lang.versionDifferenceConfirmTitle);
              }
            }).fail(function(xhr) {
              self.editorInstance.events.trigger("onFailure", [ xhr ]);
            });
          },
          onSuccess: function() {
            self.model.set({
              data: self.editorInstance.html.get(),
              oldData: self.editorInstance.html.get()
            });
            self._getLatestVersion().done(function() {
              self.oldVersion = self.model.get("version");
              self.destroyFREditor(self.editorInstance);
              self.node.fetch();
              self.unblockActions();
            }).fail(function(xhr) {
              self.editorInstance.events.trigger("onFailure", [ xhr ]);
            });
          },
          onFailure: function(xhr) {
            let error = new base.RequestErrorMessage(xhr);
            GlobalMessage.showMessage("error", error.toString() || xhr?.message);
            self.trigger("updateScrollbar");
            self.unblockActions();
            self._enableSaveButton();
          },
          click: function(event) {
            const clickedElement = event.target;
            if (clickedElement.nodeName === "A" && clickedElement.href && !this.edit.isDisabled()) {
              event.preventDefault();
            }
          },
          initialized: function() {
            $(self.options.richTextElementId).addClass("csui-rich-text-editor-toolbar");
            self.mode = "write";
            self.unblockActions();
            self.$el.find(".csui-richtext-message").trigger("focus");
            self.editorInstance.opts.externalParams.actionButtons = $(".froala-save-cancel");
            self.editorInstance.initialEditorText = self.editorInstance.html.get().trim();
            self._actionButtonsPosition();
            self.refreshTabableElements();
            resetMasking();
            this.html.get = this.opts.customHtmlGet.bind(this);
          },
          contentChanged: function() {
            self._validateState();
          }
        }
      };
      self.editorInstance = await BootstrapFroalaEditor("#" + this.options.richTextElementId, froalaConfig);
      window.onbeforeunload = function() {
        return false;
      };
      require([ "csui/dialogs/node.picker/node.picker" ], function(NodePicker) {
        self.editorInstance.opts.csLink = {
          nodeLink: NodeLinks,
          nodePicker: function() {
            return new NodePicker({
              connector: self.connector,
              dialogTitle: lang.contentServerLink,
              context: self.options.context,
              resolveShortcuts: true,
              resultOriginalNode: false,
              currentUser: self.options.context.getModel(UserModelFactory)
            });
          }
        };
      });
      var $rteEle = self.$("#" + this.options.richTextElementId);
      var froalaWrapper = $rteEle.find(".fr-wrapper");
      froalaWrapper.attr("contenteditable", true);
      this.editIconEle.addClass("binf-hidden");
      var rteMask = document.createElement("div"), rteBodyMask = document.createElement("div"), defaultContainer = $.fn.binf_modal.getDefaultContainer();
      rteMask.className = "csui-rich-text-mask";
      rteBodyMask.className = "csui-rich-text-mask csui-rich-text-body-mask";
      self.grandParentEle.before(rteMask);
      $(defaultContainer).append(rteBodyMask);
      if (base.isMSBrowser()) {
        !!$("#breadcrumb-wrap") && $("#breadcrumb-wrap").addClass("csui-html-editor-zero-zindex");
      }
      var $rteMask = $(rteMask), $rteBodyMask = $(rteBodyMask), $maskOfffset = this.grandParentEle.find(".csui-html-editor-no-header").length > 0 ? 5 : 80, resetMasking = function() {
        $rteBodyMask.css("height", "0px");
        $rteMask.css("top", "0px");
        var rteMaskTop = $rteEle.offset().top - $(rteMask).offset().top - $maskOfffset, rteBodyMaskHeight = $rteEle.offset().top - $maskOfffset;
        rteBodyMaskHeight = rteMaskTop < 0 ? rteBodyMaskHeight + -rteMaskTop : rteBodyMaskHeight;
        rteMaskTop = rteMaskTop < 0 ? 0 : rteMaskTop;
        $rteBodyMask.css("height", rteBodyMaskHeight + "px");
        $rteMask.css({
          height: document.body.scrollHeight - rteBodyMask.offsetHeight,
          top: rteMaskTop
        });
        $(rteMask).parent().addClass("csui-html-editor-zindex");
      };
      resetMasking();
      $(window).on("resize", resetMasking);
      $(".csui-richtext-message").on("change", resetMasking);
    },
    _saveContent: function() {
      var self = this;
      var deferred = $.Deferred();
      var formData = new FormData();
      formData.append("TextField", self.editorInstance.html.get() === "" ? "<p></p>" : self.editorInstance.html.get());
      var saveParams = {
        url: self.connector.connection.url + "/nodes/" + self.options.id,
        type: "PUT",
        data: formData,
        dataType: "json",
        processData: false,
        contentType: false,
        connector: self.connector,
        view: self,
        requestType: "saveContent"
      };
      var updatePromise = self.updateAjaxCall(saveParams);
      var deleteAutoSavedPromise = function() {
        if (self.autoSaved) {
          const apiUrl = self.connector.getConnectionUrl().getApiBase("v2");
          const wikiId = self.node.get("parent_id");
          const pageId = self.model.get("id");
          const args = {
            type: "DELETE",
            connector: self.connector,
            wikiId: wikiId,
            pageId: pageId,
            url: Url.combine(apiUrl, "/wiki/" + wikiId + "/autosave/" + pageId)
          };
          return self.updateAjaxCall(args);
        } else {
          return $.Deferred().resolve().promise();
        }
      };
      var toggleReservePromise = function() {
        return self._toggleReserve(true);
      };
      Promise.all([ updatePromise, deleteAutoSavedPromise(), toggleReservePromise() ]).then(function() {
        deferred.resolve();
      }).catch(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _disableSaveButton: function() {
      var saveButton = $("body").find(".csui-html-edit-save");
      if (saveButton.length) {
        saveButton[0].disabled = true;
      }
    },
    _enableSaveButton: function() {
      var saveButton = $("body").find(".csui-html-edit-save");
      if (saveButton.length) {
        saveButton[0].disabled = false;
      }
    },
    _toggleReserve: function(toEditMode) {
      let deferred = $.Deferred(), formData = new FormData();
      if (!!toEditMode) {
        if (this.node.get("reserved") && this.node.get("reserved_user_id") === this.user.get("id")) {
          deferred.resolve();
          return deferred;
        } else {
          formData.append("reserved_user_id", this.user.get("id"));
        }
      } else {
        if (this.node.get("reserved")) {
          formData.append("reserved_user_id", null);
        } else {
          this.node.fetch();
          deferred.resolve();
          return deferred;
        }
      }
      let contentUrl = this.connector.connection.url + "/nodes/" + this.node.get("id"), self = this;
      this.updateAjaxCall({
        url: contentUrl,
        connector: this.connector,
        data: formData,
        type: "PUT"
      }).done(function() {
        deferred.resolve();
      }).fail(function(xhr) {
        GlobalMessage.showMessage("error", xhr.responseJSON.errorDetail);
        deferred.reject();
      }).always(function() {
        self.node.fetch();
      });
      return deferred;
    },
    _autoSaveContent: function() {
      let contentDiv = this.editorInstance;
      if (!!contentDiv && contentDiv.html.get().trim() !== this.model.get("data").trim()) {
        let source = contentDiv.html.get(), formData = new FormData();
        formData.append("wikiId", this.node.get("parent_id"));
        formData.append("pageId", this.model.get("id"));
        formData.append("source", source);
        this.updateAjaxCall({
          connector: this.connector,
          url: Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "/wiki/autosave"),
          type: "POST",
          data: formData,
          view: this
        });
        this.autoSaved = true;
      }
    },
    _getLatestContent: function() {
      var ajaxParams = {
        url: Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "/wiki/" + this.model.get("id") + "/autosave"),
        type: "GET",
        requestType: "getContent",
        connector: this.connector,
        view: this
      };
      return this.updateAjaxCall(ajaxParams);
    },
    _getLatestVersion: function() {
      var ajaxParams = {
        url: Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "/nodes/" + this.model.get("id")),
        type: "GET",
        requestType: "versions-reserve",
        connector: this.connector,
        view: this
      };
      return this.updateAjaxCall(ajaxParams);
    },
    _validateState: function() {
      this.utils = this.utils || RichTextEditor.getRichTextEditorUtils();
      if (!!this.editorInstance && this.editorInstance.html.get().trim() !== this.editorInstance.initialEditorText) {
        this.contentChanged = true;
        this._enableSaveButton();
        this.refreshTabableElements();
      } else {
        this.contentChanged = false;
        this._disableSaveButton();
        this.refreshTabableElements();
      }
    },
    _appendActionButtons: function() {
      var toolbar = $("body"), data = {
        saveLabel: lang.saveTitle,
        cancelLabel: lang.cancelTitle,
        cancelAria: lang.cancelAria,
        saveAria: lang.saveAria,
        isFroala: true
      };
      this.scrollbarWidth = window.innerWidth - document.body.clientWidth;
      toolbar.append(htmlEditorButtonsTemplate(data));
      toolbar.find(".csui-html-edit-save").on("click", _.bind(function() {
        this.editorInstance.events.trigger("onSave");
      }, this));
      toolbar.find(".csui-html-edit-cancel").on("click", _.bind(function() {
        this.editorInstance.events.trigger("cancel");
      }, this));
    },
    _actionButtonsPosition: function() {
      if (!!this.enableSaveButton) {
        this._enableSaveButton();
        this.refreshTabableElements();
      } else {
        this._disableSaveButton();
        this.refreshTabableElements();
      }
    },
    _unbindEvents: function() {
      window.onbeforeunload = null;
    },
    updateAjaxCall: function(args) {
      var deferred = $.Deferred(), url = args.url, data = args.data, type = args.type, connector = args.connector, self = args.view, requestType = args.requestType;
      connector.makeAjaxCall({
        url: url,
        type: type,
        data: data,
        contentType: false,
        crossDomain: true,
        processData: false,
        success: function(response, status, jXHR) {
          switch (requestType) {
           case "getContent":
            if (!!response.results.data.autoSaved) {
              self.autoSaved = true;
              ModalAlert.confirmQuestion(function(result) {
                var content = response.results.data.content;
                if (result) {
                  content = response.results.data.autoSaved;
                  self.enableSaveButton = true;
                } else {
                  self.enableSaveButton = false;
                  self.deleteAutoSavedContent({
                    connector: self.connector,
                    wikiId: self.node.get("parent_id"),
                    pageId: self.model.get("id")
                  });
                  self._toggleReserve();
                }
                self.model.set({
                  data: content
                });
                deferred.resolve();
              }, lang.RestoreDialogMessage, lang.RestoreDiaglogTitle, ModalAlert.buttonData.Yes = {
                label: lang.Continue,
                tooltip: lang.Continue,
                aria: ""
              }, ModalAlert.buttonData.No = {
                label: lang.Discard,
                tooltip: lang.Discard,
                aria: ""
              });
            } else {
              self.model.set({
                data: response.results.data.content,
                oldData: response.results.data.content
              });
              deferred.resolve();
            }
            break;

           case "versions-reserve":
            self.model.attributes.version = response.results.data.versions.length;
            self.node.set({
              reserved: response.results.data.properties.reserved,
              reserved_user_id: response.results.data.properties.reserved_user_id
            });
            deferred.resolve();
            break;

           default:
            deferred.resolve(response);
          }
        },
        error: function(xhr, status, text) {
          deferred.reject(xhr);
        }
      });
      return deferred.promise();
    },
    deleteAutoSavedContent: function(args) {
      if (this.autoSaved) {
        args.type = "DELETE";
        args.url = Url.combine(args.connector.getConnectionUrl().getApiBase("v2"), "/wiki/" + args.wikiId + "/autosave/" + args.pageId);
        this.updateAjaxCall(args);
        this.autoSaved = false;
      }
    }
  });
  return HtmlEditorContentView;
});