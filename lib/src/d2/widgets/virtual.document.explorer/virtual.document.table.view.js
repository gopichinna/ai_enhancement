/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.mask", "csui/utils/commands", "csui/utils/contexts/factories/node", "d2/controls/dialog/nonoverflowing.dialog.view", "d2/models/virtual.document.children.browsable", "d2/utils/contexts/context.controller", "d2/utils/vdoc.toolbaritems", "d2/utils/vdoc.toolbaritems.mask", "d2/utils/constants", "d2/utils/contexts/factories/virtual.document.children.factory", "d2/utils/vdoc.utils", "d2/widgets/widgettable/widgettable.view", "dctmw/utils/authenticators/session", "d2/models/vdoc.client.columns", "css!d2/widgets/virtual.document.explorer/impl/virtual.document.table" ], function(_, $, Backbone, Marionette, ToolItemsFactory, ToolItemsMask, vDocCommands, NodeModelFactory, NonOverflowingDialogView, VirtualDocumentChildrenBrowsableCollection, D2ContextController, vDocToolItems, VDocToolItemsMask, constants, VDocChildrenFactory, vdUtil, D2WidgetTable, Session, VDocTableColumns) {
  "use strict";
  var VirtualDocumentTableView = D2WidgetTable.extend({
    constants: {
      DEFAULT_SORT: vdUtil.PROP_VDM_NUMBER + " asc"
    },
    className: function() {
      var zuper = VirtualDocumentTableView.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " d2-vdoc-table";
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function VirtualDocumentTableView(options) {
      options = options || {};
      var context = options.context, model = options.model || context.getModel(NodeModelFactory), isVDSnapshot = vdUtil.isVDSnapshot(model), collection = options.collection || new VirtualDocumentChildrenBrowsableCollection(undefined, {
        autoreset: true,
        node: model,
        exploreAsSnapshot: isVDSnapshot,
        mirrorInstance: options.vdTreeCollection
      });
      if (!(collection instanceof VirtualDocumentChildrenBrowsableCollection)) {
        throw new Error("VD table view requires an instance of VirtualDocumentChildrenBrowsableCollection");
      }
      collection.perspectiveNode = model;
      collection.columns = model.columns;
      model._fetchMenuNewObjectItems = false;
      options.model = model;
      options.container = options.container || model;
      options.collection = collection;
      options.commands = vDocCommands;
      options.toolbarItems = {
        filterToolbar: new ToolItemsFactory(),
        addToolbar: new ToolItemsFactory(),
        leftToolbar: new ToolItemsFactory(),
        tableHeaderToolbar: vDocToolItems.tableViewHeaderToolbar,
        captionMenuToolbar: new ToolItemsFactory(),
        inlineActionbar: vDocToolItems.tableViewInlineActionBar,
        configurationToolbar: new ToolItemsFactory(),
        rightToolbar: vDocToolItems.tableviewRightBar
      };
      options.toolbarItems.inlineActionbar.options["commands"] = vDocCommands;
      options.headermenuItems = {
        headerMenuToolbar: new ToolItemsFactory()
      };
      var toolItemsMask = new VDocToolItemsMask(options);
      options.toolbarItemsMasks = {
        toolbars: {
          filterToolbar: toolItemsMask,
          addToolbar: toolItemsMask,
          leftToolbar: toolItemsMask,
          tableHeaderToolbar: toolItemsMask,
          captionMenuToolbar: toolItemsMask,
          inlineActionbar: toolItemsMask,
          configurationToolbar: toolItemsMask,
          rightToolbar: new ToolItemsMask({
            blacklist: [],
            whitelist: [ "D2-TableSettings", "D2-TableViewClose" ]
          }, {
            normalize: true
          })
        }
      };
      options.headermenuItemsMask = toolItemsMask;
      options.isDragNDropSuppoertedWidget = false;
      options.showSelectionCounter = true;
      options.urlParamsList = [];
      options.isExpandedView = true;
      options.d2tableColumns = VDocTableColumns;
      this.restorableNodeTreeState = D2ContextController.getTreeState();
      D2ContextController.setTreeState();
      this.isVDSnapshot = isVDSnapshot;
      this._lastContainerId = options.container.get("id");
      D2WidgetTable.prototype.constructor.call(this, options);
      this.listenTo(options.container, "change:id", function() {
        var currentContainerId = this.options.container.get("id");
        if (currentContainerId !== this._lastContainerId) {
          this._lastContainerId = currentContainerId;
          this._changingContainer();
        }
      }.bind(this));
    },
    initialize: function() {
      return D2WidgetTable.prototype.initialize.apply(this, arguments);
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.VIRTUAL_DOCUMENTS;
    },
    getTitle: function() {
      return this.options.container && this.options.container.get("name") || "";
    },
    getExtraIconConfig: function() {
      return _.pick(this.options.container && this.options.container.attributes || {}, [ "rIsVirtualDoc", "r_is_virtual_doc", "rAssembledFromId", "r_assembled_from_id", "i_contents_id" ]);
    },
    setTableView: function(options) {
      options = options || {};
      options.enableDragNDrop = false;
      options.enableViewState = false;
      if (this.tableColumns) {
        this.tableColumns.at(0).set({
          sequence: 3
        });
        this.tableColumns.add([ {
          key: vdUtil.PROP_VDM_NUMBER,
          widthFactor: 1.2,
          sequence: 2,
          permanentColumn: true
        }, {
          key: "name",
          sequence: 4,
          widthFactor: 1.5
        } ]);
      }
      return D2WidgetTable.prototype.setTableView.apply(this, arguments);
    },
    _changingContainer: function() {
      var tContainer = this.tableToolbarView && this.tableToolbarView.container;
      if (tContainer) {
        tContainer.clear({
          silent: true
        });
        tContainer.set(_.extend({
          id: this.getWidgetTypeId(),
          name: this.getTitle()
        }, this.getExtraIconConfig()));
      }
      this.collection.fetch({
        skipMergeWithMirrorOnFetch: true,
        reload: true
      });
    },
    onViewStateChanged: function() {},
    onBeforeDestroy: function() {
      D2ContextController.setTreeState(this.restorableNodeTreeState);
    },
    _beforeExecuteCommand: function(eventArgs) {
      D2WidgetTable.prototype._beforeExecuteCommand.call(this, eventArgs);
      if (eventArgs && eventArgs.status) {
        eventArgs.status.modalDialogContainer = this.$el.closest(".binf-modal.d2-vdoc-table-dialog");
      }
    }
  }, {
    show: function(options) {
      options = options || {};
      var view = new VirtualDocumentTableView(options);
      view.dialog = new NonOverflowingDialogView({
        className: "d2-vdoc-table-dialog",
        largeSize: true,
        view: view,
        headerView: new Marionette.ItemView({
          template: false
        })
      });
      view.dialog.once("dialog:shown", function() {
        var model = view.model, promise = $.Deferred().resolve().promise();
        model.showVdmSequenceColumn = true;
        if (!model.columns || !model.columns.length) {
          promise = model.resetWidgetPreference();
        }
        promise.then(view.collection.fetch.bind(view.collection, {
          skipMergeWithMirrorOnFetch: true
        })).fail(function() {
          view.dialog.kill();
        });
      });
      view.dialog.listenToOnce(view, "destroy", function() {
        if (view.dialog._isDialogDestroying !== true) {
          view.dialog.kill();
        }
      });
      view.listenTo(options.context, "before:change:perspective", function() {
        view.dialog.kill();
        view.destroy();
      });
      view.listenTo(Session.get(), "end", () => {
        view.dialog.kill();
        view.destroy();
      });
      view.dialog.show();
      return view;
    }
  });
  return VirtualDocumentTableView;
});