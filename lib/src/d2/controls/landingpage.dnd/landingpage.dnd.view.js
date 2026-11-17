/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "hbs!d2/controls/landingpage.dnd/impl/landingpage.dnd", "csui/utils/commands", "d2/controls/globalmessage/globalmessage", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/creation.utils", "nuc/utils/base", "i18n!d2/overrides/csui/controls/draganddrop/impl/nls/lang", "css!d2/controls/landingpage.dnd/impl/landingpage.dnd" ], function($, _, Marionette, Backbone, template, commands, GlobalMessage, RestResources, utils, CreationUtils, base, dndLang) {
  "use strict";
  var LandingPageDndView = Marionette.ItemView.extend({
    template: template,
    className: "d2-drag-and-drop",
    ui: {
      dropMessageContainer: ".d2-drop-file-folder-message-container",
      dropMessage: ".d2-drop-file-folder-message",
      dropicon: ".d2-drop-file-folder-icon"
    },
    constructor: function LandingPageDndView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.container = options.container;
      this.originatingView = options.originatingView;
      this.landingPageId = options.landingPageId;
      this.context = options.context;
      this.model = options.model || new Backbone.Model();
      this.render();
      this.container.append(this.ui.dropMessageContainer);
      this._setDragEvents();
    },
    _setDragEvents: function() {
      this.container.on({
        drop: this._onDrop.bind(this),
        dragenter: this._onDragEnter.bind(this),
        dragover: this._onDragOver.bind(this),
        dragleave: this._onDragLeave.bind(this)
      });
      this.originatingView.counter = 0;
    },
    _traverseFileTree: function(item, path, dirReader) {
      var deferred = $.Deferred();
      path = path || "";
      var self = this, promises = [];
      if (item.isFile) {
        item.file(function(file) {
          file.path = path + file.name;
          self.fileList.push(file);
          deferred.resolve();
        }, function() {
          GlobalMessage.showMessage("error", dndLang.dropNotPermitted);
          deferred.reject();
        });
      } else if (item.isDirectory) {
        dirReader = dirReader || item.createReader();
        dirReader.readEntries(function(entries) {
          if (entries.length) {
            promises = entries.map(function(entry) {
              var def = $.Deferred();
              self._traverseFileTree(entry, path + item.name + "/").then(function() {
                def.resolve();
              });
              return def.promise();
            });
            promises.push(self._traverseFileTree(item, path, dirReader));
            $.whenAll.apply($, promises).done(function() {
              deferred.resolve();
            });
          } else {
            deferred.resolve();
          }
        }, function() {
          GlobalMessage.showMessage("error", dndLang.dropNotPermitted);
          deferred.reject();
        });
      }
      return deferred.promise();
    },
    _executeUpload: function(options, status, files, singleItem, folderExists, fileExists) {
      var self = this;
      var fileDetails = CreationUtils.filterFiles(files);
      files = fileDetails.validFiles;
      var command;
      if (!(folderExists && fileExists)) {
        if (self.originatingView.type && self.originatingView.type === "uploadContent") {
          if (folderExists) {
            GlobalMessage.showMessage("error", dndLang.noFiles);
          } else if (files.length) {
            command = commands.get("D2-ImportFile");
            status.presetModel = self.model;
            options.files = files;
            command.execute(status, options);
          } else {
            GlobalMessage.showMessage("error", dndLang.uploadFolderActionNotSupported);
          }
        } else if (self.originatingView.type && self.originatingView.type === "uploadFolder") {
          if (fileExists) {
            GlobalMessage.showMessage("error", dndLang.noFolder);
          } else if (!singleItem) {
            GlobalMessage.showMessage("error", dndLang.multipleFolders);
          } else {
            status.originatingView = self.originatingView;
            command = commands.get("D2-ImportFolder");
            options.files = self.fileList;
            command.execute(status, options);
          }
        } else {
          if (folderExists) {
            if (base.isIE11() || base.isAppleMobile() || utils.isMobile()) {
              GlobalMessage.showMessage("error", dndLang.uploadFolderActionNotSupported);
            } else if (!singleItem) {
              GlobalMessage.showMessage("error", dndLang.multipleFolders);
            } else {
              status.originatingView = self.originatingView;
              command = commands.get("D2-ImportFolder");
              options.files = self.fileList;
              command.execute(status, options);
            }
          } else if (files.length) {
            command = commands.get("D2-ImportFile");
            status.presetModel = self.model;
            options.files = files;
            command.execute(status, options);
          } else {
            GlobalMessage.showMessage("error", dndLang.uploadFolderActionNotSupported);
          }
        }
      } else {
        GlobalMessage.showMessage("error", dndLang.fileAndFolderDrop);
      }
      this.originatingView.counter = 1;
      this.container.trigger("dragleave");
    },
    _onDrop: function(currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      var dataTransfer = currentEvent.originalEvent && currentEvent.originalEvent.dataTransfer, singleItem = dataTransfer.files.length === 1, self = this, items = dataTransfer.items, validItems = items && items.length && _.all(items, function(item) {
        return item.kind === "file";
      }), validTypes = dataTransfer.types && (dataTransfer.types.indexOf ? dataTransfer.types.indexOf("Files") !== -1 : dataTransfer.types.contains("Files"));
      if (!(validItems || validTypes)) {
        self.originatingView.counter = 1;
        self.container.trigger("dragleave");
        return;
      }
      if (RestResources.getCurrentUser().get("properties").client_capability <= 1) {
        GlobalMessage.showMessage("error", dndLang.uploadNotPermitted);
        self.originatingView.counter = 1;
        self.container.trigger("dragleave");
        return;
      }
      var options = {
        context: self.context
      };
      var status = {
        context: self.context,
        landingPageId: self.landingPageId
      };
      var files = dataTransfer.files;
      var folderExists = currentEvent.folderExists ? currentEvent.folderExists : false;
      var fileExists = currentEvent.fileExists ? currentEvent.fileExists : false;
      if (items) {
        self.fileList = [];
        var promises = _.map(items, function(item) {
          var def = $.Deferred();
          item = item.webkitGetAsEntry();
          if (item) {
            self._traverseFileTree(item).then(function() {
              def.resolve();
            });
            folderExists = item.isDirectory || folderExists;
            fileExists = item.isFile || fileExists;
          } else {
            def.resolve();
          }
          return def.promise();
        });
        $.whenAll.apply($, promises).done(function() {
          self._executeUpload.call(self, options, status, files, singleItem, folderExists, fileExists);
        });
      } else {
        self._executeUpload.call(self, options, status, files, singleItem, folderExists, fileExists);
      }
    },
    _onDragEnter: function(currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      this.originatingView.counter = this.originatingView.counter < 0 ? 1 : this.originatingView.counter + 1;
      var dataTransfer = currentEvent.originalEvent && currentEvent.originalEvent.dataTransfer, items = dataTransfer.items, validItems = items && items.length && _.all(items, function(item) {
        return item.kind === "file";
      }), validTypes = dataTransfer.types && (dataTransfer.types.indexOf ? dataTransfer.types.indexOf("Files") !== -1 : dataTransfer.types.contains("Files"));
      if (validItems || validTypes) {
        this.ui.dropMessageContainer.toggle(true);
        var singleFile = dataTransfer.items && dataTransfer.items.length === 1;
        this.ui.dropMessage.html(this.getMessage(this.originatingView, singleFile));
      }
    },
    _onDragOver: function(currentEvent) {
      if (currentEvent.originalEvent && currentEvent.originalEvent.dataTransfer) {
        currentEvent.originalEvent.dataTransfer.dropEffect = "copy";
      }
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
    },
    _onDragLeave: function(currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      this.originatingView.counter--;
      if (this.originatingView.counter === 0) {
        this.ui.dropMessage.empty();
        this.ui.dropMessageContainer.toggle(false);
        this.originatingView.counter = 0;
      }
    },
    getMessage: function(view, singleFile) {
      if (view.type && view.type === "uploadContent") {
        return singleFile ? dndLang.singleFileDrop : dndLang.multipleFilesDrop;
      } else if (view.type && view.type === "uploadFolder") {
        return dndLang.folderDrop;
      } else {
        return singleFile ? dndLang.singleItemDrop : dndLang.multipleItemsDrop;
      }
    }
  });
  return LandingPageDndView;
});