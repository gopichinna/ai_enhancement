/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "i18n!d2/dialogs/target.browse/impl/header/search.box/impl/nls/lang", "hbs!d2/dialogs/target.browse/impl/header/search.box/impl/search.options", "i18n", "i18n!d2/widgets/navigation.header/controls/search/impl/nls/lang", "dctmw/utils/rest.resources", "nuc/utils/base", "css!d2/dialogs/target.browse/impl/header/search.box/impl/search.box" ], function(module, _, $, Marionette, lang, template, i18n, optionLang, RestResources, base) {
  "use strict";
  var DropdownOptionsView = Marionette.ItemView.extend({
    template: template,
    tagName: "ul",
    attributes: {
      role: "menu",
      class: "d2-contentassist-search-menu"
    },
    templateHelpers: function() {
      var messages = {
        placeholder: lang.placeholder,
        clearerTitle: lang.clearerTitle,
        searchIconTitle: lang.searchIconTitle,
        searchBoxTitle: lang.searchBoxTitle,
        searchOptionsTitle: lang.searchOptionsTitle,
        searchOptionsSelect: lang.searchOptionsSelect,
        startSearch: lang.startSearch,
        searchIconAria: lang.searchIconAria
      };
      var filteredItems = _.filter(this.items, function(item) {
        return _.contains(this.perspectiveToOptionsMap[this.selectedPerspective], item.id);
      }.bind(this));
      if (this.selectedPerspective === "search") {
        filteredItems[0].isDefault = true;
      }
      return {
        messages: messages,
        items: _.map(filteredItems, function(item) {
          return _.extend({}, item, {
            optionId: "o_" + item.id
          });
        }),
        cid: this.cid
      };
    },
    ui: {
      menuItems: '> li[role="menuitem"]'
    },
    events: {
      'click input[type="radio"]': "_onSelectionChange",
      "click .tick-icon-container": "_onTickIconClick"
    },
    constructor: function DropdownOptionsView(options) {
      var currentRepository = RestResources.getCurrentRepository();
      this.repository = {
        id: currentRepository.id,
        repositoryName: base.escapeHtml(currentRepository.get("description") || currentRepository.get("name"))
      };
      this.direction = i18n.settings.rtl ? "left" : "right";
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.storage = options.storage;
      this.localScope = options.localScope;
      this._updatePerspective(this);
      this.currentDropDownSelection = this.$el.find("input:checked").attr("id");
      if (!this.currentDropDownSelection) {
        this.currentDropDownSelection = _.find(this.items, "isDefault").id;
      }
    },
    onRender: function() {
      this._restoreSelectionOrSetDefault();
      this.currentDropDownSelection = this.$el.find("input:checked").attr("id").split("-")[0];
    },
    _updatePerspective: function() {
      this.perspectiveToOptionsMap = {
        home: [],
        node: [ "repo", "folder", "folder_and_subfolder" ],
        search: [ "repo", "search_result" ]
      };
      this.items = [ {
        id: "repo",
        styleClass: "",
        labelContent: _.str.sformat(optionLang.soLabelRepo, "<span>'" + this.repository.repositoryName + "'</span>")
      }, {
        id: "folder",
        isDefault: true,
        styleClass: "",
        labelContent: optionLang.soLabelCurrentFolder
      }, {
        id: "folder_and_subfolder",
        styleClass: "",
        labelContent: optionLang.soLabelCurrentFolderDeep
      }, {
        id: "search_result",
        styleClass: "",
        labelContent: optionLang.soLabelWithinSearch
      } ];
      this.selectedPerspective = this.options.localScope;
    },
    _onSelectionChange: function(event) {
      event.stopPropagation();
      var selectedOption = this.getSelectedOption();
      selectedOption = selectedOption.split("-")[0];
      this.storage.set(this.selectedPerspective, selectedOption);
      this.currentDropDownSelection = selectedOption;
    },
    _onTickIconClick: function(event) {
      $(event.target).siblings("input").trigger("click");
    },
    getSelectedOption: function() {
      var selectedId = this.$el.find("input:checked").attr("id");
      if (!selectedId) {
        selectedId = _.find(this.items, "isDefault").id;
      }
      return selectedId;
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
    }
  });
  return DropdownOptionsView;
});