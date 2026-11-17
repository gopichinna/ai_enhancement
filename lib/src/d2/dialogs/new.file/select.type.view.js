/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/models/creation.presets", "d2/dialogs/new.file/impl/custom.profile.linkview", "d2/dialogs/new.file/impl/profile.list.view", "i18n!d2/dialogs/new.file/impl/nls/lang", "hbs!d2/dialogs/new.file/impl/select.type", "css!d2/dialogs/new.file/impl/select.type" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, BlockingView, LayoutViewEventsPropagationMixin, TabableRegionBehavior, TabablesBehavior, PresetCollection, CustomProfileLinkview, ProfileListView, lang, template) {
  "use strict";
  var SelectTypeView = Marionette.LayoutView.extend({
    className: "d2-new-content-select-type",
    template: template,
    regions: {
      rgnCustomProfile: ".section-type-custom",
      rgnRecentProfiles: ".section-type-recents",
      rgnPresetProfiles: ".section-type-presets"
    },
    ui: {
      hiddenFocusReceiver: ".d2-select-type-container",
      customProfile: ".section-type-custom",
      recentProfiles: ".section-type-recents",
      presetProfiles: ".section-type-presets"
    },
    events: {
      keydown: "onKeyDown"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".select-type-scroll-container",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    constructor: function SelectTypeView(options) {
      options = options || {};
      options.initialActivationWeight = 1;
      this.options = options;
      this.context = options.context;
      this.connector = this.context.getObject("connector");
      this.wizard = options.wizard;
      this._contentMode = options.mode || "";
      this.presetCollection = options.presetCollection || new PresetCollection(undefined, {
        connector: this.connector
      });
      this.presetConfigCollection = options.presetConfigCollection;
      this.recentConfigCollection = options.recentConfigCollection;
      this.inheritableSourceNode = options.inheritableSourceNode;
      this.editPresetProfileCollection = options.editPresetProfileCollection;
      this.editPresetConfigCollection = options.editPresetConfigCollection;
      this.title = lang.titleSelectType;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.propagateEventsToRegions();
    },
    onRender: function() {
      this.$el.addClass(this.className);
      if (this.presetCollection.fetched && this.presetCollection.length) {
        var model = this.presetCollection.at(0);
        if (this.recentConfigCollection && !this.recentConfigCollection.preset) {
          this.recentConfigCollection.preset = model;
        }
        if (this.presetConfigCollection && !this.presetConfigCollection.preset) {
          this.presetConfigCollection.preset = model;
        }
        this.createProfileListViews(model).always(function(profileListViewResults) {
          var isZeroState = !(profileListViewResults[0] || profileListViewResults[1]);
          if (isZeroState && this.wizard) {
            this.title = lang.titleSelectTypeZeroState;
            this.wizard.refreshHeader();
          }
          this.createCustomProfileLinkView(isZeroState, model);
        }.bind(this));
      } else {
        this.blockActions();
        this.presetCollection.fetch().always(this.unblockActions.bind(this)).done(this.render.bind(this)).fail(function() {}.bind(this));
      }
    },
    onBeforeDestroy: function() {
      this.customProfileLinkView && this.customProfileLinkView.destroy();
      this.recentProfilesView && this.recentProfilesView.destroy();
      this.presetProfilesView && this.presetProfilesView.destroy();
    },
    createCustomProfileLinkView: function(isZeroState, model) {
      if (!this.customProfileLinkView) {
        this.customProfileLinkView = new CustomProfileLinkview({
          el: this.ui.customProfile[0],
          isZeroState: isZeroState,
          model: model,
          blockingParent: this,
          mode: this._contentMode
        });
        this.listenTo(this.customProfileLinkView, {
          "action:import": this._onActionImportCustom.bind(this),
          "action:create": this._onActionCreateCustom.bind(this)
        });
        this.customProfileLinkView.render();
        this.rgnCustomProfile.attachView(this.customProfileLinkView);
        this.customProfileLinkView._isAttached = true;
      }
    },
    createProfileListViews: function(model) {
      var deferred = $.Deferred(), pRecent = $.Deferred(), pPreset = $.Deferred();
      if (!this.recentProfilesView) {
        this.recentProfilesView = new ProfileListView({
          el: this.ui.recentProfiles[0],
          model: model,
          collection: this.recentConfigCollection,
          blockingParent: this,
          mode: this._contentMode,
          context: this.context,
          inheritableSourceNode: this.inheritableSourceNode,
          dataMode: ProfileListView.DataModes.RECENT,
          title: lang.labelSelectTypeRecent
        });
        this.listenTo(this.recentProfilesView, {
          "render:collection": this.updateScrollbar.bind(this),
          "change:selection": this.onRecentSelectionChange.bind(this),
          "action:edit": this.onActionEditPreset.bind(this),
          "action:import": this.onActionImportWithPreset.bind(this),
          "action:create": this.onActionCreateWithPreset.bind(this)
        });
        this.listenToOnce(this.recentProfilesView, "render:complete", function(view) {
          pRecent.resolve(model.isRecentAllowed() && view.collection.length !== 0);
        });
        this.recentProfilesView.render();
        this.rgnRecentProfiles.attachView(this.recentProfilesView);
        this.recentProfilesView._isAttached = true;
      } else {
        pRecent.resolve(model.isRecentAllowed() && this.recentProfilesView.collection.length !== 0);
      }
      if (!this.presetProfilesView) {
        this.presetProfilesView = new ProfileListView({
          el: this.ui.presetProfiles[0],
          model: model,
          collection: this.presetConfigCollection,
          blockingParent: this,
          mode: this._contentMode,
          context: this.context,
          inheritableSourceNode: this.inheritableSourceNode,
          dataMode: ProfileListView.DataModes.PRESET,
          title: lang.labelSelectTypePrest
        });
        this.listenTo(this.presetProfilesView, {
          "render:collection": this.updateScrollbar.bind(this),
          "change:selection": this.onPresetSelectionChange.bind(this),
          "action:edit": this.onActionEditPreset.bind(this),
          "action:import": this.onActionImportWithPreset.bind(this),
          "action:create": this.onActionCreateWithPreset.bind(this)
        });
        this.listenToOnce(this.presetProfilesView, "render:complete", function(view) {
          pPreset.resolve(view.collection.length !== 0);
        });
        this.presetProfilesView.render();
        this.rgnPresetProfiles.attachView(this.presetProfilesView);
        this.presetProfilesView._isAttached = true;
      } else {
        pPreset.resolve(this.presetProfilesView.collection.length !== 0);
      }
      $.whenAll(pPreset, pRecent).always(deferred.resolve);
      return deferred.promise();
    },
    updateScrollbar: function() {
      this.triggerMethod("update:scrollbar");
    },
    adjustSelection: function(selectedModels, otherView) {
      if (selectedModels.length) {
        this.selectedModel = selectedModels[0];
        otherView && otherView.clearSelections(true);
        otherView && otherView.setSelectionOnlyState();
      } else {
        delete this.selectedModel;
        otherView && otherView.clearSelectionOnlyState();
      }
      this.triggerMethod("change:selection", this.selectedModel);
      this.wizard && this.wizard.refreshFooter();
    },
    onRecentSelectionChange: function(selectedModels) {
      this.adjustSelection(selectedModels, this.presetProfilesView);
    },
    onPresetSelectionChange: function(selectedModels) {
      this.adjustSelection(selectedModels, this.recentProfilesView);
    },
    clearProfileListSelections: function() {
      delete this.selectedModel;
      this.recentProfilesView && this.recentProfilesView.clearSelections(true);
      this.presetProfilesView && this.presetProfilesView.clearSelections(true);
      this.triggerMethod("change:selection", this.selectedModel);
      this.wizard && this.wizard.refreshFooter();
    },
    _onActionImportCustom: function() {
      this.clearProfileListSelections();
      this.onActionImportCustom();
    },
    _onActionCreateCustom: function() {
      this.clearProfileListSelections();
      this.onActionCreateCustom();
    },
    onActionImportCustom: function() {},
    onActionCreateCustom: function() {},
    onActionEditPreset: function(preset) {
      if (preset && this.editPresetProfileCollection && this.editPresetConfigCollection) {
        var profileInUse = preset.profile.clone();
        profileInUse.set("custom_name", preset.get("name"));
        this.editPresetProfileCollection.reset([ profileInUse ]);
        this.editPresetProfileCollection.fetched = true;
        this.editPresetConfigCollection.profile = profileInUse;
        this.editPresetConfigCollection.reset([ preset.valueConfig ]);
        this.editPresetConfigCollection.fetched = true;
        return profileInUse;
      }
    },
    onActionImportWithPreset: function() {},
    onActionCreateWithPreset: function() {},
    onKeyDown: function(event) {
      if (event.keyCode === 9) {
        if (event.target !== this.ui.hiddenFocusReceiver[0]) {
          if (event.shiftKey) {
            if (this.presetProfilesView && $.contains(this.presetProfilesView.$el[0], event.target)) {
              if (this.recentProfilesView && this.recentProfilesView.$el.is(":visible")) {
                this.recentProfilesView.setFocus(event);
              }
              if (!event.isDefaultPrevented() && this.customProfileLinkView.$el.is(":visible")) {
                this.customProfileLinkView.setFocus(event);
              }
            } else if (this.recentProfilesView && $.contains(this.recentProfilesView.$el[0], event.target)) {
              if (this.customProfileLinkView.$el.is(":visible")) {
                this.customProfileLinkView.setFocus(event);
              }
            }
          } else {
            if ($.contains(this.customProfileLinkView.$el[0], event.target)) {
              if (this.recentProfilesView && this.recentProfilesView.$el.is(":visible")) {
                this.recentProfilesView.setFocus(event);
              }
              if (!event.isDefaultPrevented() && this.presetProfilesView && this.presetProfilesView.$el.is(":visible")) {
                this.presetProfilesView.setFocus(event);
              }
            } else if (this.recentProfilesView && $.contains(this.recentProfilesView.$el[0], event.target)) {
              if (this.presetProfilesView && this.presetProfilesView.$el.is(":visible")) {
                this.presetProfilesView.setFocus(event);
              }
            }
          }
        } else {
          if (!event.shiftKey) {
            if (this.customProfileLinkView.$el.is(":visible")) {
              this.customProfileLinkView.setFocus(event);
            }
            if (!event.isDefaultPrevented() && this.recentProfilesView && this.recentProfilesView.$el.is(":visible")) {
              this.recentProfilesView.setFocus(event);
            }
            if (!event.isDefaultPrevented() && this.presetProfilesView && this.presetProfilesView.$el.is(":visible")) {
              this.presetProfilesView.setFocus(event);
            }
          }
        }
      }
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":not([disabled])");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      if (!!event && event.shiftKey) {
        var e = $.Event("keydown");
        e.keyCode = 9;
        e.shiftKey = true;
        if (this.presetProfilesView && this.presetProfilesView.$el.is(":visible")) {
          this.presetProfilesView.setFocus(e);
        }
        if (!e.isDefaultPrevented() && this.recentProfilesView && this.recentProfilesView.$el.is(":visible")) {
          this.recentProfilesView.setFocus(e);
        }
        if (!e.isDefaultPrevented() && this.customProfileLinkView && this.customProfileLinkView.$el.is(":visible")) {
          this.customProfileLinkView.setFocus(e);
        }
        return tabElements[tabElements.length - 1];
      } else {
        return $(tabElements[0]) && $(tabElements[0]).trigger("focus");
      }
    },
    onLastTabElement: function(shiftTab, event) {
      var visibleElems = this.$("*[tabindex=0]");
      return event.target === (shiftTab ? visibleElems[0] : visibleElems[visibleElems.length - 1]);
    },
    getTitle: function() {
      return this.title;
    }
  });
  _.extend(SelectTypeView.prototype, LayoutViewEventsPropagationMixin);
  return SelectTypeView;
});