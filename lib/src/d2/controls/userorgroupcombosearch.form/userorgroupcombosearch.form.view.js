/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "csui/models/form", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "d2/utils/user.utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/controls/behaviors/wizard.tabable.region.behavior" ], function($, _, Backbone, Url, FormModel, D2FormView, MetadataConverter, userUtils, RestResources, RestLinkrels, WizardTabableRegionBehavior) {
  "use strict";
  var UserOrGroupComboSearchFormView = D2FormView.extend({
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " d2-userorgroupcombosearchform";
    },
    constructor: function UserOrGroupComboSearchFormView(options) {
      options || (options = {});
      options.formContent = this._getSearchUserOrGroupFormContent(options);
      this.node = options.model;
      var self = this, form = MetadataConverter.convertConfig(options.formContent, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field) {
          field.getDataSourceCallBack = function(attr, alpField) {
            var dfd = $.Deferred(), fieldOptions = alpField.options.ds, fieldView = alpField.fieldView, filter = fieldOptions && fieldOptions.filter || "";
            self.getUsers(filter, options).done(function(userResponse) {
              if (userResponse["has-more-records"]) {
                fieldView.collection.hasMoreRecords = true;
              } else if (!filter) {
                fieldView.allUserOptions = userResponse.options;
                field.asynchronous = false;
                delete alpField.options.ds;
              }
              self.setUserData(userResponse.userData);
              dfd.resolve(fieldView.allUserOptions || userResponse.options);
            }).fail(dfd.reject);
            return dfd.promise();
          };
        }
      });
      form.propertiesConfig[0].title = "Search User Permissions Form";
      form.propertiesConfig[0].id = "search-user-permissions-form";
      delete form.propertiesConfig[0].schema.title;
      form.propertiesConfig[0].schema.id = "search-user-permissions-form-schema";
      options.topAlignedLabel = true;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = true;
      options.mode = "create";
      D2FormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "d2:change:form:field", this._onD2ChangeFormField);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    setUserData: function(usersDump) {
      if (!this.userData) {
        this.userData = {};
      }
      _.extend(this.userData, usersDump);
    },
    getUserData: function(userId) {
      if (userId) {
        return this.userData[userId];
      }
      return this.userData;
    },
    getUsers: function(filter) {
      var model = this.node, url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_USERS_AND_GROUPS)), dfd = $.Deferred();
      if (!url) {
        dfd.reject();
      }
      var queryMap = {
        inline: true
      };
      if (filter) {
        filter = filter.toLowerCase();
        var searchUserFilter = '(r_is_group eq false and (contains(lower(dm_user.user_name), "' + filter + '")' + ' or contains(lower(dm_user.user_address), "' + filter + '")))', searchGroupFilter = '(r_is_group eq true and (contains(lower(dm_group.group_name), "' + filter + '")' + ' or contains(lower(dm_group.group_address), "' + filter + '")))', fullFilter = searchUserFilter + " or " + searchGroupFilter;
        queryMap["filter"] = fullFilter;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      $.ajax(model.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var options = [], userData = {};
          if (response && response.entries) {
            _.each(response.entries, function(entry) {
              var id = entry["id"], text = entry["id"];
              if (entry && entry.content && entry.content.properties) {
                var userObject = userUtils.getUserObject(entry.content);
                id = userObject["r_object_id"];
                if (userObject["r_is_group"]) {
                  userObject["user_address"] = userObject["group_address"];
                  userObject["user_name"] = userObject["group_name"];
                }
                text = userObject["user_name"];
                userData[id] = userObject;
              }
              options.push({
                value: id,
                text: text
              });
            });
          }
          dfd.resolve({
            options: options,
            userData: userData,
            "has-more-records": response["has-more-records"]
          });
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    _getSearchUserOrGroupFormContent: function(options) {
      var comboFieldOptions = options.userOrGroupSearchFieldOptions, form = {
        dialog: {
          content: {
            order: 1,
            combo: {
              id: "user_or_group_object_id",
              field_content_type: "USER_OR_GROUP_SEARCH",
              assistance_type: "custom",
              asynchronous: true,
              condition_required: false,
              order: 1,
              autoselect_single: false,
              placeholder: comboFieldOptions.placeholder
            }
          }
        }
      };
      return form;
    },
    _onD2ChangeFormField: function() {
      var formValues = this.getValues(), searchedUserOrGroupId = formValues && formValues["user_or_group_object_id"], searchedUserOrGroupName = searchedUserOrGroupId && searchedUserOrGroupId !== "" ? this.getUserData(searchedUserOrGroupId)["user_name"] : "";
      this.trigger("d2:userorgroup:search:value:change", {
        searchedUserOrGroupId: searchedUserOrGroupId,
        searchedUserOrGroupName: searchedUserOrGroupName
      });
    }
  });
  return UserOrGroupComboSearchFormView;
});