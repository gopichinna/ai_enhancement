/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/handlebars", "d2/widgets/user.info/user.info.view", "d2/utils/task.utils", "d2/utils/user.utils", "hbs!d2/dialogs/digital.signature/signee.form/impl/signee.form.view", "i18n!d2/dialogs/digital.signature/signee.form/impl/nls/lang", "i18n!d2/controls/form/impl/nls/lang", "css!d2/dialogs/digital.signature/signee.form/impl/signee.form" ], function($, _, Backbone, Marionette, Handlebars, UserInfoView, TaskUtils, userUtils, SigneeFormTemplate, lang, FormLang) {
  "use strict";
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return Marionette.ItemView.extend({
    template: SigneeFormTemplate,
    className: "d2-signature-signee-form",
    ui: {
      signee: ".d2-signature-signee",
      signeeContainer: ".d2-signature-signee-container",
      email: ".d2-signature-signee-email",
      emailContainer: ".d2-signature-signee-email-container",
      inlineError: ".d2-signature-signee-inline-error",
      add: ".d2-signature-signee-add",
      cancel: ".d2-signature-signee-cancel",
      buttons: ".d2-signature-signee-form-buttons"
    },
    events: {
      "click @ui.signee": "onClickSignee",
      "click @ui.email": "onClickEmail",
      focus: "onFormFocus",
      "focusout @ui.signeeContainer": "onFocusOutSignee",
      "focusout @ui.emailContainer": "onFocusOutEmail",
      "click @ui.add": "onAdd",
      "keyup @ui.add": "onAddKeyUp",
      "click @ui.cancel": "onCancel",
      "keyup @ui.cancel": "onCancelKeyUp",
      "input @ui.signee": "showButtons",
      "input @ui.email": "showButtons"
    },
    templateHelpers: function() {
      return {
        signee_label: lang.signeeLabel,
        email_label: lang.emailLabel,
        signee_placeholder: lang.signeePlaceholder,
        email_placeholder: lang.emailPlaceholder,
        add_tooltip: lang.addTooltip,
        cancel_tooltip: this.options.cancelTooltip || lang.cancelTooltip
      };
    },
    constructor: function SigneeFormView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.currentUsers = this.options.collection;
      this.userData = this.options.userData || new Backbone.Collection();
    },
    isValid: function() {
      return this.ui.inlineError.hasClass("binf-hidden");
    },
    refreshButtons: function() {
      this.options.wizard && this.options.wizard.refreshFooter([ "next" ]);
    },
    onFormFocus: function() {
      this.ui.signee[0]["focus"]();
    },
    showButtons: function() {
      if (_.isEmpty(this.ui.signee.val()) && _.isEmpty(this.ui.email.val())) {
        return this.hideButtons();
      }
      this.ui.buttons.removeClass("binf-hidden");
      this.options.parentView && this.options.parentView.currentlyFocusedElement({
        preventScroll: true
      });
    },
    hideButtons: function() {
      if (this.options.alwaysShowButtons) {
        return;
      }
      this.ui.buttons.addClass("binf-hidden");
      this.options.parentView && this.options.parentView.currentlyFocusedElement({
        preventScroll: true
      });
    },
    onRender: function() {
      var emptyTemplate = Handlebars.compile('<li class="d2-signature-signee-no-results">{{langNoResults}}</li>')({
        langNoResults: lang.noResults
      }), typeaheadOptions = {
        items: "all",
        minLength: 0,
        autoSelect: false,
        matcher: this.filter,
        sorter: this.sort,
        source: _.bind(this._getSourceData, this, true),
        displayText: _.bind(this._getDisplayData, this, true),
        highlighter: _.bind(this._renderItemView, this, true),
        afterSelect: _.bind(this._afterSelection, this, true),
        prettyScrolling: true,
        appendTo: this.ui.signeeContainer,
        beforeShow: this._adjustScrollContainerHeight,
        afterShow: _.bind(this._afterShow, this),
        handleNoResults: true,
        emptyTemplate: emptyTemplate
      };
      this.ui.signee.typeahead(typeaheadOptions);
      this.ui.email.typeahead(_.extend({}, typeaheadOptions, {
        source: _.bind(this._getSourceData, this, false),
        displayText: _.bind(this._getDisplayData, this, false),
        highlighter: _.bind(this._renderItemView, this, false),
        afterSelect: _.bind(this._afterSelection, this, false),
        appendTo: this.ui.emailContainer
      }));
      this.ui.signee.data("typeahead").$scrollContainer.on("mousedown", function(e) {
        e.preventDefault();
      });
      this.ui.email.data("typeahead").$scrollContainer.on("mousedown", function(e) {
        e.preventDefault();
      });
      this._hideLoaders();
    },
    onShow: function() {
      this.hideButtons();
      this.validate();
    },
    _hideLoaders: function() {
      this.ui.signee.siblings(".d2-lazy-loading").hide();
      this.ui.email.siblings(".d2-lazy-loading").hide();
    },
    _filterUsersFromData: function(userData) {
      var models = [];
      if (this.currentUsers && this.currentUsers.length && this.currentUsers.at(0).get("usersList") instanceof Backbone.Collection) {
        models = userData.models;
        this.currentUsers.each(function(userList) {
          models = models.filter(function(model) {
            return !userList.get("usersList") || !userList.get("usersList").length || !userList.get("usersList").findWhere({
              id: model.get("id")
            });
          });
        });
      } else {
        models = userData.models.filter(function(model) {
          return !this.currentUsers || !this.currentUsers.length || !this.currentUsers.findWhere({
            id: model.get("id")
          });
        }.bind(this));
      }
      return models;
    },
    _getSourceData: function(isUserName, query) {
      var deferred = $.Deferred(), input = isUserName ? this.ui.signee : this.ui.email;
      if (input.data("typeahead").shown) {
        if (!this.userData.allUsersFetched) {
          input.typeahead("hide");
          input.siblings(".d2-lazy-loading").show();
        }
      } else {
        input.siblings(".d2-lazy-loading").show();
      }
      if (!this.userData.allUsersFetched) {
        TaskUtils.getUserForDigitalSignature(this.options.model, query).done(function(userResponse) {
          this.userData.reset();
          this.userData.hasMoreRecords = false;
          this.userData.add(_.values(userResponse.userData));
          if (userResponse["has-more-records"]) {
            this.userData.hasMoreRecords = true;
          } else if (_.isEmpty(query)) {
            this.userData.allUsersFetched = true;
          }
          if (_.isEmpty(query)) {
            this.userData.totalCount = this.userData.length;
          }
          deferred.resolve(this._filterUsersFromData(this.userData));
        }.bind(this)).fail(function() {
          this._hideLoaders();
          deferred.reject.apply(deferred, arguments);
        }.bind(this));
      } else {
        setTimeout(function() {
          deferred.resolve(this._filterUsersFromData(this.userData));
        }.bind(this), 20);
      }
      return deferred.promise();
    },
    _getDisplayData: function(isUserName, item) {
      return isUserName ? item.get("id") : item.get("user_address") === "" ? item : item.get("user_address");
    },
    _renderItemView: function(isUserName, item) {
      var userModel = isUserName ? this.userData.findWhere({
        id: item
      }) : item instanceof Backbone.Model ? item : this.userData.findWhere({
        user_address: item
      }), userInfoView = new UserInfoView({
        model: userModel,
        context: this.options.context
      }), ele = $('<div class="user-container"></div>');
      ele.on("user:profile:picture:fetch", _.bind(this._onScrollIntoView, this, ele, userInfoView));
      return ele[0];
    },
    _onScrollIntoView: function(ele, userInfoView) {
      userInfoView.render();
      userInfoView.updateInfoText(userInfoView.model.get("searchRegex"));
      userInfoView.$el.appendTo(ele);
      ele.addClass("user-profile-image-fetched");
    },
    filter: function(item) {
      var userId = item.get("id"), userAddress = item.get("user_address"), status, searchText = this.query, searchRegex = null;
      if (searchText && searchText.length > 0) {
        searchText = searchText.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        searchText = searchText.replace(/\?/g, ".");
        searchText = searchText.replace(/\*/g, ".*?");
        searchRegex = new RegExp(searchText, "gi");
      }
      if (!_.isNull(searchRegex)) {
        if (userId && userId.match(searchRegex) || userAddress && userAddress.match(searchRegex)) {
          item.set("searchRegex", searchRegex);
          status = true;
        } else {
          status = false;
        }
      } else {
        item.set("searchRegex", searchRegex);
        status = true;
      }
      return status;
    },
    sort: function(items) {
      return _.sortBy(items, function(model) {
        return model.get("id");
      });
    },
    _adjustScrollContainerHeight: function(typeaheadContext) {
      var elemBoundingRect = typeaheadContext.$element[0].getBoundingClientRect(), spaceOnBottom = window.innerHeight - (elemBoundingRect.top + elemBoundingRect.height);
      spaceOnBottom = Math.abs(spaceOnBottom * .9);
      if (spaceOnBottom < 240 && Math.abs(elemBoundingRect.top * .9) > 240) {
        typeaheadContext.scrollContainerHeight = typeaheadContext.options.scrollContainerHeight = 240;
        typeaheadContext.showOnTop = true;
      } else {
        typeaheadContext.scrollContainerHeight = typeaheadContext.options.scrollContainerHeight = Math.min(spaceOnBottom, 240);
        typeaheadContext.showOnTop = false;
      }
    },
    _afterShow: function(typeaheadContext) {
      var scrollContainer = typeaheadContext.$element.siblings(".typeahead.scroll-container");
      this._addSearchResultMessage(typeaheadContext);
      userUtils.fetchUserProfilePictureForVisibleOptions(scrollContainer, "user-container");
      scrollContainer.off("scroll").on("scroll", _.bind(this._onDropdownScroll, this, scrollContainer));
      this._updateSelected(typeaheadContext);
      this._hideLoaders();
      if (typeaheadContext.showOnTop) {
        typeaheadContext.$appendTo.css({
          top: typeaheadContext.$element.position().top - typeaheadContext.$scrollContainer.height()
        });
      } else {
        typeaheadContext.$appendTo.css({
          top: typeaheadContext.$element.position().top + typeaheadContext.$element.outerHeight()
        });
      }
    },
    _onDropdownScroll: function(scrollContainer) {
      userUtils.fetchUserProfilePictureForVisibleOptions(scrollContainer, "user-container");
    },
    _addSearchResultMessage: function(typeaheadContext) {
      var matchCount = typeaheadContext.$element.parent().find("li:not(.d2-signature-signee-no-results):not(.d2-signature-signee-result-message):not(.csui-loading-parent-wrapper)").length, totalCount = this.userData.totalCount, scrollContainer = typeaheadContext.$scrollContainer, message, messageLabel;
      if (totalCount === null || totalCount === undefined) {
        messageLabel = FormLang.showingResultsNoTotal;
      } else if (this.userData.hasMoreRecords) {
        messageLabel = FormLang.showingHasMore;
      } else {
        messageLabel = FormLang.showingResultsOfMatches;
      }
      if (_.isEmpty(typeaheadContext.query)) {
        message = _.str.sformat(messageLabel, totalCount, totalCount);
        matchCount = this.userData.hasMoreRecords ? matchCount : 0;
      } else {
        message = _.str.sformat(messageLabel, matchCount, totalCount);
      }
      if (matchCount > 0) {
        typeaheadContext.$element.parent().find(".typeahead.binf-dropdown-menu").prepend('<li class="d2-signature-signee-result-message">' + message + "</li>");
        scrollContainer.height(scrollContainer.height() + 24);
      }
      scrollContainer.perfectScrollbar("update");
    },
    _updateSelected: function(typeaheadContext) {
      var activeElement = typeaheadContext.$menu.find(".binf-active");
      activeElement.find(".user-container:not(.user-profile-image-fetched)").trigger("user:profile:picture:fetch");
      if (this.selection && activeElement && activeElement.length && this.selection.get("id") === activeElement.find(".user-id").text() && !activeElement.hasClass("selected")) {
        activeElement.addClass("selected");
        typeaheadContext.scrollIntoView(activeElement[0]);
        typeaheadContext.$element.select();
      }
    },
    _afterSelection: function(isUserName, userModel) {
      if (userModel) {
        if (!isUserName) {
          this.ui.signee.val(userModel.get("id"));
          userModel.get("user_address") === "" && this.ui.email.val("");
          this.ui.email.select();
        }
        if (isUserName) {
          this.ui.email.val(userModel.get("user_address"));
          this.ui.signee.select();
        }
        this.selection = userModel;
      } else {
        this.selection = null;
      }
      this.validate();
      this.showButtons();
    },
    onClickSignee: function() {
      if (!this.ui.signee.data("typeahead").shown) {
        this.ui.signee.typeahead("lookup", "");
      } else {
        this.ui.signee.typeahead("hide");
      }
    },
    onFocusOutSignee: function() {
      setTimeout(function() {
        if (this.ui.signeeContainer.has(document.activeElement).length === 0) {
          if (!this.selection || this.ui.signee.val() !== this.selection.get("id")) {
            if (!this.options.model.get("allow_external_users")) {
              this.ui.signee.val("");
              this.ui.email.val("");
            }
            this.selection = null;
          }
        }
        this.validate();
      }.bind(this));
    },
    onClickEmail: function() {
      if (!this.ui.email.data("typeahead").shown) {
        this.ui.email.typeahead("lookup", "");
      } else {
        this.ui.email.typeahead("hide");
      }
    },
    onFocusOutEmail: function() {
      setTimeout(function() {
        if (this.ui.emailContainer.has(document.activeElement).length === 0) {
          if (!this.selection || this.ui.email.val() !== this.selection.get("user_address")) {
            if (!this.options.model.get("allow_external_users")) {
              this.ui.signee.val("");
              this.ui.email.val("");
            }
            this.selection = null;
          }
        }
        this.validate();
      }.bind(this));
    },
    _updateAddButton: function(disable) {
      this.ui.add.attr && this.ui.add.attr("disabled", disable);
      disable ? this.ui.add.attr && this.ui.add.attr("tabindex", "-1") : this.ui.add.attr && this.ui.add.attr("tabindex", "0");
    },
    validate: function() {
      var user = this.ui.signee.val && this.ui.signee.val(), email = this.ui.email.val && this.ui.email.val();
      this.ui.inlineError.addClass && this.ui.inlineError.addClass("binf-hidden");
      this.refreshButtons();
      this.$el.removeClass("error-form");
      this.ui.email.removeClass && this.ui.email.removeClass("error");
      if (_.isEmpty(email) || _.isNull(email) || _.isUndefined(email)) {
        this._updateAddButton(true);
        return;
      }
      if (!email.match(emailRegex)) {
        this._updateAddButton(true);
        this.ui.inlineError.removeClass && this.ui.inlineError.removeClass("binf-hidden");
        this.$el.addClass("error-form");
        this.ui.inlineError.text && this.ui.inlineError.text(lang.invalidEmailError);
        this.ui.email.addClass && this.ui.email.addClass("error");
        this.refreshButtons();
        return;
      }
      if (_.isEmpty(user) || _.isNull(user) || _.isUndefined(user)) {
        this._updateAddButton(true);
        return;
      }
      if (this.selection) {
        this._updateAddButton(false);
      } else if (this.options.model.get("allow_external_users")) {
        if (this.checkExistingUsers(user, email)) {
          this.ui.inlineError.removeClass && this.ui.inlineError.removeClass("binf-hidden");
          this.$el.addClass("error-form");
          this.ui.inlineError.text && this.ui.inlineError.text(_.str.sformat(lang.existingUserError, user));
          this._updateAddButton(true);
          this.refreshButtons();
        } else {
          this._updateAddButton(false);
        }
      } else {
        this._updateAddButton(true);
      }
    },
    checkExistingUsers: function(user, email) {
      var exists = false;
      if (this.currentUsers && this.currentUsers.length) {
        if (this.currentUsers.at(0).get("usersList") instanceof Backbone.Collection) {
          this.currentUsers.each(function(userList) {
            exists = exists || userList.get("usersList") && userList.get("usersList").length && (userList.get("usersList").findWhere({
              user_address: email
            }) || userList.get("usersList").findWhere({
              id: user
            }));
          });
        } else {
          exists = this.currentUsers.findWhere({
            user_address: email
          }) || this.currentUsers.findWhere({
            id: user
          });
        }
      }
      return exists;
    },
    _afterActionPerform: function() {
      this.selection = null;
      this.ui.signee.val && this.ui.signee.val("");
      this.ui.email.val && this.ui.email.val("");
      this.validate();
      this.hideButtons();
      this.ui.signee.trigger && this.ui.signee.trigger("focus");
    },
    onAddKeyUp: function(event) {
      switch (event.keyCode) {
       case 32:
       case 13:
        this.onAdd(event);
        break;
      }
    },
    onAdd: function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.selection) {
        this.triggerMethod("add:user", this.selection);
      } else {
        var userModel = new Backbone.Model({
          id: this.ui.signee.val(),
          user_address: this.ui.email.val()
        });
        this.triggerMethod("add:user", userModel);
      }
      this._afterActionPerform();
    },
    onCancelKeyUp: function(event) {
      switch (event.keyCode) {
       case 32:
       case 13:
        this.onCancel(event);
        break;
      }
    },
    onCancel: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.triggerMethod("cancel:add:user");
      this._afterActionPerform();
    }
  });
});