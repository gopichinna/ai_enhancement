/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/base", "csui/controls/userpicker/userpicker.view", "esoc/controls/userwidget/userwidget.view", "esoc/controls/userwidget/userwidget.model.mixin", "esoc/widgets/userwidget/view/userpickercard.view", "esoc/widgets/userwidget/model/userpicker.model" ], function(_require, _, $, Marionette, Base, UserPickerView, UserWidgetView, UserWidgetModelMixin, UserPickerCardView, UserPickerCollection) {
  var CustomUserPickerView = UserPickerView.extend({
    constructor: function CustomUserPickerView(options) {
      options || (options = {});
      options.userView = options.widgetoptions.showActions ? UserPickerCardView : "";
      options.connector = options.widgetoptions.connector;
      options.relation = options.widgetoptions.relation;
      var userPickerCollection = new UserPickerCollection(options);
      options.collection = options.widgetoptions.showActions ? userPickerCollection : "";
      this.options = options;
      UserPickerView.prototype.constructor.apply(this, arguments);
    },
    currentlyFocusedElement: function(event) {
      if (!!this.ui.searchclear && $(this.ui.searchclear).is(":visible")) {
        this.ui.searchclear.attr("tabindex", "0").attr("data-cstabindex", "0");
      } else {
        this.ui.searchbox.attr("tabindex", "0").attr("data-cstabindex", "0");
      }
      return undefined;
    },
    _retrieveMembers: function(query) {
      var self = this;
      self.collection.query = query;
      return self.collection.fetch({
        reset: true
      }).then(function() {
        if (typeof self.options.onRetrieveMembers === "function") {
          self.options.onRetrieveMembers({
            collection: self.collection
          });
        }
        return self.collection.models;
      });
    },
    _resetInput: function(e) {
      if (e.target.className !== "esoc-activityfeed-invisiblebutton" && e.target.className !== "activityfeed-expand-invisiblebutton") {
        $(".typeahead.binf-form-control.cs-search").val("");
      }
    },
    onShow: function(e) {
      if (this.options.widgetoptions.showActions) {
        $(".typeahead.binf-form-control.cs-search").on("focusout", this, this._resetInput);
      }
    },
    _afterSelect: function(model) {
      if (this.options.widgetoptions.showActions) {
        var pickerOptions = _.extend({}, this.options.widgetoptions);
        delete pickerOptions["model"];
        this.parseModelResponse(model);
        pickerOptions.model = model;
        pickerOptions.userid = model.attributes.id;
        UserWidgetView = !!UserWidgetView ? UserWidgetView : _require("esoc/controls/userwidget/userwidget.view");
        var newUserWidgetView = new UserWidgetView(pickerOptions);
        newUserWidgetView.showUserProfileDialog();
      } else {
        var val = this.options.clearOnSelect ? "" : Base.formatMemberName(model);
        this.ui.searchbox.val(val);
        this.updateStyles();
        this.options.userView.userPicked = true;
        this.trigger("item:change", {
          item: model
        });
      }
    },
    _nextHighlighter: function(e) {
      if (this.options.widgetoptions.showActions && e.data("value")) {
        e.data("value").trigger("show:Actions");
      }
    },
    _currentHighlighter: function(e) {
      if (this.options.widgetoptions.showActions && e.data("value")) {
        e.data("value").trigger("hide:Actions");
      }
    },
    _positionContainer: function(context) {
      context.$scrollContainer.perfectScrollbar("update");
      if (this.collection.length > 0) {
        context.$menu.removeClass("csui-no-results-wrapper");
      }
      UserPickerView.prototype._positionContainer.call(this, context);
      context.$element.css("height", "");
    }
  });
  _.extend(CustomUserPickerView.prototype, UserWidgetModelMixin);
  return CustomUserPickerView;
});