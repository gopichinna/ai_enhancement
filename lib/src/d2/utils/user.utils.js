/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/utils/contexts/factories/connector", "dctmw/lib/uri-templates", "d2/utils/constants", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "i18n!d2/utils/impl/nls/lang" ], function($, _, Url, ConnectorFactory, UriTemplates, constants, utils, RestResources, RestLinkrels, lang) {
  "use strict";
  var externalUserRegex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
  return {
    getUserPhotoUrl: function(userName) {
      return this.getUserProfileImageUrl(userName);
    },
    getUserProfileImageUrl: function(userName) {
      var templateUrl = RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get("links"), RestLinkrels.USER_PROFILE_IMAGE);
      if (templateUrl) {
        var templateParams = {
          "user-name": userName
        }, template = new UriTemplates(templateUrl);
        return template.fill(templateParams);
      }
    },
    uploadUserProfileImage: function(options) {
      var dfd = $.Deferred(), userName = RestResources.getCurrentUser().get("name"), url = this.getUserProfileImageUrl(userName), connector = options.context.getObject(ConnectorFactory);
      var formdata = new FormData();
      formdata.append("metadata", "{}");
      formdata.append("name", options.file, options.file.name);
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: false,
        processData: false,
        data: formdata,
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(utils.parseAjaxError(xhr));
        }
      }));
      return dfd.promise();
    },
    deleteUserProfileImage: function(options) {
      var dfd = $.Deferred(), userName = RestResources.getCurrentUser().get("name"), url = this.getUserProfileImageUrl(userName), connector = options.context.getObject(ConnectorFactory);
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "DELETE",
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(utils.parseAjaxError(xhr));
        }
      }));
      return dfd.promise();
    },
    getUserForSearchText: function(searchText, context) {
      var dfd = $.Deferred(), connector = context.getObject(ConnectorFactory);
      if (searchText) {
        var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.USERS);
        if (!url) {
          dfd.reject();
        }
        var queryMap = {
          inline: true
        };
        searchText = searchText.toLowerCase();
        queryMap["filter"] = '(lower(user_name)="' + searchText + '" or lower(user_address)="' + searchText + '")';
        url = Url.appendQuery(url, Url.combineQueryString(queryMap));
        $.ajax(connector.extendAjaxOptions({
          url: url,
          success: function(response) {
            if (response && response.entries && response.entries.length === 1 && response.entries[0] && response.entries[0].content && response.entries[0].content.properties && response.entries[0].content.links) {
              var userData = response.entries[0].content.properties, userObject = _.extend(_.pick(userData, "r_object_id", "user_name", "user_address"), {
                id: userData["user_name"],
                r_is_group: false,
                links: response.entries[0].content.links
              });
              dfd.resolve(userObject);
            } else {
              dfd.reject(_.str.sformat(lang.userNotFound, searchText));
            }
          },
          error: function(xhr) {
            var error = utils.parseAjaxError(xhr);
            dfd.reject(error && error.message);
          }
        }));
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    getUserDetails: function(userName, context) {
      var dfd = $.Deferred(), connector = context.getObject(ConnectorFactory);
      if (!userName) {
        return $.Deferred().reject().promise();
      }
      var url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.USERS), userName);
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          if (response && response.properties && response.links) {
            var userData = response.properties, userObject = _.extend(userData, {
              id: userData["user_name"],
              links: response.links
            });
            dfd.resolve(userObject);
          } else {
            dfd.reject(_.str.sformat(lang.userNotFound, userName));
          }
        },
        error: function(xhr) {
          var error = utils.parseAjaxError(xhr);
          dfd.reject(error && error.message);
        }
      }));
      return dfd.promise();
    },
    getUsersInGroup: function(groupName, context, eagerFetch, recursive) {
      function fetchUserDataRecursively(url) {
        var deferred = $.Deferred(), connector = context.getObject(ConnectorFactory);
        $.ajax(connector.extendAjaxOptions({
          url: url,
          success: function(response) {
            var groupUsers = [];
            if (response && response.entries && response.entries.length > 0) {
              _.each(response.entries, function(entry) {
                if (entry && entry.content && entry.content.properties) {
                  var userData = entry.content.properties, userObject = _.extend(userData, {
                    id: userData["user_name"],
                    r_is_group: false,
                    links: entry.content.links
                  });
                  groupUsers.push(userObject);
                }
              });
            }
            var nextUrl = RestLinkrels.getLink(response.links, RestLinkrels.NEXT);
            if (nextUrl && eagerFetch) {
              fetchUserDataRecursively(nextUrl).done(function(nextGroupUsers) {
                groupUsers = groupUsers.concat(nextGroupUsers);
                deferred.resolve(groupUsers);
              }).fail(dfd.reject);
            } else {
              deferred.resolve(groupUsers);
            }
          },
          error: function(xhr) {
            var error = utils.parseAjaxError(xhr);
            dfd.reject(error && error.message);
          }
        }));
        return deferred.promise();
      }
      var dfd = $.Deferred(), url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.GROUPS), groupName, "users"), queryMap = {
        inline: true,
        recursive: !!recursive
      };
      queryMap["items-per-page"] = 1e3;
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      fetchUserDataRecursively(url).done(function(groupUsers) {
        dfd.resolve(groupUsers);
      }).fail(function(err) {
        var error = utils.parseAjaxError(err);
        dfd.reject(error && error.message);
      });
      return dfd.promise();
    },
    checkUserMatchWithSearch: function(userId, userAddress, searchRegex) {
      function matchSearchText(str) {
        if (str && searchRegex) {
          str = str.trim();
          var regexRes = searchRegex.exec(str);
          return regexRes && _.isArray(regexRes) && regexRes.length > 0 && regexRes[0] === str;
        }
      }
      return matchSearchText(userId) || matchSearchText(userAddress);
    },
    validateSearchedUser: function(searchText, context, isExternal) {
      var dfd = $.Deferred();
      if (!searchText) {
        dfd.resolve();
      }
      if (isExternal) {
        if (this.validateExternalUser(searchText)) {
          dfd.resolve();
        } else {
          dfd.reject(_.str.sformat(lang.externalUserInvalid, searchText));
        }
      } else {
        this.getUserForSearchText(searchText, context).done(dfd.resolve).fail(dfd.reject);
      }
      return dfd.promise();
    },
    validateExternalUser: function(searchText) {
      return externalUserRegex.test(searchText);
    },
    getUserObject: function(userResponse) {
      return _.extend(_.pick(userResponse, "id", "links"), userResponse.properties);
    },
    fetchUserProfilePictureForVisibleOptions: function($fieldOptions, optionsItemsClass) {
      var $optionItemsEl = $fieldOptions.find("." + optionsItemsClass + ":not(.user-profile-image-fetched)");
      if ($optionItemsEl.length > 0) {
        $optionItemsEl.each(function(index, element) {
          var optionsBoundedRect = $fieldOptions[0].getBoundingClientRect(), itemsBoundedRect = element.getBoundingClientRect();
          if (itemsBoundedRect.height > 0 && optionsBoundedRect.top <= itemsBoundedRect.bottom && optionsBoundedRect.bottom >= itemsBoundedRect.top) {
            $(element).trigger("user:profile:picture:fetch");
          }
        });
      }
    },
    getUsersNGroups(context) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url, "collections/eligible-recipients-for-share");
      return this.getUserNGroupData(url, context);
    },
    getUserNGroupData(url, context) {
      var dfd = $.Deferred(), connector = context.getObject(ConnectorFactory);
      if (!url) {
        dfd.reject();
      }
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          let options = [];
          if (response && response.users_and_groups) {
            _.each(response.users_and_groups, function(userOrGroup) {
              options.push({
                value: userOrGroup.recipient_id,
                text: userOrGroup.recipient_name + (userOrGroup.recipient_email_address === "" || userOrGroup.recipient_email_address === undefined ? "" : "-" + userOrGroup.recipient_email_address)
              });
            });
          }
          dfd.resolve({
            options: options,
            userData: response.users_and_groups
          });
        },
        error: dfd.reject
      }));
      return dfd.promise();
    }
  };
});