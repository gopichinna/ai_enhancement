/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/dialogs/members.picker/impl/member.list/list.item.view", "csui/controls/progressblocker/blocker", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/list/emptylist.view", "csui/themes/csui.jato.mime.illustrations", "smart/themes/theming", "csui/behaviors/collection.state/collection.state.behavior", "csui/controls/list/list.state.view", "hbs!csui/dialogs/members.picker/impl/member.list/member.list", "hbs!csui/dialogs/members.picker/impl/member.list/empty.members.list", "csui/dialogs/members.picker/impl/member.list/toolbaritems", "i18n!csui/dialogs/members.picker/impl/nls/lang", "css!csui/dialogs/members.picker/impl/member.list/member.list" ], function(_, $, Marionette, ListItem, BlockingView, TabableRegion, EmptyListView, jatoMIMEIllustrations, theming, CollectionStateBehavior, ListStateView, listTemplate, emptyTemplate, tileViewToolbarItems, lang) {
  "use strict";
  var MemberListView = Marionette.CompositeView.extend({
    className: "cs-list csui-mp-no-empty",
    template: listTemplate,
    childViewContainer: ".binf-list-group",
    childView: ListItem,
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        text: lang.jatoEmptyViewText,
        emptyJatoIllustration: jatoMIMEIllustrations.illustrationsNoUser
      };
    },
    childViewOptions: function() {
      return {
        locationEle: this.ui.location,
        toolbarData: {
          toolbaritems: this.tileViewToolbarItems,
          collection: this.collection
        },
        context: this.context,
        isMemberListItem: true
      };
    },
    childEvents: {
      "click:item": "onItemClick",
      "before:add:child": "onBeforeAddChild"
    },
    ui: {
      listParent: ".list-content",
      list: ".binf-list-group",
      location: ".binf-search-location-group"
    },
    events: {
      keydown: "onKeyInView"
    },
    onBeforeAddChild: function(child) {
      var validTarget = this.commandType.validateTarget(child.model);
      child.setValidity(validTarget);
    },
    onAddChild: function(child) {
      var id = child.model.get("id");
      if (!!this.selectedItem && this.selectedItem.model.get("id") === id) {
        this.selectedItem = child;
        this.toggleSelectedChild(child);
      }
      if (!this.commandType.validateMember(child.model)) {
        child.$el.hide();
      } else {
        child.$el.addClass("csui-acc-focusable");
      }
      if (!this.commandType.isSelectable(child.model) && !this._isBrowsable(child.model)) {
        child.$el.addClass("csui-disabled");
        var disabledTitle = _.str.sformat(lang.disabledItemTypeNameAria, child.model.get("type_name"), child.model.get("name"));
        child.$el.attr("aria-label", disabledTitle);
      }
      if (this._isBrowsable(child.model)) {
        child?.ui?.link?.attr("aria-haspopup", "true");
        child?.ui?.link?.attr("aria-expanded", "false");
      } else {
        child?.ui?.link?.removeAttr("aria-haspopup");
        child?.ui?.link?.removeAttr("aria-expanded");
      }
      if (this.browsedChild && this.browsedChild.model.get("id") === id) {
        this.browsedChild = child;
        this.toggleBrowsedChild(child);
      }
      return true;
    },
    collectionEvents: {
      sync: "syncUpdate",
      reset: "rebuild"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    isTabable: function() {
      return this.children.find(function(view) {
        var $el = view.$el;
        return $el.is(":visible") && !$el.is(":disabled");
      });
    },
    currentlyFocusedElement: function() {
      var focusables = this.$el.find(".binf-list-group-item.csui-acc-focusable");
      if (focusables.length) {
        return $(focusables[this.focusIndex]);
      } else {
        return $();
      }
    },
    setFocus: function() {
      var focusables = this.$el.find(".binf-list-group-item.csui-acc-focusable");
      $(focusables[this.focusIndex]).trigger("focus");
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, focusables = this.$el.find(".binf-list-group-item.csui-acc-focusable");
      switch (keyCode) {
       case 38:
       case 40:
        if (keyCode === 38) {
          this.focusIndex > 0 && --this.focusIndex;
        } else {
          this.focusIndex < focusables.length && ++this.focusIndex;
        }
        this.trigger("changed:focus");
        $(focusables[this.focusIndex]).trigger("focus");
        break;
      }
    },
    constructor: function MemberListView(options) {
      options || (options = {});
      _.defaults(options, {
        pageSize: 30
      });
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.jQuery = $;
      BlockingView.imbue(this);
      this.tileViewToolbarItems = tileViewToolbarItems;
      this.context = options.context;
      this.container = options.container;
      this.groupId = options.groupId;
      this.authUser = options.authUser;
      this.selectedGroup = options.selectedGroup;
      this.node = options.node;
      this.edit_permission = options.edit_permission;
      this.selectedItem = options.selection ? options.selection : null;
      this.blockScroll = true;
      this.notFetching = true;
      this.init = true;
      this.nextCollectionPage = _.bind(this.addNextCollectionPage, this);
      this.removedItemCollection = [];
      this.commandType = options.commandType;
      this.focusIndex = 0;
      this.collection?.on("remove", this._checkOpenGroups, this);
      this.collection?.on("remove", this._enableApplyMethod, this);
      this.listenTo(this.collection, "remove", function() {
        if (this.collection.length === 0) {
          this.setEmptyMemberTemplate();
        }
      });
      this.listenTo(this.collection, "sync", function() {
        this.ui.listParent.find("p.csui-members-empty").remove();
        if (this.collection.length === 0) {
          this.setEmptyMemberTemplate();
        } else {
          this.ui.listParent.removeClass("csui-members-empty");
        }
      });
      this.listenTo(this.collection, "request", this.setBlocker);
      this.listenTo(this.collection, "reset", this.setBlocker);
      this.listenTo(this, "browse:complete", function() {
        this.notFetching = true;
      });
    },
    setEmptyMemberTemplate: function() {
      if (!theming.isJATOTheme()) {
        this.$el.addClass("csui-mp-no-empty");
        this.ui.listParent.addClass("csui-members-empty");
        var emptyEl = emptyTemplate.call(this, {
          emptyTableText: lang.emptyMembersText
        });
        this.ui.listParent.append(emptyEl);
      }
    },
    syncUpdate: function() {
      this.$el?.removeClass("csui-mp-no-empty");
      this.nextTriggerSetting = this.options.pageSize / 2;
      this.blockScroll = true;
      this.notFetching = true;
      this.init = true;
      if (this.browsedChild && !this.collection.findWhere({
        id: this.browsedChild.model.get("id")
      })) {
        this.browsedChild = undefined;
      }
      this.unblockActions();
      this.currentlyFocusedElement().attr("tabindex", -1);
    },
    rebuild: function() {
      this.ui.listParent.find("p.csui-members-empty").remove();
      if (this.collection.length === 0) {
        this.setEmptyMemberTemplate();
      } else {
        this.ui.listParent.removeClass("csui-members-empty");
      }
      this.reset();
      this.trigger("dom:refresh");
    },
    reset: function() {
      this.init = true;
    },
    stopBlocker: function() {
      this.unblockActions();
      return true;
    },
    setBlocker: function() {
      if (this.blockScroll) {
        this.blockScroll = false;
        this.blockActions();
      }
      return true;
    },
    addNextCollectionPage: function() {
      var collectionLength = this.collection.length, scrollableHeight = this.ui.list.height() - this.ui.listParent.height(), scrollRelativePos = this.ui.listParent.scrollTop() / scrollableHeight, nextJump = (collectionLength - this.nextTriggerSetting) / collectionLength;
      if (collectionLength && collectionLength + this.context?.memberListView?.removedItems?.length < this.collection?.totalCount && scrollRelativePos >= nextJump) {
        if (this.notFetching) {
          this.notFetching = false;
          this.collection.setSkip(collectionLength + this.context?.memberListView?.removedItems?.length, false);
          this.collection.fetch({
            reset: false,
            remove: false,
            merge: false
          });
        }
        if (scrollRelativePos > .98 && this.init) {
          this.setBlocker();
          this.init = false;
        }
      }
    },
    onDomRefresh: function() {
      if (!this.scrollBar) {
        this.scrollBar = this.ui.listParent;
        this.scrollBar.on("scroll", this.nextCollectionPage);
      }
    },
    onItemClick: function(child) {
      if (child.$el.hasClass("csui-disabled")) {
        return;
      }
      this.focusIndex = child._index ?? this.focusIndex;
      this._processClickedItem(child);
    },
    _processClickedItem: function(child) {
      if (this.notFetching) {
        this.notFetching = false;
        var browseable = this._isBrowsable(child.model);
        if (!browseable) {
          this._targetSelection(child);
        } else {
          this._browseSelection(child);
        }
        child.$el.trigger("blur");
      }
      this.$el.trigger("setCurrentTabFocus");
      return true;
    },
    clearSelect: function() {
      var self = this;
      if (this.selectedItem) {
        self.toggleSelectedChild(this.selectedItem);
      }
      this.selectedItem = null;
      return true;
    },
    toggleSelectedChild: function(child) {
      if (this.commandType.isSelectable(child.model)) {
        child.toggleSelect();
      }
    },
    toggleBrowsedChild: function(child) {
      child && child.toggleBrowse();
    },
    _isBrowsable: function(member) {
      return member.get("type") === 1;
    },
    _targetSelection: function(child) {
      var model = child.model, childId = model.get("id"), prevSelected = child.isSelected(), type = model.get("type");
      this.clearSelect();
      if (!prevSelected) {
        this.selectedItem = child;
        this.toggleSelectedChild(child);
      }
      this.trigger("selection:change", {
        type: type,
        member: model,
        add: !prevSelected
      });
      this.notFetching = true;
    },
    _browseSelection: function(child) {
      var selectableType = this.commandType.isSelectableType(child.model), selectable = this.commandType.isSelectable(child.model), browsable = this.commandType.browseAllowed(child.model), alreadyBrowsed = child.isBrowsed(), addToSelection = false, type = child.model.attributes.type;
      if (alreadyBrowsed) {
        selectable && this._targetSelection(child);
        this.notFetching = true;
      } else {
        if (selectable) {
          this._browseNSelect(child);
          addToSelection = true;
        } else {
          if (browsable || selectableType) {
            this.clearSelect();
            addToSelection = true;
          }
          this.toggleBrowsedChild(child);
        }
        if (browsable) {
          this.trigger("selection:change", {
            member: child.model,
            silent: false,
            add: addToSelection,
            type: type
          });
        }
        this._browse(child, addToSelection);
      }
    },
    _enableApplyMethod: function() {
      this.trigger("enable:apply");
    },
    _checkOpenGroups: function(model, collection) {
      if (this._isBrowsable(model)) {
        const titleValue = model.get("name");
        const currentExpanded = this.$el.find("li.browse");
        if (currentExpanded.length > 0 && currentExpanded.find('span[title="' + titleValue + '"]').length > 0) {
          this.trigger("remove:expanded:panel");
        }
      }
    },
    _browse: function(child, addToSelection) {
      this.browsedChild && this.browsedChild.toggleBrowse();
      this.browsedChild = child;
      child.ui?.link?.attr("aria-expanded", "true");
      this.trigger("browse:select", {
        member: child.model,
        add: addToSelection
      });
    },
    _browseNSelect: function(child) {
      this.clearSelect();
      this.selectedItem = child;
      child.assignedBrowseNSelect();
    }
  });
  return MemberListView;
});