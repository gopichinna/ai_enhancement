/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/connector", "nuc/models/node/node.model", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/controls/globalmessage/globalmessage", "csui/controls/draganddrop/draganddrop.view", "csui/controls/progressblocker/blocker", "dctmw/utils/rest.resources", "d2/utils/creation.utils", "d2/utils/constants", "dctmw/controls/list/sortable.list.view", "d2/controls/file.uploader/impl/uploaded.file.view", "d2/controls/file.uploader/impl/empty.file.list.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/ctf/ctfBridge", "i18n!d2/controls/file.uploader/impl/nls/lang", "i18n!d2/overrides/csui/controls/draganddrop/impl/nls/lang", "hbs!d2/controls/file.uploader/impl/file.uploader", "css!d2/controls/file.uploader/impl/file.uploader" ], function(_, $, Backbone, Marionette, ConnectorFactory, NodeModel, PerfectScrollingBehavior, LayoutViewEventsPropagationMixin, GlobalMessage, DragAndDropView, BlockingView, RestResources, CreationUtils, constants, SortableListView, UploadedFileView, EmptyFileListView, WizardTabableRegionBehavior, ctfBridge, lang, dndLang, template) {
  "use strict";
  var UploadedFileListView = SortableListView.extend({
    constructor: function UploadedFileListView() {
      this.behaviors = _.extend(this.behaviors, {
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          contentParent: ".d2-sortable-list",
          suppressScrollX: true,
          scrollYMarginOffset: 15
        }
      });
      SortableListView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "childview:show", function(childItem) {
        if (this.collection.length > 0) {
          childItem.$el.find(".remove-button").attr({
            tabindex: "0",
            title: lang.removeToolTip,
            "aria-label": lang.removeAria,
            role: "button"
          });
        }
      });
    },
    emptyView: EmptyFileListView,
    emptyViewOptions: function() {
      var options = {
        parentView: this.options.fileUploaderView
      };
      return _.extend(options, this.options);
    },
    childViewOptions: function(model) {
      var options = {
        itemView: UploadedFileView,
        itemIndex: this.collection.indexOf(model),
        parentCollection: this.collection,
        deleteAll: true,
        parentView: this.options.fileUploaderView
      };
      return _.extend(options, this.options);
    },
    onItemFocus: function(event) {
      var target = $(event.target);
      if (target.hasClass("d2-select") || target.hasClass("remove-button")) {
        this.currentFocusElem = target.closest(".sub-item");
        this.currentFocusElem.removeClass("select");
        this.currentFocusElem.addClass("focus");
      } else {
        this.currentFocusElem = target;
        this.currentFocusElem.removeClass("focus");
        this.currentFocusElem.addClass("select");
      }
    },
    onItemBlur: function(event) {
      var target = $(event.target);
      if (target.hasClass("d2-select") || target.hasClass("remove-button")) {
        target.closest(".sub-item").removeClass("focus");
      } else {
        target.removeClass("select");
      }
    },
    onKeyDown: function(event) {
      var me = this, preElem = me.currentFocusElem;
      if (!preElem || preElem.length === 0) {
        return;
      }
      if (event.ctrlKey) {
        me.keyboardReorderMode = true;
        switch (event.which) {
         case 38:
          event.preventDefault();
          event.stopPropagation();
          me._moveItemUp(preElem);
          break;

         case 40:
          event.preventDefault();
          event.stopPropagation();
          me._moveItemDown(preElem);
          break;

         default:
          return;
        }
        me.keyboardReorderMode = true;
        me._setFocus(preElem);
      } else {
        if (me.keyboardReorderMode) {
          me._commitItemMove(preElem);
          me.keyboardReorderMode = false;
        }
        switch (event.which) {
         case 46:
          me.executeDelete(preElem);
          break;

         case 13:
          if ($(event.target).hasClass("remove-button")) {
            me.executeDelete(preElem);
            break;
          }
          return;

         default:
          return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
    },
    onReorder: function(model) {
      var me = this;
      setTimeout(function() {
        var childItem = me.children.findByModel(model);
        if (childItem) {
          var focusEl = childItem.$el.find(".binf-dropdown .d2-select")[0];
          if (focusEl) {
            focusEl.focus();
          }
        }
      }, 50);
    },
    currentlyFocusedElement: function(event) {
      if (this.collection.length > 0) {
        var focusedEl;
        var buttonsList = this.$el.find('.d2-sortable-list [role="button"]');
        if (!!event && event.shiftKey) {
          focusedEl = buttonsList[buttonsList.length - 1];
        } else {
          focusedEl = buttonsList[0];
        }
        focusedEl && focusedEl.focus();
        return focusedEl;
      }
    },
    onLastTabElement: function(shiftTab, event) {
      return shiftTab && event.target === this.$("*[tabindex]")[0];
    },
    executeDelete: function(preElem) {
      if (this.options.fixedFileImport) {
        return;
      }
      this.deleteItem(preElem);
    }
  });
  var FileUploaderView = Marionette.LayoutView.extend({
    className: "d2-file-uploader",
    template: template,
    constructor: function FileUploaderView(options) {
      this.fullCollection = new Backbone.Collection();
      this.context = options.context;
      this.connector = this.context.getObject(ConnectorFactory);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this._filterFileFormats();
      this.listenTo(this.fullCollection, "add", this._updateFileCount.bind(this));
      this.listenTo(this.fullCollection, "remove", this._updateFileCount.bind(this));
      this.listenTo(this.collection, "reorder", this.syncFullCollection.bind(this));
      this.listenTo(this.fullCollection, "remove", this._removeItem.bind(this));
      this.propagateEventsToRegions();
      this.options = options || {};
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
      if (this.options.fixedFileImport) {
        this.$el.addClass("fixed-file-import");
      }
    },
    ui: {
      header: ".header",
      filesCount: ".header .count",
      addFile: ".add-file",
      fileBrowse: ".file-browser",
      uploadDropZone: ".upload-drop-zone",
      uploadedFileContainer: ".upload-file-container",
      dropFileMessageContainer: ".drop-file-message-container",
      itemCount: ".item-count"
    },
    regions: {
      uploadFileRegion: ".upload-file-container"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    events: {
      "change @ui.fileBrowse": "_onFileSelection",
      "click @ui.addFile": "onAddFile",
      "keydown @ui.addFile": "onAddFileKeyPress"
    },
    templateHelpers: function() {
      return {
        addFileLabel: lang.addFileLabel,
        filesTitle: lang.filesTitle,
        addFileToolTip: lang.addFileToolTip,
        addFileAria: lang.addFileAria,
        dropFileMessage: lang.dropFileMessage,
        iconName: "csui_action_add32"
      };
    },
    onRender: function() {
      this._updateFileCount();
      var options = _.extend({
        fileUploaderView: this
      }, this.options);
      options.collection = this.fullCollection;
      this.uploadedFileListView = new UploadedFileListView(options);
      this.uploadFileRegion.show(this.uploadedFileListView);
      var isSingleRepoPaste = this.options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE;
      if (isSingleRepoPaste) {
        this.ui.addFile.addClass("binf-hidden");
      } else {
        this.listenTo(this.uploadedFileListView, "lost:focus", function() {
          this._focusAddButton();
        });
      }
      this.importFileFromOptions();
      if (!isSingleRepoPaste && !this.options.fixedFileImport) {
        this.counter = 0;
        this.ui.uploadDropZone.on("drop", this._onDropFile.bind(this));
        this.ui.uploadDropZone.on("dragover", this._onDragOver.bind(this));
        this.ui.uploadDropZone.on("dragenter", this._onDragEnter.bind(this));
        this.ui.uploadDropZone.on("dragleave", this._onDragLeave.bind(this));
      } else {
        this.ui.uploadDropZone.on("drop", function($event) {
          $event.preventDefault();
          $event.stopPropagation();
        });
        this.ui.uploadDropZone.on("dragover", function($event) {
          $event.preventDefault();
          $event.stopPropagation();
        });
        this.ui.uploadDropZone.on("dragenter", function($event) {
          $event.preventDefault();
          $event.stopPropagation();
        });
      }
    },
    addFiles: function(files) {
      this._addFilesInCollection(files);
    },
    addFilteredFiles: function(files) {
      this._addFilesInCollection(files, true);
    },
    _addFilesInCollection: function(files, filterfiles) {
      var self = this, nodeList = this._getNodeList(files, filterfiles);
      function addNodeModelInCollection(nodeModel) {
        var dfd = $.Deferred();
        setTimeout(function() {
          self._addNewItemInCollection(nodeModel);
          dfd.resolve();
        });
        return dfd.promise();
      }
      if (nodeList && nodeList.length > 0) {
        self.blockActions();
        setTimeout(function() {
          var promises = [];
          self.fileAdding = true;
          for (var i = 0; i < nodeList.length; i++) {
            promises.push(addNodeModelInCollection(nodeList[i]));
          }
          $.whenAll.apply($, promises).always(function() {
            self.fileAdding = false;
            self._singleOptionsSelection();
            self._updateFileCount();
            self.unblockActions();
          });
        }, 10);
      }
    },
    importFileFromOptions: function() {
      var self = this;
      var filterFiles = true;
      var newFileFromIVPublish = this.options?.fileImportObject?.files;
      var files = newFileFromIVPublish ? newFileFromIVPublish : this.options.files;
      if (this.options.mode) {
        if (this.options.mode === "paste-single" || this.options.mode === "paste-multi") {
          filterFiles = false;
        }
      }
      if (filterFiles) {
        self.addFilteredFiles(files);
      } else {
        self.addFiles(files);
      }
    },
    getFileFormats: function() {
      return this.formatsCollection;
    },
    enableFooter: function() {
      if (this.fileAdding) {
        return;
      }
      this.footerDisabled = false;
      this.options.wizard.refreshFooter();
      return;
    },
    disableFooter: function() {
      this.footerDisabled = true;
      this.options.wizard.refreshFooter();
      return;
    },
    getTitle: function() {
      return this.options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE ? lang.pasteTitle : lang.uploadTitle;
    },
    onAddFile: function() {
      if (ctfBridge.isCtfEnabled()) {
        this._openCtfFileSelector();
      } else {
        this.ui.fileBrowse.trigger("click");
      }
    },
    onAddFileKeyPress: function(event) {
      switch (event.which) {
       case 40:
        this.uploadedFileListView.trigger("set:focus");
        break;

       case 13:
       case 32:
        this.onAddFile();
        break;

       default:
        return;
      }
    },
    _openCtfFileSelector: function() {
      ctfBridge.publishSelectFile(_.bind(function(filearr) {
        if (!!this.options.single && filearr.length > 1) {
          GlobalMessage.showMessage("error", dndLang.singleItemSelectErrorMessage);
        } else {
          var files = _.map(filearr, function(fileobj) {
            var filePath = fileobj["file_path"], fileSize = fileobj["file_size"], fileUuid = fileobj["file_uuid"], filename = filePath.replace(/^.*[\\\/]/, ""), file = {
              name: filename,
              path: filePath,
              size: fileSize,
              uuid: fileUuid,
              pluginMode: constants.BrowserPluginMode.WSCTF
            };
            return file;
          });
          this.addFilteredFiles(files);
        }
      }, this));
    },
    _filterFileFormats: function() {
      var formats = RestResources.getFormats().where({
        is_hidden: false
      });
      this.formatsCollection = new Backbone.Collection();
      this.formatsCollection.comparator = "description";
      this.formatsCollection.add(formats);
    },
    syncFullCollection: function(mdl) {
      var targetIndex, node = mdl.model, index = this.collection.indexOf(node);
      if (index === 0) {
        targetIndex = 0;
      } else {
        var beforeModel = this.collection.at(index - 1);
        var idx = this.fullCollection.indexOf(beforeModel);
        targetIndex = idx + 1;
      }
      var srcIndex = this.fullCollection.indexOf(node);
      if (srcIndex < targetIndex) {
        targetIndex--;
      }
      if (srcIndex !== targetIndex) {
        this.fullCollection.remove(node);
        this.fullCollection.add(node, {
          at: targetIndex
        });
      }
    },
    _updateFileCount: function() {
      var count = 0;
      this.collection.reset(null);
      this.fullCollection.each(function(node) {
        if (node.attributes.itemState !== constants.ItemStates.INVALID_ENDING) {
          this.collection.add(node);
          count++;
        }
      }, this);
      if (count > 0) {
        this.ui.itemCount.html("(" + count + ")");
        this.enableFooter();
      } else {
        this.ui.itemCount.html("");
        this.disableFooter();
      }
      if (this.fullCollection.length > 0) {
        this.ui.header.removeClass("binf-hidden");
        this.ui.uploadDropZone.removeClass("empty-list");
      } else {
        this.ui.header.addClass("binf-hidden");
        this.ui.uploadDropZone.addClass("empty-list");
      }
      setTimeout(this.resetTabIndex.bind(this), 500);
    },
    _removeItem: function() {
      if (this.options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
        if (this.fullCollection.length === 0) {
          this.options.wizard.close();
        }
      }
      this._singleOptionsSelection();
    },
    _singleOptionsSelection: function() {
      if (this.options.single && this.fullCollection.length > 0) {
        $(this.ui.addFile).addClass("binf-hidden");
      } else {
        $(this.ui.addFile).removeClass("binf-hidden");
      }
    },
    _onFileSelection: function(event) {
      var self = this;
      var files = event.currentTarget.files;
      if (!!this.options.single && files.length > 1) {
        GlobalMessage.showMessage("error", dndLang.singleItemSelectErrorMessage);
      } else {
        self.addFilteredFiles(files);
        this.ui.fileBrowse.val("");
        this._focusAddButton();
      }
    },
    _getNodeList: function(files, filterfiles) {
      function getNodeModel(item) {
        var file = item.file instanceof File ? item.file : item, fileSizeDetails = filterfiles && CreationUtils.filterFiles(file), validation = fileSizeDetails ? fileSizeDetails.status : true, options = {
          name: file.name,
          mime_type: file.type,
          uniqueId: _.uniqueId("file"),
          itemState: constants.ItemStates.NOT_VISITED
        };
        if (this.options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
          options["id"] = file.id;
        }
        if (this.options.fileImportObject) {
          options["fileImportUrl"] = this.options.fileImportObject.fileImportUrl;
          options["targetLocation"] = this.options.targetLocation;
        }
        if (!validation) {
          options.itemState = constants.ItemStates.INVALID_ENDING;
          options.errorMessage = file.message;
        }
        var nodeModel = new NodeModel(options, {
          context: this.context,
          connector: this.connector
        });
        nodeModel.contentFile = file;
        return nodeModel;
      }
      var nodeList = files && _.map(files, _.bind(function(item) {
        return getNodeModel.call(this, item);
      }, this));
      return nodeList;
    },
    _addNewItemInCollection: function(nodeModel) {
      this.fullCollection.add(nodeModel);
    },
    _focusAddButton: function() {
      this.ui.addFile.trigger("focus");
    },
    _onDropFile: function($event) {
      var event = $event.originalEvent;
      var self = this, folderCount = 0, fileCount = 0;
      var dataTransfer = event && event.dataTransfer || {
        files: event && event.target && event.target.files || []
      }, items = dataTransfer.items || [], validItems = items && items.length && _.all(items, function(item) {
        return item.kind === "file";
      }), validTypes = dataTransfer.types && (dataTransfer.types.indexOf ? dataTransfer.types.indexOf("Files") !== -1 : dataTransfer.types.contains("Files"));
      for (var i = 0; i < items.length; i++) {
        var item = items[i].webkitGetAsEntry();
        if (item && item.isDirectory) {
          folderCount++;
        }
        if (item && item.isFile) {
          fileCount++;
        }
      }
      if (!!this.options.single && items.length > 1) {
        GlobalMessage.showMessage("error", dndLang.singleItemDropErrorMessage);
      } else if (validTypes || validItems) {
        DragAndDropView.prototype.checkFiles(dataTransfer).always(function(files) {
          var onlyFiles = _.each(files, function(file) {
            return file instanceof Error;
          });
          if (folderCount && fileCount) {
            GlobalMessage.showMessage("error", dndLang.fileAndFolderDrop);
          } else if (folderCount) {
            GlobalMessage.showMessage("error", dndLang.noFiles);
          } else if (onlyFiles.length) {
            self.addFilteredFiles(onlyFiles);
          } else {
            if (!files.length) {
              GlobalMessage.showMessage("error", dndLang.uploadFolderActionNotSupported);
            }
          }
          event.dataTransfer.clearData || event.dataTransfer.clearData();
        });
      }
      this.ui.dropFileMessageContainer.toggle(false);
      this.counter = 0;
      $event.preventDefault();
      $event.stopPropagation();
    },
    _onDragOver: function($event) {
      if ($event.originalEvent && $event.originalEvent.dataTransfer) {
        $event.originalEvent.dataTransfer.dropEffect = "copy";
      }
      $event.preventDefault();
      $event.stopPropagation();
    },
    _onDragEnter: function($event) {
      var dt = $event.originalEvent.dataTransfer;
      if (dt.types && (dt.types.indexOf ? dt.types.indexOf("Files") !== -1 : dt.types.contains("Files"))) {
        this.counter++;
        this.ui.dropFileMessageContainer.toggle(true);
      }
    },
    _onDragLeave: function($event) {
      var dt = $event.originalEvent.dataTransfer;
      if (dt.types && (dt.types.indexOf ? dt.types.indexOf("Files") !== -1 : dt.types.contains("Files"))) {
        this.counter--;
        if (this.counter === 0) {
          this.ui.dropFileMessageContainer.toggle(false);
          this.counter = 0;
        }
      }
    },
    resetTabIndex: function() {
      var tabElements = this.$("*[tabindex]");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
    },
    onStepActive: function() {
      this.triggerMethod("tabable");
      setTimeout(this.resetTabIndex.bind(this), 500);
      this._focusAddButton();
    },
    onStepBeforeInactive: function() {
      this.triggerMethod("tabable:not");
    }
  });
  _.extend(FileUploaderView.prototype, LayoutViewEventsPropagationMixin);
  return FileUploaderView;
});