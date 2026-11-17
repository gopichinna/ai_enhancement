/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "hbs!d2/dialogs/new.file/create/impl/sort/impl/sort.menu", "csui/lib/binf/js/binf" ], function(module, require, $, _, Backbone, Marionette, log, lang, template) {
  var SortingView = Marionette.ItemView.extend({
    className: "cs-sort-links",
    template: template,
    constants: {
      NAME_ASC: "asc_name",
      NAME_DESC: "desc_name",
      SUBJECT_ASC: "asc_subject",
      SUBJECT_DESC: "desc_subject",
      TITLE_ASC: "asc_title",
      TITLE_DESC: "desc_title"
    },
    templateHelpers: function() {
      var self = this, sortListArray = [];
      _.each(this.constants, function(val) {
        sortListArray.push({
          key: val,
          value: lang[val],
          selected: false
        });
      });
      return {
        id: _.uniqueId("sortButton"),
        selectedValue: self.selectedValue,
        selectedArrow: self.selectedArrow,
        sortListArray: sortListArray
      };
    },
    ui: {
      sortOrderBtn: "#search-sort-btn"
    },
    events: {
      "click .binf-dropdown-menu > li > a": "onSortOptionClick"
    },
    constructor: function SortingView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      var state_order = options.collection.sorting.sort[0].value;
      var setLableName = state_order || this.constants.NAME_ASC;
      var labelName = this.OverlapDisplayText(setLableName);
      this.actualValue = labelName;
      this.selectedValue = lang[state_order] || lang[this.constants.NAME_ASC];
      this.selectedArrow = this.options.collection.orderstate || "icon-sortArrowUp";
      this.config = this.options.config || {};
      this.ruCollection = this.options.ruCollection;
    },
    onSortOptionClick: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.$el.find(".d2-search-sort-options li > a").removeClass("binf-active");
      this.$el.find(".d2-search-sort-options li > a > span").removeClass("icon-listview-checkmark");
      this.$(event.currentTarget).addClass("binf-active");
      this.resetSelection(event.currentTarget.children[1].id);
    },
    resetSelection: function(name) {
      switch (name) {
       case this.constants.NAME_ASC:
        this.collection.setOrder("template_object_name asc");
        this.selectedValue = lang[name];
        this.sortColumn = "template_object_name";
        this.actualValue = lang.nameColumnHeader;
        this.selectedArrow = "icon-sortArrowUp";
        this.options.collection.state = this.constants.NAME_ASC;
        this.options.collection.sorting.sort[0].value = this.constants.NAME_ASC;
        this.options.collection.orderstate = this.selectedArrow;
        this.ruCollection.setOrder("template_object_name asc");
        this.options.ruCollection.state = this.constants.NAME_ASC;
        this.options.ruCollection.sorting.sort[0].value = this.constants.NAME_ASC;
        this.options.ruCollection.orderstate = this.selectedArrow;
        break;

       case this.constants.NAME_DESC:
        this.collection.setOrder("template_object_name desc");
        this.selectedValue = lang[name];
        this.sortColumn = "template_object_name";
        this.actualValue = lang.nameColumnHeader;
        this.selectedArrow = "icon-sortArrowDown";
        this.options.collection.state = this.constants.NAME_DESC;
        this.options.collection.sorting.sort[0].value = this.constants.NAME_DESC;
        this.options.collection.orderstate = this.selectedArrow;
        this.ruCollection.setOrder("template_object_name desc");
        this.options.ruCollection.state = this.constants.NAME_DESC;
        this.options.ruCollection.sorting.sort[0].value = this.constants.NAME_DESC;
        this.options.ruCollection.orderstate = this.selectedArrow;
        break;

       case this.constants.SUBJECT_ASC:
        this.collection.setOrder("template_subject asc");
        this.selectedValue = lang[name];
        this.sortColumn = "template_subject";
        this.actualValue = lang.subjectColumnHeader;
        this.selectedArrow = "icon-sortArrowUp";
        this.options.collection.state = this.constants.SUBJECT_ASC;
        this.options.collection.sorting.sort[0].value = this.constants.SUBJECT_ASC;
        this.options.collection.orderstate = this.selectedArrow;
        this.ruCollection.setOrder("template_subject asc");
        this.options.ruCollection.state = this.constants.SUBJECT_ASC;
        this.options.ruCollection.sorting.sort[0].value = this.constants.SUBJECT_ASC;
        this.options.ruCollection.orderstate = this.selectedArrow;
        break;

       case this.constants.SUBJECT_DESC:
        this.collection.setOrder("template_subject desc");
        this.selectedValue = lang[name];
        this.sortColumn = "template_subject";
        this.actualValue = lang.subjectColumnHeader;
        this.selectedArrow = "icon-sortArrowDown";
        this.options.collection.state = this.constants.SUBJECT_DESC;
        this.options.collection.sorting.sort[0].value = this.constants.SUBJECT_DESC;
        this.options.collection.orderstate = this.selectedArrow;
        this.ruCollection.setOrder("template_subject desc");
        this.options.ruCollection.state = this.constants.SUBJECT_DESC;
        this.options.ruCollection.sorting.sort[0].value = this.constants.SUBJECT_DESC;
        this.options.ruCollection.orderstate = this.selectedArrow;
        break;

       case this.constants.TITLE_ASC:
        this.collection.setOrder("template_title asc");
        this.selectedValue = lang[name];
        this.sortColumn = "template_title";
        this.actualValue = lang.titleColumnHeader;
        this.selectedArrow = "icon-sortArrowUp";
        this.options.collection.state = this.constants.TITLE_ASC;
        this.options.collection.sorting.sort[0].value = this.constants.TITLE_ASC;
        this.options.collection.orderstate = this.selectedArrow;
        this.ruCollection.setOrder("template_title asc");
        this.options.ruCollection.state = this.constants.TITLE_ASC;
        this.options.ruCollection.sorting.sort[0].value = this.constants.TITLE_ASC;
        this.options.ruCollection.orderstate = this.selectedArrow;
        break;

       case this.constants.TITLE_DESC:
        this.collection.setOrder("template_title desc");
        this.selectedValue = lang[name];
        this.sortColumn = "template_title";
        this.actualValue = lang.titleColumnHeader;
        this.selectedArrow = "icon-sortArrowDown";
        this.options.collection.state = this.constants.TITLE_DESC;
        this.options.collection.sorting.sort[0].value = this.constants.TITLE_DESC;
        this.options.collection.orderstate = this.selectedArrow;
        this.ruCollection.setOrder("template_title desc");
        this.options.ruCollection.state = this.constants.TITLE_DESC;
        this.options.ruCollection.sorting.sort[0].value = this.constants.TITLE_DESC;
        this.options.ruCollection.orderstate = this.selectedArrow;
        break;
      }
      var self = this;
      this.options.ruCollection.fetch({
        silent: true
      }).then(function() {
        self.trigger("render:sortmenu", self.sortColumn);
        self.$el.find(".binf-dropdown-toggle >span").innerText = lang[name];
        self.$el.find(".csui-sort-option > span.cs-icon").removeClass("icon-listview-checkmark");
        self.$el.find(".csui-sort-option.binf-active > span.cs-icon").addClass("icon-listview-checkmark");
        var labelName = self.OverlapDisplayText(name);
        self.$el.find(".binf-dropdown-toggle >span.cs-label").html(labelName);
        self.$el.find(".csui-sort-arrow").removeClass("icon-sortArrowDown");
        self.$el.find(".csui-sort-arrow").removeClass("icon-sortArrowUp");
        self.$el.find(".csui-sort-arrow").addClass(self.selectedArrow);
        self.$el.find(".d2-search-sort-options").removeClass("binf-open");
      }, self);
      this.options.collection.fetch({
        silent: true
      });
    },
    OverlapDisplayText: function(displayname) {
      var labelName = "";
      switch (displayname) {
       case this.constants.NAME_ASC:
        labelName = lang.nameColumnHeader;
        break;

       case this.constants.NAME_DESC:
        labelName = lang.nameColumnHeader;
        break;

       case this.constants.SUBJECT_ASC:
        labelName = lang.subjectColumnHeader;
        break;

       case this.constants.SUBJECT_DESC:
        labelName = lang.subjectColumnHeader;
        break;

       case this.constants.TITLE_ASC:
        labelName = lang.titleColumnHeader;
        break;

       case this.constants.TITLE_DESC:
        labelName = lang.titleColumnHeader;
        break;

       default:
        labelName = lang.nameColumnHeader;
      }
      return labelName;
    },
    onRender: function() {
      var self = this;
      self.$el.find(".csui-search-sort-options li>a span.cs-label").each(function() {
        if ($(this).text().trim() === self.selectedValue) {
          $(this).siblings().addClass("icon-listview-checkmark");
        }
      }, self);
    }
  });
  return SortingView;
});