/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/commands", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/next.node", "dctmw/utils/rest.resources", "nuc/utils/namedlocalstorage", "d2/widgets/navigation.header/controls/search/search.options.node.matcher", "i18n!d2/widgets/navigation.header/controls/search/impl/nls/lang", "hbs!d2/widgets/navigation.header/controls/search/impl/search.options" ], function(module, _, $, Marionette, base, commands, ApplicationScopeModelFactory, NextNodeModelFactory, RestResources, NamedLocalStorage, nodeMatcher, lang, template) {
  "use strict";
  var SearchOptionsView = Marionette.ItemView.extend({
    tagName: "ul",
    attributes: {
      role: "menu"
    },
    className: "binf-dropdown-menu d2-header-search-menu",
    template: template,
    ui: {
      menuItems: '> li[role="menuitem"]'
    },
    events: {
      keydown: "_onKeyDown",
      "click @ui.menuItems": "_onMenuItemClick",
      "click .tick-icon-container": "_onTickIconClick",
      'focusin input[type="radio"]': "_onOptionFocusEvent",
      'focusout input[type="radio"]': "_onOptionFocusEvent"
    },
    constructor: function SearchOptionsView(options) {
      options = options || {};
      var context = options.context;
      Marionette.ItemView.call(this, options);
      var currentRepository = RestResources.getCurrentRepository();
      this.repository = {
        id: currentRepository.id,
        repositoryName: base.escapeHtml(currentRepository.get("description") || currentRepository.get("name"))
      };
      this.applicationScope = options.applicationScope || context.getModel(ApplicationScopeModelFactory);
      this.nextNodeModel = options.nextNodeModel || context.getModel(NextNodeModelFactory);
      this.storage = options.storage || new NamedLocalStorage(module.id);
      this.selectedPerspective = this._getCalculatedPerspective();
      this.focusIndex = 0;
      this.items = [ {
        id: "repo",
        type: "option",
        isDefault: true,
        styleClass: "",
        labelContent: _.str.sformat(lang.soLabelRepo, "<span>'" + this.repository.repositoryName + "'</span>")
      }, {
        id: "folder",
        type: "option",
        styleClass: "",
        labelContent: lang.soLabelCurrentFolder
      }, {
        id: "folder_and_subfolder",
        type: "option",
        styleClass: "",
        labelContent: lang.soLabelCurrentFolderDeep
      }, {
        id: "search_result",
        type: "option",
        styleClass: "",
        labelContent: lang.soLabelWithinSearch
      }, {
        type: "separator"
      }, {
        id: "advanced_search",
        type: "command",
        command: "D2-AdvancedSearch",
        styleClass: "command-option",
        labelContent: lang.coLabelAdvancedSearch
      } ];
      this.perspectiveToOptionsMap = {
        home: [ "advanced_search" ],
        node: [ "repo", "folder", "folder_and_subfolder", "advanced_search" ],
        search: [ "repo", "search_result", "advanced_search" ]
      };
      this.listenTo(context, "sync:perspective", this._updatePerspective);
      this.listenTo(context, "sync", this._updatePerspective);
      this.listenTo(this, "focus:set", this._onFocusSet);
    },
    templateHelpers: function() {
      var filteredItems = _.filter(this.items, function(item) {
        return _.contains(this.perspectiveToOptionsMap[this.selectedPerspective], item.id) || item.type === "separator";
      }.bind(this));
      return {
        items: _.map(filteredItems, function(item) {
          return _.extend({}, item, item.type === "option" ? {
            optionId: "o_" + item.id
          } : {});
        })
      };
    },
    onRender: function() {
      this.$el.attr("data-perspective", this.selectedPerspective);
      if (this.$el.children().length > 0) {
        this.$el.show();
      } else {
        this.$el.hide();
      }
      this._restoreSelectionOrSetDefault();
    },
    _getCalculatedPerspective: function() {
      var scope = this.applicationScope.get("id");
      scope = _.isEmpty(scope) || !_.contains(_.keys(this.perspectiveToOptionsMap), scope) || scope === "node" && !nodeMatcher.isEligibleForNodeScope(this.nextNodeModel) ? "home" : scope;
      return scope;
    },
    _updatePerspective: function(context, perspectiveSource) {
      this.currentPerspective = perspectiveSource ? perspectiveSource : this.currentPerspective;
      this.selectedPerspective = this._getCalculatedPerspective();
      this.render();
      this.focusIndex = 0;
    },
    _restoreSelectionOrSetDefault: function() {
      var selectedOption = this.storage.get(this.selectedPerspective);
      var el = null;
      if (selectedOption) {
        var item = _.find(this.items, function(i) {
          return i.id === selectedOption;
        });
        if (item) {
          el = this.$el.find('input[data-id="' + selectedOption + '"]');
        } else {
          this.storage.remove(this.selectedPerspective);
        }
      }
      if (!el) {
        el = this.$el.find('input[data-default="true"]');
      }
      el && el.attr("checked", true);
    },
    _onMenuItemClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if ($(event.currentTarget).hasClass("command-option")) {
        var command = $(event.currentTarget).data("command");
        command && commands.get(command) && commands.get(command).execute({
          context: this.options.context
        }, {
          searchOption: this.getSelectedOption(),
          currentNode: this.currentPerspective && this.currentPerspective.clone(),
          searchTerm: this.options.parentView.ui.input.val()
        });
        this.options.parentView.trigger("clear_attention");
        this.focusIndex = 0;
      }
      if ($(event.currentTarget).find('input[type="radio"]').length) {
        this.ui.menuItems.find('input[type="radio"]').prop("checked", false);
        $(event.currentTarget).find('input[type="radio"]').prop("checked", true);
        this._onSelectionChange();
      }
    },
    _onSelectionChange: function() {
      var selectedOption = this.getSelectedOption();
      this.storage.set(this.selectedPerspective, selectedOption);
      this.triggerMethod("change:selection", selectedOption, this.isSelectionChangeTriggerKeyboard);
      this.isSelectionChangeTriggerKeyboard = false;
    },
    _onTickIconClick: function(event) {
      $(event.target).parent().parent().trigger("click");
    },
    getSelectedOption: function() {
      var selectedId = this.$el.find("input:checked").attr("id");
      if (!selectedId) {
        selectedId = _.find(this.items, "isDefault").id;
      }
      return selectedId;
    },
    _onFocusSet: function() {
      var elFocusable = this.ui.menuItems[this.focusIndex];
      if (!elFocusable) {
        elFocusable = this.ui.menuItems[0];
      }
      elFocusable.focus();
    },
    _onKeyDown: function(event) {
      this.isSelectionChangeTriggerKeyboard = false;
      switch (event.keyCode) {
       case 9:
        this._triggerFocusLoss(event, event.shiftKey === true);
        break;

       case 13:
       case 32:
        event.stopPropagation();
        event.preventDefault();
        if ($(this.ui.menuItems[this.focusIndex]).find('input[type="radio"]').length) {
          this.isSelectionChangeTriggerKeyboard = true;
        }
        $(this.ui.menuItems[this.focusIndex]).trigger("click");
        break;

       case 27:
        this._triggerFocusLoss(event, true);
        break;

       case 37:
       case 39:
        event.stopPropagation();
        event.preventDefault();
        break;

       case 38:
        event.preventDefault();
        event.stopPropagation();
        this.focusIndex = this.focusIndex === 0 ? this.ui.menuItems.length - 1 : this.focusIndex - 1;
        $(this.ui.menuItems[this.focusIndex]).focus();
        break;

       case 40:
        event.preventDefault();
        event.stopPropagation();
        this.focusIndex = this.focusIndex === this.ui.menuItems.length - 1 ? 0 : this.focusIndex + 1;
        $(this.ui.menuItems[this.focusIndex]).focus();
        break;
      }
    },
    _triggerFocusLoss: function(event, isDirectionBackward) {
      this.trigger("focus:lost", isDirectionBackward);
      if (!_.isEmpty(this.options.parentView.ui.input.val())) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    _onOptionFocusEvent: function(event) {
      $(event.target).parent().parent().toggleClass("focus-active");
    }
  });
  return SearchOptionsView;
});