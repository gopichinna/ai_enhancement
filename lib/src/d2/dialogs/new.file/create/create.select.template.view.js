/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/table/table.view", "dctmw/controls/behaviors/clientside.infinite.scrolling.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/thumbnail/thumbnail.view", "csui/controls/progressblocker/blocker", "d2/utils/constants", "d2/dialogs/new.file/create/impl/template.header.view", "d2/models/base.default.action.items", "d2/dialogs/new.file/create/table.columns", "d2/dialogs/new.file/create/templates", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/new.file/create/thumbnail.content", "dctmw/utils/utils", "d2/utils/widgets.utils", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "hbs!d2/dialogs/new.file/create/impl/select.template", "css!d2/dialogs/new.file/create/impl/select.template" ], function(module, $, _, Backbone, Marionette, LayoutViewEventsPropagationMixin, TableView, InfiniteScrollingBehavior, PerfectScrollingBehavior, TabableRegionBehavior, ThumbnailView, BlockingView, constants, TemplateHeaderView, defaultActionItems, columns, TemplateCollection, WizardTabableRegionBehavior, ThumbnailContent, utils, widgetUtils, lang, template) {
  "use strict";
  var InfinitScrollingThumbnailView = ThumbnailView.extend({
    constructor: function InfinitScrollingThumbnailView(options) {
      if (options.context && options.context.viewStateModel.getViewState("order_by") === undefined) {
        options.context.viewStateModel.setViewState("order_by", "template_object_name_asc", {});
      }
      InfinitScrollingThumbnailView.__super__.constructor.apply(this, arguments);
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-template-body",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".d2-template-body",
        fetchMoreItemsThreshold: 80,
        fetchMoreItemLength: 10,
        content: ".csui-saved-item"
      }
    }
  });
  var InfiniteScrollingTableView = TableView.extend({
    constructor: function InfiniteScrollingTableView() {
      InfiniteScrollingTableView.__super__.constructor.apply(this, arguments);
    },
    ui: {
      row: ".csui-saved-item"
    },
    events: {
      "mousedown @ui.row": "onClick",
      keydown: "onKeyDown"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-template-body",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".d2-template-body",
        fetchMoreItemsThreshold: 80,
        fetchMoreItemLength: 10,
        content: ".csui-saved-item"
      }
    },
    onClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!$(event.target).hasClass("csui-checkbox") && !$(event.target).parent().hasClass("csui-checkbox")) {
        $(event.target).closest(".csui-saved-item").find(".csui-checkbox").trigger("click");
      }
    },
    onKeyDown: function(event) {
      if (event.keyCode === 9) {
        let nextFocusElement, recentCollapsibleGroup = $(".otc-collapsible-group.recent-collapsible-group"), recentCollapsibleGroupFocusableElement = $(recentCollapsibleGroup[0]?.shadowRoot)?.find(":focusable")?.length ? $(recentCollapsibleGroup[0].shadowRoot).find(":focusable")[0] : recentCollapsibleGroup, presetCollapsibleGroup = $(".otc-collapsible-group.preset-collapsible-group"), presetCollapsibleGroupFocusableElement = $(presetCollapsibleGroup[0]?.shadowRoot)?.find(":focusable")?.length ? $(presetCollapsibleGroup[0].shadowRoot).find(":focusable")[0] : presetCollapsibleGroup, footerBackButton = $(".footer-button-container .default-back-button");
        if (this._parent?.options?.el?.includes(".d2-recent-templates")) {
          if (event.shiftKey) {
            nextFocusElement = recentCollapsibleGroupFocusableElement;
          } else {
            nextFocusElement = presetCollapsibleGroupFocusableElement;
          }
        }
        if (this._parent?.options?.el?.includes(".d2-preset-templates")) {
          if (event.shiftKey) {
            nextFocusElement = presetCollapsibleGroupFocusableElement;
          } else {
            nextFocusElement = footerBackButton;
          }
        }
        if (nextFocusElement) {
          event.preventDefault();
          event.stopPropagation();
          nextFocusElement.focus();
        }
      }
    }
  });
  var WizardTabableBehavior = WizardTabableRegionBehavior.extend({
    constructor: function WizardTabableBehavior() {
      WizardTabableRegionBehavior.prototype.constructor.apply(this, arguments);
    },
    _applyClasses: function() {
      this._getContentParent().addClass(TabableRegionBehavior.accessibilityRegionClass);
    },
    _getContentParent: function() {
      var contentParent = this.getOption.call(this, "contentParent");
      if (contentParent) {
        if (contentParent.insertAfter) {
          return contentParent;
        }
        if (_.isElement(contentParent)) {
          return $(contentParent);
        }
        return this.view.$(contentParent);
      }
      return this.view.$el;
    },
    getOption: function(property, source) {
      var options = source || this.options || {};
      var value = options[property];
      return _.isFunction(value) ? options[property].call(this.view) : value;
    }
  });
  var TemplatesView = Marionette.LayoutView.extend({
    template: template,
    className: "d2-templates-wrapper",
    ui: {
      HeaderSection: ".d2-template-header",
      RUSection: ".d2-recent-templates",
      presetSection: ".d2-preset-templates",
      headerSection: ".d2-template-header",
      templateWrapper: ".d2-templates",
      listTableView: ".d2-preset-templates .d2-table .csui-table-view",
      listTableViewRU: ".d2-recent-templates .d2-table .csui-table-view",
      gridTableView: ".d2-preset-templates .cs-thumbnail-wrapper .csui-table-view",
      gridTableViewRU: ".d2-recent-templates .cs-thumbnail-wrapper .csui-table-view",
      gridView: ".d2-template-container .cs-thumbnail-wrapper",
      listView: ".d2-template-container .d2-table",
      sectionTitle: ".d2-templates .template-title"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-template-body"
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".d2-template-body",
        fetchMoreItemsThreshold: 80,
        fetchMoreItemLength: 10,
        content: ".csui-saved-item"
      },
      TabableRegion: {
        behaviorClass: WizardTabableBehavior,
        contentParent: ".d2-template-body"
      }
    },
    regions: {
      headerRegion: "@ui.HeaderSection",
      listTableRegion: "@ui.listTableView",
      listTableRegionRU: "@ui.listTableViewRU",
      thumbnailRegion: "@ui.gridTableView",
      thumbnailRegionRU: "@ui.gridTableViewRU"
    },
    templateHelpers: function() {
      return {
        presetTitle: lang.presetHeader,
        recentTitle: lang.recentHeader,
        recentTitleAriaLabel: lang.recentTitleAriaLabel,
        recentTitleListAriaLabel: lang.recentTitleListAriaLabel,
        recentTitleToggleAriaLabel: lang.recentTitleToggleAriaLabel,
        presetTitleAriaLabel: lang.presetTitleAriaLabel,
        presetTitleListAriaLabel: lang.presetTitleListAriaLabel,
        presetTitleToggleAriaLabel: lang.presetTitleToggleAriaLabel
      };
    },
    events: {
      "open .otc-collapsible-group": "onOpenCollapsibleGroup",
      "close .otc-collapsible-group": "onCloseCollapsibleGroup"
    },
    constructor: function TemplatesView(options) {
      var me = this;
      this.model = options.node;
      this.collectionClass = options.collectionClass;
      this.collection = options.templates;
      this.syncFlag = false;
      TemplatesView.__super__.constructor.call(this, options);
      this.options.templates.orderBy = "template_object_name asc";
      this.allTemplates = this.options.templates;
      this.ruTemplates = new TemplateCollection(undefined, {
        connector: options.node.connector,
        node: options.node,
        recentlyUsed: true,
        orderBy: "template_object_name asc"
      });
      this.allTemplates.sorting = {
        sort: [ "template_object_name" ]
      };
      this.ruTemplates.sorting = {
        sort: [ "template_object_name" ]
      };
      this.allTemplates.node = options.node;
      this.ruTemplates.node = options.node;
      this.ruTemplates.setLimit(0, 5, false);
      this.listenTo(this.allTemplates, "sync", function() {
        if (_.isEmpty(me.allTemplates.filters)) {
          me._setRecentContainer();
          me.syncFlag = true;
        }
      }, this);
      this.ruTemplates.fetch().always(function() {
        me._setRecentContainer();
        me.syncFlag = true;
      });
      this.defaultActionItems = defaultActionItems;
      this.isThumbnail = false;
      this.propagateEventsToRegions();
      this.listenTo(this, "reloadTiles", this.reloadView);
      this.nextButtonDisabled = true;
      this.isLinkedDoc = options.isLinkedDoc;
      this.onWinResize = _.bind(function() {
        this._setHeight();
      }, this);
      $(window).on("resize", this.onWinResize);
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.options.wizard.canAddItems = function() {
        return false;
      };
      this.options.wizard.addItemsPermissions = function() {
        return false;
      };
      var self = this;
      this.listenTo(this.allTemplates, "sync", function() {
        if (self.tableView.table) {
          self.tableView.table.draw();
        }
        self.unblockActions();
        self.thumbnail.$el.find(".csui-thumbnail-item:not([tabindex])").attr("tabindex", "0");
        self.refreshAccessability();
        self._setRecentContainer();
      });
      this.listenTo(this.ruTemplates, "sync", function() {
        if (self.tableViewRU.table) {
          self.tableViewRU.table.draw();
        }
        self.thumbnail1.$el.find(".csui-thumbnail-item:not([tabindex])").attr("tabindex", "0");
        self.refreshAccessability();
        self._setRecentContainer();
      });
    },
    selectTemplate: function(selectTable, deselectTable) {
      var selectedRowsCount = selectTable.getSelectedChildren().length;
      if (selectedRowsCount > 0) {
        deselectTable.clearChildrenSelection();
        this._template = selectTable.getSelectedChildren()[0];
        this.nextButtonDisabled = false;
        this.options.wizard.refreshFooter();
      }
    },
    deselectTemplate: function(args) {
      if (args && args.sender) {
        this._template = undefined;
        this.nextButtonDisabled = true;
        this.options.wizard.refreshFooter();
      }
    },
    validate: function() {
      if (this._template) {
        return true;
      }
      return false;
    },
    onRender: function() {
      this.templateHeaderView = new TemplateHeaderView({
        columns: this.allTemplates.columns,
        context: this.context,
        columnsWithSearch: this.options.columnsWithSearch,
        filterBy: this.options.filterBy,
        collection: this.allTemplates,
        ruCollection: this.ruTemplates,
        thumbnailView: this.thumbnail,
        parentView: this,
        isThumbnail: this.isThumbnail,
        wizard: this.options.wizard
      });
      this.headerRegion.show(this.templateHeaderView);
      this._setThumbnailView();
      this._setTableView();
      this._setView();
      this.setInitialStateForCollapsibleGroups();
    },
    _setHeight: function() {
      $(this.ui.presetSection).css("max-height", "auto");
      $(".d2-template-container").css("height", "");
      if (this.isThumbnail && $(this.ui.templateWrapper).height() < 500) {
        $(this.ui.RUSection).css("height", "100%");
      } else {
        $(this.ui.RUSection).css("height", "auto");
      }
      $(this.$el).find(".dataTables_wrapper").css("height", "100%");
      var height = $(this.ui.templateWrapper).innerHeight() - ($(this.ui.headerSection).outerHeight() + $(this.ui.RUSection).outerHeight() + 34);
      if (this.ruTemplates.length === 0 && !$(this.ui.RUSection).hasClass("binf-hidden") || this.allTemplates.length === 0) {
        $(this.ui.RUSection).removeClass("d2-recent-empty");
        if (this.ruTemplates.length === 0 && this.allTemplates.length !== 0) {
          $(this.ui.RUSection).addClass("d2-recent-empty");
        } else {
          $(".d2-template-container").css("height", "45%");
        }
        $(this.$el).find(".dataTables_wrapper").css("height", "auto");
      } else {
        $(this.ui.presetSection).css({
          "max-height": height,
          height: height
        });
      }
    },
    reloadView: function() {
      this.isThumbnail = !this.isThumbnail;
      this._setView();
    },
    _setView: function() {
      var selected = this.allTemplates.where({
        csuiIsSelected: true
      }).length;
      var selected1 = this.ruTemplates.where({
        csuiIsSelected: true
      }).length;
      if (this.isThumbnail) {
        this.showThumbNails();
        $(this.ui.gridView).removeClass("binf-hidden");
        $(this.ui.listView).addClass("binf-hidden");
        $(this.ui.sectionTitle).addClass("d2-grid-border");
        if (selected === 0) {
          this.thumbnail.clearChildrenSelection();
        } else {
          this.thumbnail.updateSelection(this.allTemplates.where({
            csuiIsSelected: true
          })[0]);
        }
        if (selected1 === 0) {
          this.thumbnail1.clearChildrenSelection();
        } else {
          this.thumbnail1.updateSelection(this.ruTemplates.where({
            csuiIsSelected: true
          })[0]);
        }
      } else {
        $(this.ui.gridView).addClass("binf-hidden");
        $(this.ui.listView).removeClass("binf-hidden");
        $(this.ui.sectionTitle).removeClass("d2-grid-border");
        if (selected === 0) {
          this.tableView.clearChildrenSelection();
        } else {
          this.tableView.updateSelection(this.allTemplates.where({
            csuiIsSelected: true
          })[0]);
        }
        if (selected1 === 0) {
          this.tableViewRU.clearChildrenSelection();
        } else {
          this.tableViewRU.updateSelection(this.ruTemplates.where({
            csuiIsSelected: true
          })[0]);
        }
      }
      this._setHeight();
    },
    _setTableView: function() {
      this.blockActions();
      this.options || (this.options = {});
      this.options.pageSize = 30;
      this.options.ddItemsList = [ 30, 60, 100 ];
      var args = _.extend({
        tableColumns: columns,
        connector: this.model.connector,
        collection: this.allTemplates,
        columns: this.allTemplates.columns,
        thumbnailColumns: columns,
        columnsWithSearch: [],
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.wizard,
        selectedChildren: new TemplateCollection(),
        inlineBar: {
          options: {}
        },
        selectRows: "single",
        enableSorting: false,
        customLabels: {
          emptySearchTable: lang.noResults,
          emptyTable: lang.noResults,
          zeroRecords: lang.noResults
        }
      }, this.options);
      args.allTemplates = this.allTemplates;
      delete args.blockingParentView;
      this.tableView = new InfiniteScrollingTableView(args);
      this.listenTo(this.tableView, "tableHeaderRendered", function() {
        if (this.tableView) {
          this.tableView.$el.find(".csui-table-cell-_select").html("");
        }
      }, this);
      this.tableView.enableEmptyViewText();
      var args1 = _.extend({
        tableColumns: columns,
        connector: this.model.connector,
        collection: this.ruTemplates,
        columns: this.ruTemplates.columns,
        thumbnailColumns: columns,
        columnsWithSearch: [],
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.wizard,
        selectRows: "single",
        inlineBar: {
          options: {}
        },
        selectedChildren: new TemplateCollection(),
        enableSorting: false,
        customLabels: {
          emptySearchTable: lang.noResults,
          emptyTable: lang.noResults,
          zeroRecords: lang.noResults
        }
      }, this.options);
      args1.ruTemplates = this.ruTemplates;
      delete args1.blockingParentView;
      this.tableViewRU = new InfiniteScrollingTableView(args1);
      this.listenTo(this.tableViewRU, "tableHeaderRendered", function() {
        if (this.tableViewRU) {
          this.tableViewRU.$el.find(".csui-table-cell-_select").html("");
        }
      }, this);
      this.tableViewRU.enableEmptyViewText();
      this.listTableRegion.show(this.tableView);
      this.listTableRegionRU.show(this.tableViewRU);
      this.listenTo(this.tableView, "tableRowSelected", function() {
        this.selectTemplate(this.tableView, this.tableViewRU);
      }, this);
      this.listenTo(this.tableViewRU, "tableRowSelected", function() {
        this.selectTemplate(this.tableViewRU, this.tableView);
      }, this);
      this.listenTo(this.tableView, "tableRowUnselected", this.deselectTemplate);
      this.listenTo(this.tableViewRU, "tableRowUnselected", this.deselectTemplate);
      this.unblockActions();
    },
    _setThumbnailView: function() {
      this.options || (this.options = {});
      this.options.pageSize = 30;
      this.options.ddItemsList = [ 30, 60, 100 ];
      var args = _.extend({
        tableColumns: columns,
        connector: this.model.connector,
        collection: this.allTemplates,
        columns: this.allTemplates.columns,
        thumbnailColumns: columns,
        columnsWithSearch: [],
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.wizard,
        selectedChildren: new TemplateCollection(),
        allSelectedNodes: new TemplateCollection(),
        inlineBar: {
          options: {}
        },
        selectRows: "single",
        selectThumbnails: "single",
        selectionImpl: "d2_templates",
        thumbnailContent: ThumbnailContent,
        d2IgnoreInlineActions: true
      }, this.options);
      args.allTemplates = this.allTemplates;
      delete args.blockingParentView;
      this.thumbnail = new InfinitScrollingThumbnailView(args);
      var self = this;
      this.listenToOnce(this.thumbnail, "render", function() {
        self.thumbnail.$el.find(".csui-thumbnail-item:not([tabindex])").attr("tabindex", "0");
        self.refreshAccessability();
      });
      var args1 = _.extend({
        tableColumns: columns,
        connector: this.model.connector,
        collection: this.ruTemplates,
        columns: this.ruTemplates.columns,
        thumbnailColumns: columns,
        columnsWithSearch: [],
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.wizard,
        selectRows: "single",
        selectThumbnails: "single",
        selectionImpl: "d2_templates",
        thumbnailContent: ThumbnailContent,
        inlineBar: {
          options: {}
        },
        selectedChildren: new TemplateCollection(),
        allSelectedNodes: new TemplateCollection(),
        d2IgnoreInlineActions: true
      }, this.options);
      args1.ruTemplates = this.ruTemplates;
      delete args1.blockingParentView;
      this.thumbnail1 = new InfinitScrollingThumbnailView(args1);
      this.listenTo(this.thumbnail, "thumbnailSelected", function(args) {
        this._template = args.nodes[0];
        if (this._template) {
          this.thumbnail1.clearChildrenSelection();
        }
        this.refreshFooter(args);
      });
      this.listenTo(this.thumbnail1, "thumbnailSelected", function(args) {
        this._template = args.nodes[0];
        if (this._template) {
          this.thumbnail.clearChildrenSelection();
        }
        this.refreshFooter(args);
      });
      this.listenTo(this.thumbnail, "thumbnailUnSelected", function(args) {
        this.refreshFooter(args);
      });
      this.listenTo(this.thumbnail1, "thumbnailUnSelected", function(args) {
        this.refreshFooter(args);
      });
      this.thumbnailsRendered = false;
    },
    showThumbNails: function() {
      if (!this.thumbnailsRendered) {
        this.thumbnailRegion.show(this.thumbnail);
        this.thumbnailRegionRU.show(this.thumbnail1);
        this.thumbnailsRendered = true;
      }
    },
    getTitle: function() {
      return this.isLinkedDoc ? lang.templatesLinkedDocTitle : lang.templatesTitle;
    },
    refreshFooter: function() {
      this._template = this._template && this._template.get("csuiIsSelected") ? this._template : undefined;
      if (this._template) {
        this.nextButtonDisabled = false;
      } else {
        this.nextButtonDisabled = true;
      }
      this.options.wizard.refreshFooter();
    },
    refreshAccessability: function() {
      $(this.$el.find(".csui-thumbnail-item")).off("keydown").on("keydown", function(event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
          $(this).find("input").trigger("click");
        }
      });
    },
    onBeforeDestroy: function() {
      $(this.$el.find(".csui-thumbnail-item")).off("keydown");
    },
    _setRecentContainer: function() {
      if (_.isEmpty(this.allTemplates.filters)) {
        if (this.ruTemplates.length === 0) {
          $(".otc-collapsible-group.recent-collapsible-group").addClass("binf-hidden");
          this.ui.RUSection.addClass("binf-hidden");
        } else {
          $(".otc-collapsible-group.recent-collapsible-group").removeClass("binf-hidden");
          this.ui.RUSection.removeClass("binf-hidden");
        }
      }
      this._setHeight();
    },
    onShow: function() {
      if (this.syncFlag) {
        this._setRecentContainer();
      }
    },
    onOpenCollapsibleGroup: function(event) {
      if ($(event?.target)?.hasClass("recent-collapsible-group")) {
        !this.isThumbnail && this.tableViewRU._adjustColumns();
        this.storeCollapsibleGroupStateInfo("recent", "expanded");
      }
      if ($(event?.target)?.hasClass("preset-collapsible-group")) {
        !this.isThumbnail && this.tableView._adjustColumns();
        this.storeCollapsibleGroupStateInfo("preset", "expanded");
      }
    },
    onCloseCollapsibleGroup: function(event) {
      if ($(event?.target)?.hasClass("recent-collapsible-group")) {
        !this.isThumbnail && this.tableViewRU._adjustColumns();
        this.storeCollapsibleGroupStateInfo("recent", "collapsed");
      }
      if ($(event?.target)?.hasClass("preset-collapsible-group")) {
        !this.isThumbnail && this.tableView._adjustColumns();
        this.storeCollapsibleGroupStateInfo("preset", "collapsed");
      }
    },
    storeCollapsibleGroupStateInfo: function(groupKey, state) {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT);
      var key = widgetUtils.getRepoUserName() + "_" + groupKey;
      namedLocalStorage.set(key, state);
    },
    retrieveCollapsibleGroupStateInfo: function(groupKey) {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT);
      var key = widgetUtils.getRepoUserName() + "_" + groupKey;
      return namedLocalStorage.get(key);
    },
    setInitialStateForCollapsibleGroups: function() {
      let recentCollapsibleGroup = this.$(".otc-collapsible-group.recent-collapsible-group"), presetCollapsibleGroup = this.$(".otc-collapsible-group.preset-collapsible-group");
      if (this.retrieveCollapsibleGroupStateInfo("recent") === "expanded") {
        recentCollapsibleGroup.attr("expanded", "");
      }
      if (this.retrieveCollapsibleGroupStateInfo("preset") === "expanded") {
        presetCollapsibleGroup.attr("expanded", "");
      }
    }
  });
  _.extend(TemplatesView.prototype, LayoutViewEventsPropagationMixin);
  return TemplatesView;
});