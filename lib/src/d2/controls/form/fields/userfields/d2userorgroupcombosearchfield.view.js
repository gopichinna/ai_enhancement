/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/controls/form/fields/userfields/d2usercombofield.view", "i18n!d2/controls/form/impl/nls/lang", "hbs!d2/controls/form/fields/userfields/impl/d2userorgroupcombosearchfield", "css!d2/controls/form/fields/userfields/impl/d2userorgroupcombosearchfield" ], function(_, D2UserComboFieldView, lang, D2UserOrGroupComboSearchViewTemplate) {
  var D2UserOrGroupComboSearchFieldView = D2UserComboFieldView.extend({
    template: D2UserOrGroupComboSearchViewTemplate,
    templateHelpers: function() {
      return _.extend(D2UserComboFieldView.prototype.templateHelpers.apply(this, arguments), {
        searchText: lang.searchText,
        clearSearchText: lang.clearSearchText
      });
    },
    className: function() {
      var parentClassName = D2UserComboFieldView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + " d2-user-or-group-combo-search-field";
    },
    ui: _.extend(_.result(D2UserComboFieldView.prototype, "ui"), {
      searchInputField: ".dctmw-combofield-search-box-input",
      clearSearchTextIcon: ".csui-icon.d2-clear-icon"
    }),
    events: _.extend(_.result(D2UserComboFieldView.prototype, "events"), {
      "click @ui.clearSearchTextIcon": "onClickClearSearchTextcon",
      "keydown @ui.clearSearchTextIcon": "onKeyDownClearSearchTextIcon"
    }),
    childViewOptions: function() {
      var parentChildViewOptions = D2UserComboFieldView.prototype.childViewOptions, childOptions = parentChildViewOptions.apply(this, arguments);
      return _.extend(childOptions, {
        userInfoId: "user_name"
      });
    },
    constructor: function D2UserOrGroupComboSearchFieldView() {
      D2UserComboFieldView.prototype.constructor.apply(this, arguments);
    },
    getOptionMatchChecker: function() {
      var me = this;
      return function(model, searchRegex) {
        var userId = model.get("id"), userData = me._getUserData(userId), userName = userData["user_name"], userAddress = userData["user_address"], status = false;
        if (!_.isNull(searchRegex)) {
          if (userName && userName.match(searchRegex) || userAddress && userAddress.match(searchRegex)) {
            status = true;
          } else {
            status = false;
          }
        } else {
          status = true;
        }
        model.set("exactMatch", false);
        return status;
      };
    },
    _getPlaceHolder: function() {
      var fieldOptions = this.options.model.get("options");
      if (fieldOptions && fieldOptions.placeholder) {
        return fieldOptions.placeholder;
      }
      return D2UserComboFieldView.__super__._getPlaceHolder.call(this);
    },
    _isPopoverEnabled: function() {
      return false;
    },
    _raiseValueChanged: function() {
      D2UserComboFieldView.__super__._raiseValueChanged.call(this);
      this._hideOrShowClearSearchTextIcon();
    },
    onClickClearSearchTextcon: function() {
      this.eventSource = undefined;
      this.setValue(null, true);
      this._updateSelectedOption(this.getValue());
    },
    onKeyDownClearSearchTextIcon: function(event) {
      if (event && event.which) {
        var keyCode = event.which;
        if (keyCode === 13 || keyCode === 32) {
          this.onClickClearSearchTextcon();
        }
      }
    },
    _hideOrShowClearSearchTextIcon: function() {
      if (this.ui.searchInputField.val()) {
        this.ui.clearSearchTextIcon.removeClass("binf-hidden");
      } else {
        this.ui.clearSearchTextIcon.addClass("binf-hidden");
      }
    }
  });
  return D2UserOrGroupComboSearchFieldView;
});