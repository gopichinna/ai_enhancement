/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/checkbox/checkbox.view", "csui/controls/progressblocker/blocker", "csui/utils/letter-avatar-random-color/letter-avatar-colors", "d2/models/creation.presets.value.configs", "d2/dialogs/new.file/impl/profile.form.util", "i18n!d2/dialogs/new.file/impl/nls/lang", "hbs!d2/dialogs/new.file/impl/profile.list", "hbs!d2/dialogs/new.file/impl/profile.listitem", "css!d2/dialogs/new.file/impl/profile.list" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, TabablesBehavior, CheckboxView, BlockingView, LetterAvatarColor, PresetValueConfigCollection, profileFormUtil, lang, template, profileItemTemplate) {
  "use strict";
  var ListModes = Object.freeze({
    RECENT: "recent",
    PRESET: "preset"
  });
  var SelectionModes = Object.freeze({
    NONE: "none",
    SINGLE: "single"
  });
  function selectionOnlyTabableFilter() {
    return !$(this).hasClass("profile-action");
  }
  var ProfileListItemView = Marionette.LayoutView.extend({
    className: "d2-profile-listitem",
    template: profileItemTemplate,
    regions: {
      rgnSelectionControl: ".selection-control"
    },
    ui: {
      profileAvatar: ".profile-avatar",
      profileTitle: ".profile-title",
      profileName: ".profile-title .cs-title",
      profileArtifacts: ".profile-title .artifact-summary",
      invalidErrorMessage: ".profile-title .error-message-invalid",
      actionEdit: ".profile-actions .action-edit",
      actionImport: ".profile-actions .action-import",
      actionAdd: ".profile-actions .action-add",
      toggleExpandCollapse: ".profile-actions .action-expand-collapse",
      sectionExpandCollapse: ".inheritance-section",
      inehritanceSource: ".inheritance-source .inheritance-value",
      inheritanceBlueprint: ".inheritance-blueprint .inheritance-value"
    },
    events: {
      "click @ui.toggleExpandCollapse": "onExpandCollapse",
      "keydown @ui.toggleExpandCollapse": "onKeyDownExpandCollapse",
      "keydown @ui.actionEdit": "onKeyDownAction",
      "keydown @ui.actionImport": "onKeyDownAction",
      "keydown @ui.actionAdd": "onKeyDownAction"
    },
    triggers: {
      "click @ui.actionEdit": "action:edit",
      "click @ui.actionImport": "action:import",
      "click @ui.actionAdd": "action:create"
    },
    constructor: function ProfileListItemView(options) {
      options = options || {};
      this.mode = options.mode || "";
      this.isOperatingModePreset = options.isOperatingModePreset;
      this.selectionMode = options.selectionMode;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.isValid = this.isOperatingModePreset || !this.model.isInvalid();
    },
    templateHelpers: function() {
      var artifacts = this.isValid && (!this.isOperatingModePreset && !this.model.get("name")), editable = this.isValid && this.model.isEditable(), importable = this.isValid && (this.selectionMode === SelectionModes.NONE && this.model.profile && this.model.profile.canBeUsedForImport()), addable = this.isValid && (this.selectionMode === SelectionModes.NONE && this.model.profile && this.model.profile.canBeUsedForCreate()), hiddenInheritance = !this.isValid || this.model.profile && this.model.profile.get("inheritanceHidden"), sourceContentName = !hiddenInheritance && this.model.sourceContent && this.model.sourceContent.get("name"), showContentInheritOption = this.mode !== "import" && this.model.sourceContent && !this.model.sourceContent.get("container"), showVDStructureInheritOption = this.mode !== "import" && this.model.sourceContent && this.model.sourceContent.get("r_is_virtual_doc") === 1, blueprintDictionary = profileFormUtil.getBluePrintDictionary(), blueprints = [];
      sourceContentName && this.model.profile && _.each(_.values(blueprintDictionary), function(dEntry) {
        if (this.model.profile.get(dEntry.modelAttribute)) {
          switch (dEntry.value) {
           case blueprintDictionary.properties.value:
            blueprints.push(dEntry.text);
            break;

           case blueprintDictionary.content.value:
            showContentInheritOption && blueprints.push(dEntry.text);
            break;

           case blueprintDictionary.virtual_doc.value:
            showVDStructureInheritOption && blueprints.push(dEntry.text);
            break;

           default:
            break;
          }
        }
      }.bind(this));
      var hasInheritanceBlueprint = blueprints.length > 0;
      return {
        lang: lang,
        isInvalid: !this.isValid,
        artifacts: artifacts,
        editable: editable,
        importable: importable,
        addable: addable,
        expandable: sourceContentName || hasInheritanceBlueprint,
        inheritanceSource: sourceContentName,
        inheritanceBlueprint: blueprints.join(", ")
      };
    },
    onRender: function() {
      if (this.selectionMode !== SelectionModes.NONE) {
        this.$el.addClass("selectable");
        if (this.isValid && !this.selectionControl) {
          this.selectionControl = new CheckboxView();
          this.rgnSelectionControl.show(this.selectionControl);
          this.listenTo(this.selectionControl, "clicked", this.onSelectionChange.bind(this));
        }
      } else {
        this.$el.removeClass("selectable");
      }
      var label = this.model.get("name");
      if (!label) {
        label = this.model.profile.get("name");
        if (this.isValid && !this.isOperatingModePreset) {
          var textArtifacts = (this.model.valueConfig.dictionaries.map(function(model) {
            return model.get("column_label") || model.get("column_value");
          }) || []).join(" | ");
          this.ui.profileArtifacts.text(textArtifacts);
        }
      }
      this.ui.profileName.text(label);
      var firstCharMatch = label.match(/[a-z]/i);
      var profileInitial = firstCharMatch ? firstCharMatch[0] : label.substr(0, 1);
      var profileAvatarBGColor = LetterAvatarColor.getLetterAvatarColor(profileInitial);
      this.ui.profileAvatar.css("background-color", profileAvatarBGColor);
      this.ui.profileAvatar.text(profileInitial);
    },
    onSelectionChange: function(arg) {
      if (arg.model.get("checked") === "true") {
        this.$el.removeClass("selected");
        this.triggerMethod("change:selection", false);
      } else {
        this.$el.addClass("selected");
        this.triggerMethod("change:selection", true);
      }
    },
    clearSelection: function() {
      if (this.selectionControl) {
        this.selectionControl.model.set("checked", "false");
        this.$el.removeClass("selected");
      }
    },
    onExpandCollapse: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.ui.sectionExpandCollapse.toggleClass("binf-hidden");
      if (this.ui.sectionExpandCollapse.hasClass("binf-hidden")) {
        this.ui.toggleExpandCollapse.removeClass("icon-expandArrowUp");
        this.ui.toggleExpandCollapse.addClass("icon-expandArrowDown");
        this.ui.toggleExpandCollapse.attr("title", lang.tooltipSelectTypeProfileExpand);
      } else {
        this.ui.toggleExpandCollapse.addClass("icon-expandArrowUp");
        this.ui.toggleExpandCollapse.removeClass("icon-expandArrowDown");
        this.ui.toggleExpandCollapse.attr("title", lang.tooltipSelectTypeProfileCollapse);
      }
    },
    onKeyDownExpandCollapse: function(event) {
      if (event && (event.keyCode === 13 || event.keyCode === 32)) {
        this.onExpandCollapse(event);
      }
    },
    onKeyDownAction: function(event) {
      if (event && (event.keyCode === 13 || event.keyCode === 32)) {
        event.stopPropagation();
        event.preventDefault();
        $(event.target).trigger("click");
      }
    },
    onBeforeDestroy: function() {
      this.ui.profileArtifacts.off("mouseenter.profile_artifacts");
      this.ui.profileArtifacts.off("mouseenter.profile_title");
      this.selectionControl && this.selectionControl.destroy();
    }
  });
  var ProfileListView = Marionette.CompositeView.extend({
    className: "d2-profile-list-view",
    template: template,
    childViewContainer: ".cs-list-group",
    childView: ProfileListItemView,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "> .list-scroll-container",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    events: {
      focusout: "onFocusLost",
      keydown: "onKeyDown"
    },
    ui: {
      header: "> .list-header"
    },
    constructor: function ProfileListView(options) {
      options = options || {};
      this.context = options.context;
      this.connector = this.context.getObject("connector");
      this.mode = options.mode || "";
      this.isOperatingModePreset = options.dataMode ? options.dataMode !== ListModes.RECENT : true;
      this.selectionMode = this.mode === "" ? SelectionModes.NONE : SelectionModes.SINGLE;
      this.blockingParent = options.blockingParent;
      this.collectionMirror = options.collection instanceof PresetValueConfigCollection ? options.collection : new PresetValueConfigCollection([], {
        mode: this.mode,
        preset: options.model,
        inheritableSourceNode: options.inheritableSourceNode,
        isOperatingModePreset: this.isOperatingModePreset,
        connector: this.connector
      });
      options.collection = new PresetValueConfigCollection([], {
        mode: this.mode,
        preset: options.model,
        inheritableSourceNode: options.inheritableSourceNode,
        isOperatingModePreset: this.isOperatingModePreset,
        connector: this.connector
      });
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      if (this.blockingParent) {
        BlockingView.delegate(this, this.blockingParent);
      } else {
        BlockingView.imbue(this);
      }
      this.selectionHash = {};
    },
    templateHelpers: function() {
      return {
        title: this.options.title
      };
    },
    triggerRenderComplete: function() {
      this.triggerMethod("render:complete", this);
    },
    onRenderCollection: function() {
      if (this.collection.length) {
        this.$el.removeClass("binf-hidden");
      } else {
        this.$el.addClass("binf-hidden");
      }
      this.triggerRenderComplete();
    },
    onBeforeRender: function() {
      this.$el.addClass(this.className + " binf-hidden");
      if (this.isOperatingModePreset || this.model.isRecentAllowed()) {
        this.populateList();
      } else {
        this.triggerRenderComplete();
      }
    },
    populateList: function() {
      this.blockActions();
      this.collectionMirror.ensureFetched().always(this.unblockActions.bind(this)).done(this.mergeCollectionMirror.bind(this)).fail(this.triggerRenderComplete.bind(this));
    },
    mergeCollectionMirror: function() {
      if (this.collectionMirror.length) {
        this.collection.reset(this.collectionMirror.models);
      } else {
        this.triggerRenderComplete();
      }
    },
    childViewOptions: function() {
      return {
        mode: this.mode,
        isOperatingModePreset: this.isOperatingModePreset,
        selectionMode: this.selectionMode,
        parent: this,
        $tooltipViewport: !!this.blockingParent && this.blockingParent.$el ? this.blockingParent.$el : this.$("> .list-scroll-container")
      };
    },
    _clearPreviousSelections: function() {
      var deselectedModels = [];
      _.each(_.values(this.selectionHash), function(view) {
        view.clearSelection();
        delete this.selectionHash[view.cid];
        deselectedModels.push(view.model);
      }.bind(this));
      return deselectedModels;
    },
    clearSelections: function(silent) {
      silent = _.isBoolean(silent) ? silent : false;
      var deselectedModels = this._clearPreviousSelections();
      this.clearSelectionOnlyState();
      if (!silent) {
        this.triggerMethod("change:selection", [], deselectedModels);
      }
    },
    onChildviewChangeSelection: function(childView, isSelected) {
      if (this.selectionMode === SelectionModes.SINGLE) {
        var selectedModels = [], deselectedModels = [];
        if (isSelected === false) {
          deselectedModels.push(childView.model);
          delete this.selectionHash[childView.cid];
          _.each(_.values(this.selectionHash), function(view) {
            selectedModels.push(view.model);
          }.bind(this));
        } else {
          deselectedModels = this._clearPreviousSelections();
          this.selectionHash[childView.cid] = childView;
          selectedModels.push(childView.model);
        }
        if (selectedModels.length) {
          this.setSelectionOnlyState();
        } else {
          this.clearSelectionOnlyState();
        }
        this.triggerMethod("change:selection", selectedModels, deselectedModels);
      }
    },
    onChildviewActionEdit: function(childView) {
      this.triggerAction("edit", childView.model);
    },
    onChildviewActionImport: function(childView) {
      this.triggerAction("import", childView.model);
    },
    onChildviewActionCreate: function(childView) {
      this.triggerAction("create", childView.model);
    },
    triggerAction: function(actionName, actionData) {
      actionName && this.triggerMethod("action:" + actionName, actionData);
    },
    onFocusLost: function(event) {
      if (this.ignoreFocusLoss) {
        this.ignoreFocusLoss = false;
        return;
      }
      var itemSelector = "." + ProfileListItemView.prototype.className;
      var $eTarget = $(event.target);
      var $item = $eTarget.closest(itemSelector);
      $item.removeClass("active");
    },
    onKeyDown: function(event) {
      if (event.keyCode === 9) {
        var itemSelector = "." + ProfileListItemView.prototype.className;
        var $eTarget = $(event.target);
        var $item = $eTarget.closest(itemSelector);
        var selectionOnly = this.$el.hasClass("selection-only");
        if ($item.length) {
          $item.addClass("active");
          var $itemTabables = $item.find(TabablesBehavior.focusablesSelector);
          if (selectionOnly) {
            $itemTabables = $itemTabables.filter(selectionOnlyTabableFilter);
          }
          var currIndex = $.inArray(event.target, $itemTabables);
          if (currIndex !== -1) {
            var nextIndex = event.shiftKey ? currIndex - 1 : currIndex + 1;
            if (nextIndex >= 0 && nextIndex < $itemTabables.length) {
              event.stopPropagation();
              event.preventDefault();
              this.ignoreFocusLoss = true;
              $itemTabables.eq(nextIndex).trigger("focus");
            } else {
              $item.removeClass("active");
              var me = this;
              var findAndFocus = function() {
                $item = event.shiftKey ? $item.prev(itemSelector) : $item.next(itemSelector);
                if ($item.length) {
                  $itemTabables = $item.find(TabablesBehavior.focusablesSelector);
                  if (selectionOnly) {
                    $itemTabables = $itemTabables.filter(selectionOnlyTabableFilter);
                  }
                  if ($itemTabables.length) {
                    var i = event.shiftKey ? $itemTabables.length - 1 : 0;
                    event.stopPropagation();
                    event.preventDefault();
                    me.ignoreFocusLoss = true;
                    $item.addClass("active");
                    $itemTabables.eq(i).trigger("focus");
                  } else {
                    findAndFocus();
                  }
                } else {
                  me.trigger("focus:lost", event);
                }
              };
              findAndFocus();
            }
          } else {
            $item.removeClass("active");
            this.trigger("focus:lost", event);
          }
        } else {
          this.trigger("focus:lost", event);
        }
      }
    },
    setFocus: function(event) {
      if (event && event.keyCode === 9 && event.type === "keydown") {
        var $allTabables = this.$(TabablesBehavior.focusablesSelector);
        if (this.$el.hasClass("selection-only")) {
          $allTabables = $allTabables.filter(selectionOnlyTabableFilter);
        }
        if ($allTabables.length) {
          var $focusable = $allTabables.eq(event.shiftKey ? $allTabables.length - 1 : 0);
          if ($focusable.length) {
            event.preventDefault();
            event.stopPropagation();
            $focusable.closest("." + ProfileListItemView.prototype.className).addClass("active");
            $focusable.trigger("focus");
          }
        }
      }
    },
    setSelectionOnlyState: function() {
      this.$el.addClass("selection-only");
    },
    clearSelectionOnlyState: function() {
      this.$el.removeClass("selection-only");
    }
  }, {
    DataModes: ListModes
  });
  return ProfileListView;
});