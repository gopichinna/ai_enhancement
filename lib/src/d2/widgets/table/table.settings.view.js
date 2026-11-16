/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/booleanfield.view", "csui/widgets/nodestable/nodestable.view", "csui/utils/commands", "csui/utils/accessibility", "i18n", "dctmw/utils/user.preference.storage", "d2/widgets/table/table.settings.columns.view", "d2/utils/widget.constants", "hbs!d2/widgets/table/impl/table.settings", "i18n!d2/widgets/table/impl/nls/lang", "css!d2/widgets/table/impl/table.settings.css" ], function($, _, Backbone, Marionette, ToggleSwitchView, NodestableView, commands, Accessibility, i18n, userPreferenceStore, TableSettingsColumnsView, widgetConstants, template, lang) {
  "use strict";
  return Marionette.LayoutView.extend({
    template: template,
    templateHelpers: function() {
      return {
        manageVersions: this.manageVersions !== false,
        manageMarkupStatus: this.manageMarkupStatus === true,
        showInitialCard: this.showInitialCard,
        supportedTableModes: this.supportedTableModes || [],
        checkboxIconName: "d2_state_checkbox-selected",
        labels: {
          title: lang.TableSettingsTitle,
          manageVersions: this.manageVersions,
          columns_settings: lang.TableSettingsOptionColumnsSettings,
          allVersionColumnToggle: lang.LabelAllVersionColumnToggle,
          markupStatusColumnToggle: lang.LabelMarkupStatusColumnToggle
        }
      };
    },
    regions: {
      rgn_initial: ".card-initial",
      rgn_all_version_column_toggle_switch: ".all-version-column-toggle-switch",
      rgn_markup_status_column_toggle_switch: ".markup-status-column-toggle-switch",
      rgn_columns_settings: ".card-columns-settings",
      rgn_add_columns: ".card-add-columns",
      rgn_add_columns_type: ".card-add-columns-type"
    },
    ui: {
      mask: ".d2-table-settings",
      container: ".d2-table-settings > .container-main",
      card_initial: ".card-initial",
      card_initial_links: ".card-initial > .binf-list-group > a.binf-list-group-item",
      card_initial_all_items: ".card-initial > .binf-list-group > .binf-list-group-item",
      card_columns_settings: ".card-columns-settings",
      card_add_columns: ".card-add-columns",
      card_add_columns_type: ".card-add-columns-type",
      card_table_mode_items: ".card-initial > .binf-list-group > .binf-list-group-item.table-mode-item"
    },
    events: {
      keydown: "onKeyDown",
      "click @ui.mask": "closeSettings",
      "click @ui.container": "containerClick",
      "focusin @ui.card_initial": "onCardInitialFocusIn",
      "click @ui.card_initial_links": "onCardInitialLinkClick",
      "keyup @ui.card_initial_links": "onCardInitialLinkKeyUp",
      "keydown @ui.card_initial_all_items": "onCardInitialItemKeyDown",
      "click @ui.card_table_mode_items": "onClickTableModeItem",
      "keydown @ui.card_table_mode_items": "onKeydownTableModeItem"
    },
    constructor: function TableSettingsView(options) {
      options = options || {};
      this.options = options;
      Marionette.LayoutView.call(this, options);
      var me = this;
      me.listenTo(me.options.prefColumns, "add remove", function() {
        me.pendingCollectionSync = true;
      });
      this.manageVersions = options.manageVersions !== false;
      this.manageMarkupStatus = options.manageMarkupStatus === true;
      if (this.manageVersions) {
        this.versionsStorageKey = options.versionsStorageKey;
        this.initialIsVersionShown = this.isAllVersionEnabled();
        this.allVersionColumnToggleSwitch = new ToggleSwitchView({
          id: _.uniqueId("table_all_version_column_toggle"),
          model: new Backbone.Model({
            data: this.initialIsVersionShown
          })
        });
        this.allVersionColumnToggleSwitch.on("field:changed", this.onAllVersionColumnToggle.bind(this));
        this.showInitialCard = true;
      }
      if (this.manageMarkupStatus) {
        this.markupStatusColumnToggleSwitch = new ToggleSwitchView({
          id: _.uniqueId("table_markup_status_column_toggle"),
          model: new Backbone.Model({
            data: this.isMarkupStatusEnabled()
          })
        });
        this.markupStatusColumnToggleSwitch.on("field:changed", this.onMarkupStatusColumnToggle.bind(this));
        this.showInitialCard = true;
      }
      this.supportedTableModes = this.getSupportedTableModes();
      if (this.supportedTableModes && this.supportedTableModes.length > 1) {
        this.showInitialCard = true;
      }
    },
    onRender: function() {
      var width = this.ui.container.width(), origEl = this.options.originatingEl, origin = origEl.offset();
      this.ui.container.offset({
        top: origin.top + origEl.height(),
        left: i18n.settings.rtl ? origin.left : origin.left + origEl.width() - width
      });
      this.currentCard = this.ui.card_initial;
      this.currentRegion = this.getRegion("rgn_initial");
      var showInitialCard = false;
      if (this.manageVersions) {
        this.getRegion("rgn_all_version_column_toggle_switch").show(this.allVersionColumnToggleSwitch);
        showInitialCard = true;
      }
      if (this.manageMarkupStatus) {
        this.getRegion("rgn_markup_status_column_toggle_switch").show(this.markupStatusColumnToggleSwitch);
        showInitialCard = true;
      }
      if (this.supportedTableModes && this.supportedTableModes.length > 1) {
        var currentTableMode = this.getCurrentTableMode();
        if (currentTableMode) {
          this.ui.card_initial.find('.table-mode-item input[data-id="' + currentTableMode + '"]').attr("checked", true);
        } else {
          this.ui.card_initial.find(".table-mode-item input").first().attr("checked", true);
        }
        this.ui.card_initial.find(".table-mode-item").last().addClass("last-item");
        showInitialCard = true;
      }
      if (showInitialCard) {
        this.ui.container.height(this.currentCard.height());
        setTimeout(function() {
          this.ui.card_initial_all_items.first().trigger("focus");
          this.triggerMethod("render:complete");
        }.bind(this), 50);
      } else {
        this.once("render:complete", function() {
          var v = this.currentRegion.currentView;
          setTimeout(v.onShow.bind(v), 50);
        }.bind(this));
        this.showColumnsSettings(true, true);
      }
      origEl.find(".icon").addClass("active");
    },
    onKeyDown: function(event) {
      if (event.which === 27) {
        event.preventDefault();
        event.stopPropagation();
        this.closeSettings();
      }
    },
    onCardInitialItemKeyDown: function(event) {
      var $el = $(event.currentTarget), $elNextFocus = null;
      switch (event.keyCode) {
       case 40:
        $elNextFocus = $el.next(".binf-list-group-item");
        break;

       case 38:
        $elNextFocus = $el.prev(".binf-list-group-item");
        break;

       case 33:
       case 36:
        $elNextFocus = this.ui.card_initial_all_items.first();
        break;

       case 34:
       case 35:
        $elNextFocus = this.ui.card_initial_all_items.last();
        break;

       case 9:
        if (event.shiftKey) {
          $elNextFocus = $el.prev(".binf-list-group-item");
          if ($elNextFocus.length === 0) {
            $elNextFocus = this.ui.card_initial_all_items.last();
          }
        } else {
          $elNextFocus = $el.next(".binf-list-group-item");
          if ($elNextFocus.length === 0) {
            $elNextFocus = this.ui.card_initial_all_items.first();
          }
        }
        event.stopPropagation();
        event.preventDefault();
        break;

       default:
        break;
      }
      if ($elNextFocus && $elNextFocus.length !== 0) {
        if (!$elNextFocus.is(":focusable")) {
          $elNextFocus = $elNextFocus.find(":focusable");
        }
        $elNextFocus.trigger("focus");
      }
    },
    onCardInitialFocusIn: function(event) {
      this.$cardInitialLastFocusEl = $(event.target);
    },
    onCardInitialLinkClick: function(event) {
      var $el = $(event.target);
      var behaviorName = "show" + $el.data("clickbehavior");
      if (_.isFunction(this[behaviorName])) {
        this[behaviorName](event);
      }
    },
    onCardInitialLinkKeyUp: function(event) {
      if (event.which === 13 || event.which === 32) {
        event.preventDefault();
        event.stopPropagation();
        this.onCardInitialLinkClick(event);
      }
    },
    containerClick: function(event) {
      event.stopPropagation();
    },
    getNodesTable: function() {
      if (this.options.commandStatus && this.options.commandStatus.originatingView && this.options.commandStatus.originatingView instanceof NodestableView) {
        return this.options.commandStatus.originatingView;
      }
    },
    getSupportedTableModes: function() {
      var nodesTableView = this.getNodesTable(), availableTableModes = nodesTableView && nodesTableView.getAvailableTableModes();
      if (!Accessibility.isAccessibleMode() && this.options.supportedTableModes && this.options.supportedTableModes.length > 0) {
        return _.map(this.options.supportedTableModes, function(tableMode) {
          var availableTableMode = availableTableModes && _.findWhere(availableTableModes, {
            key: tableMode
          }), label = availableTableMode && availableTableMode.label || tableMode;
          return {
            id: tableMode,
            name: label,
            ariaLabel: _.str.sformat(lang.tableModeAriaKeyValue, lang.tableModeAriaKey, label)
          };
        });
      }
    },
    onTableModeSelectionChange: function(tableMode) {
      var nodesTableView = this.getNodesTable(), commandStatus = this.options.commandStatus, currentTableMode = nodesTableView && nodesTableView._currentTableMode, tableModeChangeCommand = commands.get("TableSettingsTableMode");
      if (currentTableMode !== tableMode && nodesTableView && tableModeChangeCommand.enabled(this.options.commandStatus)) {
        var d2CustomNameColumn = nodesTableView.columns.findWhere({
          d2_custom_name_column: true
        });
        if (d2CustomNameColumn) {
          nodesTableView.columns.remove(d2CustomNameColumn, {
            silent: true
          });
        }
        tableModeChangeCommand.execute(commandStatus, {
          nodesTableView: nodesTableView,
          itemValue: tableMode
        }).finally(() => {
          if (tableMode === widgetConstants.TableModes.THUMBNAIL) {
            commandStatus.thumbnailViewState = commandStatus.originatingView.thumbnailViewState;
            if (commandStatus.collection.loadThumbnails) {
              commandStatus.collection.loadThumbnails();
            }
          }
        });
      }
    },
    onClickTableModeItem: function(event) {
      this.ui.card_table_mode_items.removeAttr("checked");
      var $tableModeInput = $(event.currentTarget).find("input.table-mode"), tableMode = $tableModeInput.attr("data-id");
      $tableModeInput.attr("checked", true);
      setTimeout(() => {
        this.onTableModeSelectionChange(tableMode);
      });
    },
    onKeydownTableModeItem: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        $(event.target).trigger("click");
      }
    },
    closeSettings: function() {
      if (this.pendingCollectionSync === true) {
        this.options.preferenceUpdateCallback && this.options.preferenceUpdateCallback(!this.pendingCollectionSync);
        delete this.pendingCollectionSync;
      }
      this.destroy();
      this.options.originatingEl.find("[tabindex]").trigger("focus");
      this.options.originatingEl.find(".icon").removeClass("active");
    },
    showCard: function(cardName, childView, animate) {
      var me = this, regionName = "rgn_" + cardName, card = me.ui["card_" + cardName], pos = i18n.settings.rtl ? "left" : "right", posObj = {};
      me.targetCard = card;
      if (childView) {
        me.showChildView(regionName, childView);
        card.show();
        me.resetHeightAndScroll(card);
        posObj[pos] = 0;
        card.animate(posObj, {
          duration: animate !== false ? 400 : 0,
          complete: function() {
            me.currentCard.hide();
            me.currentCard = card;
            me.currentRegion = me.getRegion(regionName);
            if (childView.onShow) {
              childView.onShow();
            }
            me.triggerMethod("render:complete");
          }
        });
      } else {
        card.show();
        me.resetHeightAndScroll(card);
        posObj[pos] = -me.currentCard.width();
        me.currentCard.animate(posObj, {
          duration: animate !== false ? 400 : 0,
          complete: function() {
            me.currentRegion.empty();
            me.currentCard.hide();
            me.currentCard = card;
            me.currentRegion = me.getRegion(regionName);
            if (me.currentRegion.hasView() && me.currentRegion.currentView.onShow) {
              me.currentRegion.currentView.onShow();
            } else {
              (me.$cardInitialLastFocusEl ? me.$cardInitialLastFocusEl : me.ui.card_initial_all_items.first()).trigger("focus");
            }
            me.triggerMethod("render:complete");
          }
        });
      }
    },
    showColumnsSettings: function(dontAnimate, noBack) {
      this.showCard("columns_settings", new TableSettingsColumnsView({
        containerView: this,
        connector: this.options.connector,
        collection: this.options.prefColumns,
        fixedColumns: this.options.fixedColumns,
        noBack: noBack
      }), dontAnimate !== true);
    },
    resetHeightAndScroll: function(card) {
      card = card || this.currentCard;
      if (card === this.targetCard) {
        var listContainer = card.find(".binf-list-group");
        if (listContainer) {
          listContainer.height("auto");
          var elTop = card.offset().top, docH = $(document).height() - 5, delta = elTop + card.height() - docH;
          if (delta > 0) {
            listContainer.height(2 * listContainer.height() - listContainer.outerHeight(true) - delta);
          }
        }
        this.ui.container.height(card.height());
      }
    },
    isAllVersionEnabled: function() {
      return this.getNodesTable().getPreference("showAllVersion");
    },
    isMarkupStatusEnabled: function() {
      return this.getNodesTable().getPreference("showMarkupStatus");
    },
    getCurrentTableMode: function() {
      return this.getNodesTable().getPreference("tableMode");
    },
    onAllVersionColumnToggle: function(event) {
      var allVersionFieldValue = event.fieldvalue;
      this.getNodesTable()._nodesTableSettings.set("showAllVersion", allVersionFieldValue);
      this.getNodesTable()._nodesTableSettings.save().always(() => {
        this.options.preferenceUpdateCallback && this.options.preferenceUpdateCallback(true);
      });
    },
    onMarkupStatusColumnToggle: function(event) {
      var markupStatusFieldValue = event.fieldvalue;
      this.getNodesTable()._nodesTableSettings.set("showMarkupStatus", markupStatusFieldValue);
      this.getNodesTable()._nodesTableSettings.save().always(() => {
        this.options.preferenceUpdateCallback && this.options.preferenceUpdateCallback(true);
      });
    }
  });
});