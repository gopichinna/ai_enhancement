/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/nodes", "d2/controls/globalmessage/globalmessage", "csui/controls/draganddrop/draganddrop.view", "csui/dialogs/modal.alert/modal.alert", "csui/widgets/nodestable/toolbaritems", "nuc/utils/base", "csui/utils/commands", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/creation.utils", "d2/utils/widget.constants", "i18n!d2/overrides/csui/controls/draganddrop/impl/nls/lang" ], function(module, $, _, Backbone, NodeCollection, GlobalMessage, DragAndDropView, ModalAlert, nodesTableToolItems, base, commands, serverQueryUtils, constants, CreationUtils, widgetConstants, lang) {
  "use strict";
  var config = _.defaults({}, module.config(), {
    detectLeaveDelay: 10
  });
  _.extend(DragAndDropView.prototype, {
    canAdd: function() {
      var actionModels = new Backbone.Collection();
      if (_.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL ], this.container.get("type"))) {
        actionModels = nodesTableToolItems.inlineActionbar.collection;
      } else if (_.contains([ constants.Types.CABINET, constants.Types.FOLDER, constants.Types.BWS ], this.container.get("type"))) {
        actionModels = nodesTableToolItems.addToolbar.collection;
      }
      var action = actionModels.find(function(action) {
        var signature = action.get("signature");
        if (signature === "AddVersion" || signature === "D2-ImportFile" || signature === "D2-ImportFolder") {
          return action;
        }
      });
      return !!action;
    },
    isDndSupportedContainer: function(container) {
      return _.contains([ constants.Types.CABINET, constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.FOLDER ], container.get("type"));
    },
    onDropView: function(currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      if (this.overViewTimeout) {
        clearTimeout(this.overViewTimeout);
        this.overViewTimeout = undefined;
      }
      var self = this, dataTransfer = currentEvent.originalEvent && currentEvent.originalEvent.dataTransfer || {
        files: currentEvent.originalEvent && currentEvent.originalEvent.target && currentEvent.originalEvent.target.files || []
      }, singleFileDrop = dataTransfer.files.length === 1, dataTransferEntryIsFile = singleFileDrop && dataTransfer.items && dataTransfer.items[0].webkitGetAsEntry() && dataTransfer.items[0].webkitGetAsEntry().isFile, validItems = dataTransfer.items && dataTransfer.items.length && _.all(dataTransfer.items, function(item) {
        return item.kind === "file";
      }), validTypes = dataTransfer.types && (dataTransfer.types.indexOf ? dataTransfer.types.indexOf("Files") !== -1 : dataTransfer.types.contains("Files"));
      if (!(validItems || validTypes)) {
        return;
      }
      var command;
      var options = {
        addableTypeName: "Upload file",
        context: this.context
      };
      var status = {
        container: self.isContent() ? self.options.originatingView.container : self.container,
        nodes: new NodeCollection([ self.container ]),
        context: self.context,
        originatingView: self.options.originatingView,
        collection: self.isContent() || self.highlightedTarget === undefined || self.highlightedTarget === ".csui-innertablecontainer" ? self.collection : null
      };
      var files = dataTransfer.files;
      var items = dataTransfer.items;
      var folderCounter = 0;
      var fileCounter = 0;
      var promisses = [];
      if (items) {
        self.fileList = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i].webkitGetAsEntry();
          if (item) {
            if (item.isDirectory) {
              promisses = promisses.concat(self._readEntries(item.createReader(), self, files[i].name + "/"));
              folderCounter++;
            } else {
              promisses = promisses.concat(self._fetchFile(item));
              fileCounter++;
            }
          }
        }
      }
      self.parentView.blockActions();
      $.whenAll.apply($, promisses).always(function() {
        self.parentView.unblockActions();
        if ((self.canAdd() || self.isDndSupportedContainer(self.parentView.container) && self.options.isSupportedRowView) && !(folderCounter > 1 || folderCounter > 0 && fileCounter > 0)) {
          if (dataTransferEntryIsFile && self.container.get("type") === 144) {
            self.parentView.blockActions();
            self.checkFiles(dataTransfer).always(function(files) {
              var fileDetails = CreationUtils.filterFiles(base.isIE11() ? files : self.fileList);
              files = fileDetails.validFiles;
              self.container.fetch().done(function() {
                self.operation = files.length === 1 && self.isContent() ? folderCounter === 1 ? "D2-ImportFolder" : "AddVersion" : folderCounter === 1 ? "D2-ImportFolder" : "D2-ImportFile";
                if (files.length) {
                  self.fetchActions(self.operation).done(function(data) {
                    var dropTargetName = self.container.get("name");
                    var action = _.findWhere(data, {
                      signature: self.operation
                    });
                    command = commands.get(self.operation);
                    if (action) {
                      if (self.operation === "AddVersion") {
                        if (command.enabled(status, options)) {
                          self._addVersionToFile(status, files, command);
                        } else if (self.container.get("reserved")) {
                          GlobalMessage.showMessage("warning", _.str.sformat(lang.addVersionDeniedForReservedItem));
                        }
                      }
                    } else {
                      GlobalMessage.showMessage("warning", _.str.sformat(self.operation === "AddVersion" ? lang.addVersionDenied : lang.importDenied, dropTargetName));
                    }
                  }).fail(function(request) {
                    if (request) {
                      var error = new base.Error(request);
                      GlobalMessage.showMessage("error", error.message);
                    }
                  });
                }
              }).fail(function(request) {
                if (request) {
                  var error = new base.Error(request);
                  GlobalMessage.showMessage("error", error.message);
                }
              }).always(function() {
                self.parentView.unblockActions();
              });
            });
          } else {
            var fileDetails = CreationUtils.filterFiles(base.isIE11() ? files : self.fileList);
            files = fileDetails.validFiles;
            if (files && files.length) {
              self.parentView.blockActions();
              files = files && files.length ? _.reject(files, function(file) {
                return file instanceof Error;
              }) : [];
              if (files.length) {
                self.operation = files.length === 1 && self.isContent() ? folderCounter === 1 ? "D2-ImportFolder" : "AddVersion" : folderCounter === 1 ? "D2-ImportFolder" : "D2-ImportFile";
                var filesSelected = [];
                files.filter(function(file) {
                  filesSelected.push(file);
                });
                self.fetchActions(self.operation).done(function(data) {
                  var dropTargetName = self.container.get("name");
                  var action = _.findWhere(data, {
                    signature: self.operation
                  });
                  command = commands.get(self.operation);
                  if (action) {
                    if (self.operation === "AddVersion") {
                      if (command.enabled(status, options)) {
                        self._addVersionToFile(status, filesSelected, command);
                      } else if (self.container.get("reserved")) {
                        GlobalMessage.showMessage("warning", _.str.sformat(lang.addVersionDeniedForReservedItem));
                      }
                    } else if (self.operation === "D2-ImportFolder") {
                      options.files = files;
                      command.execute(status, options);
                    } else if (self.operation === "D2-ImportFile") {
                      options.files = files;
                      command.execute(status, options);
                    }
                  } else {
                    GlobalMessage.showMessage("warning", _.str.sformat(self.operation === "AddVersion" ? lang.addVersionDenied : lang.importDenied, dropTargetName));
                  }
                }).fail(function(request) {
                  if (request) {
                    var error = new base.Error(request);
                    GlobalMessage.showMessage("error", error.message);
                  }
                });
              }
              self.parentView.unblockActions();
            } else {
              if (fileDetails.status) {
                if (dataTransfer.types && (dataTransfer.types.indexOf ? dataTransfer.types.indexOf("Files") !== -1 : dataTransfer.types.contains("Files"))) {
                  GlobalMessage.showMessage("error", lang.uploadFolderActionNotSupported);
                } else {
                  GlobalMessage.showMessage("error", lang.dropNotPermitted);
                }
              }
            }
          }
        } else {
          var nodeName = self.container.get("type") === 144 ? self.parentView.container.get("name") : self.container.get("name");
          if (folderCounter > 0 && fileCounter > 0) {
            GlobalMessage.showMessage("error", _.str.sformat(lang.fileAndFolderDropDoclist, nodeName));
          } else if (folderCounter > 1) {
            GlobalMessage.showMessage("error", _.str.sformat(lang.multipleFolders));
          } else {
            GlobalMessage.showMessage("error", _.str.sformat(lang.addTypeDenied, nodeName));
          }
        }
      }).fail(function() {
        GlobalMessage.showMessages("error", lang.errorReadEntryProcessing);
      });
      this.disable();
    },
    _fetchFile: function(fileEntry) {
      var fDeferred = $.Deferred();
      var self = this;
      fileEntry.file(function(file) {
        self.fileList.push(file);
        fDeferred.resolve();
      }, function() {
        fDeferred.reject();
      });
      return fDeferred.promise();
    },
    _readEntries: function(reader, self, path, iterationAttempts, deferred) {
      path = path || "";
      iterationAttempts = iterationAttempts || [];
      var initEntry = !deferred ? true : false;
      deferred = deferred || $.Deferred();
      reader.readEntries(function(entries) {
        if (!entries.length) {
          $.whenAll.apply($, iterationAttempts).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.resolve(error);
          });
        } else {
          entries.map(function(ientry) {
            if (ientry.isFile) {
              var fDeferred = $.Deferred();
              ientry.file(function(file) {
                file.path = path + file.name;
                self.fileList.push(file);
                fDeferred.resolve(file.path);
              }, function() {
                fDeferred.reject();
              });
              iterationAttempts.push(fDeferred.promise());
            } else {
              iterationAttempts.push(self._readEntries(ientry.createReader(), self, path + ientry.name + "/"));
            }
          });
          self._readEntries(reader, self, path, iterationAttempts, deferred);
        }
      }, function(error) {
        deferred.reject(error);
      });
      if (initEntry) {
        return deferred.promise();
      } else {
        return null;
      }
    },
    _addVersionToFile: function(status, files, command) {
      var dropTargetName = this.container.get("name");
      ModalAlert.confirmQuestion(_.str.sformat(lang.dialogTemplate, dropTargetName), lang.dialogTitle, {}).done(function() {
        var options = {
          files: files
        };
        command.execute(status, options);
      });
    },
    fetchActions: function(operation) {
      this.deferred = $.Deferred();
      var parameter = {
        ids: [ this.container.get("id") ],
        connector: this.container.connector
      }, self = this;
      if (operation === "AddVersion") {
        _.extend(parameter, {
          menuType: constants.MenuTypes.CONTEXT,
          widgetType: widgetConstants.D2.DOCLIST
        });
      } else {
        _.extend(parameter, {
          menuType: constants.MenuTypes.NEW_OBJECT
        });
      }
      serverQueryUtils.fetchActions(parameter).done(function(actions) {
        var actionsReturn;
        actionsReturn = _.map(actions, function(data) {
          return data;
        });
        self.deferred.resolve(actionsReturn[0]);
      }).fail(function(err) {
        self.deferred.reject(err);
      });
      return this.deferred.promise();
    },
    isContent: function() {
      return this.container.get("type") === constants.Types.DOCUMENT || this.container.get("type") === constants.Types.EMAIL;
    },
    onOverView: function(currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      var dataTransfer = currentEvent.originalEvent && currentEvent.originalEvent.dataTransfer, items = dataTransfer.items, validItems = items && items.length && _.all(items, function(item) {
        return item.kind === "file";
      }), types = dataTransfer && dataTransfer.types, validTypes = types && types.length && _.any(types, function(type) {
        return type.toLowerCase() === "files";
      }), invalidMessage = lang.dropInvalid;
      this.valid = items && validItems || validTypes;
      if (dataTransfer) {
        dataTransfer.dropEffect = "copy";
      }
      if (validItems || validTypes) {
        if (this.leaveViewTimeout) {
          clearTimeout(this.leaveViewTimeout);
          this.leaveViewTimeout = undefined;
        } else {
          this.enable(false);
        }
        if (!this.canAdd()) {
          var validContainer = this.isDndSupportedContainer(this.originatingView && this.originatingView.container || this.container);
          this.valid = validContainer && this.options.isSupportedRowView;
          invalidMessage = lang.dropNotPermitted;
        }
        if (items && items.length > 1 && this.isContent()) {
          if (!this.currentRowHighlightedTarget) {
            this.currentRowHighlightedTarget = this.highlightedTarget;
            this.highlightedTarget = undefined;
          }
        } else {
          if (this.currentRowHighlightedTarget) {
            this.highlightedTarget = this.currentRowHighlightedTarget;
            this.currentRowHighlightedTarget = undefined;
          }
        }
        if (this.valid) {
          this._resetMessage({
            items: items
          });
        }
        if (!this.overViewTimeout) {
          this.overViewTimeout = setTimeout(_.bind(function() {
            this.overViewTimeout = undefined;
            if (this.valid) {
              this.parentView.csuiDropMessage.hasClass("csui-disabled") && this.parentView.csuiDropMessage.removeClass("csui-disabled");
              this.trigger("drag:over", this, {
                disabled: false,
                highlightedTarget: this.highlightedTarget
              });
              this.parentView.csuiDropMessage.show();
              this.visible = true;
            } else {
              !this.parentView.csuiDropMessage.hasClass("csui-disabled") && this.parentView.csuiDropMessage.addClass("csui-disabled");
              this.parentView.csuiDropMessage.html(invalidMessage);
              this.parentView.csuiDropMessage.show();
              this.visible = true;
              this.trigger("drag:over", this, {
                disabled: true
              });
            }
          }, this), config.detectLeaveDelay);
        }
      }
    }
  });
});