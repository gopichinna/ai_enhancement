/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/models/perspective/perspective.model", "csui/perspective.manage/impl/top.ribbon/top.ribbon.item.view", "csui/controls/globalmessage/globalmessage", "csui/utils/perspective/perspective.util", "i18n!csui/perspective.manage/impl/nls/lang", "css!csui/perspective.manage/impl/top.ribbon/top.ribbon" ], function(Marionette, PerspectiveModel, TopRibbonItemView, GlobalMessage, PerspectiveUtil, lang) {
  "use strict";
  const DEFAULT_PERSPECTIVE_LAYOUT = "sidepanel-right";
  let TopRibbonView = Marionette.CollectionView.extend({
    className: "csui-top-ribbon",
    tagName: "ul",
    childView: TopRibbonItemView,
    childViewOptions: function() {
      return {
        originatingView: this.options.parentView,
        parentView: this
      };
    },
    childViewTriggers: {
      "perspective:rendered": "child:perspective:rendered"
    },
    onChildPerspectiveRendered(child) {
      this.options.parentView.perspective = child.model;
      this.setActive(child);
      this.options.parentView.trigger("perspective:rendered");
      if (child.model.isNew()) {
        child.onClickPerspectiveName();
      }
    },
    constructor: function TopRibbonView(options = {}) {
      this.options = options;
      this.collection = this.options.parentView?.options?.collection;
      this.isPersonalizeMode = this.options.parentView.options.mode === PerspectiveUtil.MODE_PERSONALIZE;
      Marionette.CollectionView.prototype.constructor.call(this, options);
      this.onCollectionSync();
      this.listenTo(this, "add:new:perspective", this.addNewPerspective);
      this.collection.on({
        add: this.onAddToCollection.bind(this),
        remove: this.onRemoveFromCollection.bind(this),
        sync: this.onCollectionSync.bind(this)
      });
    },
    onShow: function() {
      if (this.isPersonalizeMode) return;
      try {
        this.addPerspectiveIfNotExists();
      } catch (err) {
        GlobalMessage.showMessage("error", lang.errLoadingPerspectives);
      }
    },
    onCollectionSync: function() {
      this.collection.modifiedCount = 0;
      this.options.parentView.toggleAddNewPageBtn(0);
    },
    onAddToCollection: function() {
      this.options.parentView.toggleAddNewPageBtn(++this.collection.modifiedCount);
    },
    onRemoveFromCollection: function(model) {
      if (!model.has("hasOnlybasicPerspectiveInfo")) this.options.parentView.toggleAddNewPageBtn(--this.collection.modifiedCount);
    },
    setActive: function(childView) {
      this.clearActive();
      childView.el.classList.add("binf-active");
      if (!this.options.parentView.isTopRibbonCarouselDisabled) {
        this.options.parentView.trigger("toggle:carousel");
      }
    },
    clearActive: function() {
      this.el.querySelectorAll(".csui-top-ribbon-item").forEach(ele => ele.classList.remove("binf-active"));
    },
    addNewPerspective: function(perspective, title) {
      let pModel = this.createNewPerspectiveModel(perspective, title);
      this.addPerspective(pModel);
    },
    createNewPerspectiveModel: function(perspective, title) {
      return new PerspectiveModel(this.preparePerspectiveConfig(perspective ?? {
        type: DEFAULT_PERSPECTIVE_LAYOUT,
        options: {}
      }, title));
    },
    addPerspectiveIfNotExists: function() {
      let currentPerspective = this.options.parentView.perspective;
      if (!this.getPerspectiveByTitle(currentPerspective.get("title"))) {
        currentPerspective.set("title", this.getNextPerspectiveName());
        this.addPerspective(currentPerspective, true);
      }
    },
    addPerspective: function(pModel, existing = false) {
      this.collection.add(pModel);
      const cView = this.children.last();
      const items = this.el.querySelectorAll(".csui-top-ribbon-item");
      existing ? cView.loadPerspective() : cView.updatePerspective();
      this.options.parentView.trigger("enable:carousel", items);
    },
    navigateToErrorPerspective: function(errorPerspective) {
      const cView = this.children.find(view => view.model?.get("title") == errorPerspective);
      cView?.loadPerspective();
    },
    preparePerspectiveConfig: function(pAttrs, title) {
      let perspectiveConfig = {
        cascading: "false",
        overrideType: "landingpage",
        scope: "global",
        node: null,
        nodepath: "",
        title: title ?? this.getNextPerspectiveName(),
        perspective: pAttrs
      };
      delete perspectiveConfig.perspective.canEditPerspective;
      return perspectiveConfig;
    },
    getNextPerspectiveName: function(title = "Home page 1", isDuplicate) {
      while (this.getPerspectiveByTitle(title)) {
        title = this.incPageNumber(title, isDuplicate);
      }
      return title;
    },
    getPerspectiveByTitle: function(title) {
      return this.collection?.find(model => model.get("title") === title);
    },
    incPageNumber: function(pageName, isDuplicate) {
      let title;
      try {
        title = isDuplicate ? this.incForDuplicatePage(pageName) : this.incForAddPage(pageName);
      } catch (err) {
        title = pageName + " " + new Date().getTime();
      }
      return title;
    },
    incForAddPage: function(pageName) {
      return pageName.replace(/(\d+)/, (match, num) => parseInt(num) + 1);
    },
    incForDuplicatePage: function(pageName) {
      return pageName.replace(/_(\d+)$/, (match, num) => "_" + (parseInt(num) + 1));
    }
  });
  return TopRibbonView;
});