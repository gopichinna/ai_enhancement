/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/utils/base", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "nuc/models/node/node.model", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/format.utils" ], function($, _, Backbone, Url, base, ConnectorFactory, CommandHelper, NodeModel, RestLinkrels, RestResources, utils, constants, formatUtils) {
  "use strict";
  return {
    getCorePermissionRoles: function(context) {
      function clone(collection) {
        return new Backbone.Collection(collection.map(function(model) {
          return model.clone();
        }));
      }
      var dfd = $.Deferred();
      if (RestResources.getCorePermissionRoles() && RestResources.getCorePermissionRoles().length > 0) {
        dfd.resolve(clone(RestResources.getCorePermissionRoles()));
      } else {
        this.fetchCorePermissionRoles(context).done(function(corePermissionRoles) {
          RestResources.setCorePermissionRoles(corePermissionRoles);
          dfd.resolve(clone(RestResources.getCorePermissionRoles()));
        }).fail(function(error) {
          dfd.reject(error);
        });
      }
      return dfd.promise();
    },
    fetchCorePermissionRoles: function(context) {
      var dfd = $.Deferred(), connector = context.getObject(ConnectorFactory), url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CORE_PERMISSION_ROLES);
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "GET",
        success: function(response) {
          if (response && response["permission_roles"] && response["permission_roles"].length > 0) {
            var corePermissionRoles = new Backbone.Collection(response["permission_roles"]);
            dfd.resolve(corePermissionRoles);
          } else {
            dfd.reject();
          }
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    fetchUsersFromCore: function(keyword, context) {
      var dfd = $.Deferred(), connector = context.getObject(ConnectorFactory);
      if (keyword.length === 0) {
        dfd.resolve([]);
      } else {
        var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CORE_USERS_SEARCH);
        var urlParams = {
          q: keyword
        };
        url = Url.appendQuery(url, Url.combineQueryString(urlParams));
        $.ajax(connector.extendAjaxOptions({
          url: url,
          type: "GET",
          success: function(response) {
            dfd.resolve(response["core_users_details"]);
          },
          error: function() {
            dfd.resolve([]);
          }
        }));
      }
      return dfd.promise();
    },
    fetchSharedObject: function(node, commandKey) {
      var dfd = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.D2_SHARE_TO_CORE);
      if (url) {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "GET",
          success: function(response) {
            dfd.resolve(response);
          },
          error: function(xhr) {
            dfd.reject(xhr);
          }
        }));
      } else {
        dfd.reject();
      }
      return dfd.promise();
    },
    fetchSharedObjectRecipients: function(node, commandKey) {
      var dfd = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.D2_SHARE_TO_CORE_RECIPIENTS);
      if (url) {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "GET",
          success: function(response) {
            dfd.resolve(response);
          },
          error: function(xhr) {
            dfd.reject(xhr);
          }
        }));
      } else {
        dfd.reject();
      }
      return dfd.promise();
    },
    fetchSharedObjectSettingForManage: function(node, context, commandKey) {
      var self = this, dfd = $.Deferred();
      self.getCorePermissionRoles(context).done(function(corePermissionRoles) {
        self.fetchSharedObject(node, commandKey).done(function(sharedObjectResponse) {
          self.fetchSharedObjectRecipients(node, commandKey).done(function(recipientsResponse) {
            if (recipientsResponse && recipientsResponse.recipients && recipientsResponse.recipients.length > 0) {
              _.each(recipientsResponse.recipients, function(item) {
                var id = item["email"], name;
                if (item["first_name"]) {
                  name = item["first_name"];
                  if (item["last_name"]) {
                    name = name + " " + item["last_name"];
                  }
                } else {
                  name = item["email"];
                }
                var model = new Backbone.Model({
                  id: id,
                  name: name,
                  data: item
                });
                var corePermissionRole = corePermissionRoles.findWhere({
                  name: item["role"]
                });
                if (corePermissionRole) {
                  if (!corePermissionRole.has("assignee")) {
                    corePermissionRole.set("assignee", new Backbone.Collection());
                  }
                  corePermissionRole.get("assignee").add(model);
                }
              });
            }
            var sharedObjectSettings = {
              sharedObject: new Backbone.Model(sharedObjectResponse),
              corePermissionRoles: corePermissionRoles
            };
            dfd.resolve(sharedObjectSettings);
          }).fail(function(error) {
            dfd.reject(error);
          });
        }).fail(function(error) {
          dfd.reject(error);
        });
      }).fail(function(error) {
        dfd.reject(error);
      });
      return dfd.promise();
    },
    performCheckout: function(node, commandKey) {
      var dfd = $.Deferred();
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.CHECKOUT),
        type: "PUT",
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    performCancelCheckout: function(node, commandKey) {
      var dfd = $.Deferred();
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.CANCEL_CHECKOUT),
        type: "DELETE",
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    createShare: function(node, shareMode, recipients, commandKey, options) {
      var self = this, dfd = $.Deferred();
      if (shareMode === constants.ShareIntentType.PUBLISH) {
        self.performCreateShare(node, shareMode, recipients, commandKey, options).done(function(response) {
          dfd.resolve(response);
        }).fail(function(xhr) {
          dfd.reject(xhr);
        });
      } else if (shareMode === constants.ShareIntentType.COLLABORATE) {
        self.performCheckout(node, commandKey).done(function() {
          self.performCreateShare(node, shareMode, recipients, commandKey, options).done(function(shareToCoreResponse) {
            dfd.resolve(shareToCoreResponse);
          }).fail(function(xhr) {
            self.performCancelCheckout(node, commandKey).always(function() {
              dfd.reject(xhr);
            });
          });
        }).fail(function(xhr) {
          dfd.reject(xhr);
        });
      }
      return dfd.promise();
    },
    performCreateShare: function(node, shareMode, recipients, commandKey, options) {
      var dfd = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.D2_SHARE_TO_CORE), data = {
        share_mode: shareMode,
        recipients: recipients
      };
      if (options && options.c2Override) {
        url = Url.appendQuery(url, Url.combineQueryString({
          c2_override: true
        }));
      }
      var headers = {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      };
      headers[constants.Headers.TIME_ZONE] = formatUtils.getBrowserTimeZone();
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: headers,
        data: JSON.stringify(data),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    modifyShare: function(node, shareMode, oldShareMode, recipients, commandKey) {
      var self = this, dfd = $.Deferred();
      if (shareMode === constants.ShareIntentType.PUBLISH) {
        self.performModifyShare(node, shareMode, oldShareMode, recipients, commandKey).done(function(response) {
          dfd.resolve(response);
        }).fail(function(xhr) {
          dfd.reject(xhr);
        });
      } else if (shareMode === constants.ShareIntentType.COLLABORATE) {
        if (shareMode === oldShareMode) {
          self.performModifyShare(node, shareMode, oldShareMode, recipients, commandKey).done(function(response) {
            dfd.resolve(response);
          }).fail(function(xhr) {
            dfd.reject(xhr);
          });
        } else {
          self.performCheckout(node, commandKey).done(function() {
            self.performModifyShare(node, shareMode, oldShareMode, recipients, commandKey).done(function(modifyShareResponse) {
              dfd.resolve(modifyShareResponse);
            }).fail(function(xhr) {
              self.performCancelCheckout(node, commandKey).always(function() {
                dfd.reject(xhr);
              });
            });
          }).fail(function(xhr) {
            dfd.reject(xhr);
          });
        }
      }
      return dfd.promise();
    },
    performModifyShare: function(node, shareMode, oldShareMode, recipients, commandKey) {
      var self = this, dfd = $.Deferred();
      if (shareMode === oldShareMode) {
        self.modifyRecipients(node, recipients, commandKey).done(function(modifyRecipientsResponse) {
          var response = {
            modifyRecipients: modifyRecipientsResponse
          };
          dfd.resolve(response);
        }).fail(function(error) {
          dfd.reject(error);
        });
      } else {
        self.modifyShareMode(node, shareMode, commandKey).done(function(modifyShareResponse) {
          self.modifyRecipients(node, recipients, commandKey).done(function(modifyRecipientsResponse) {
            var response = {
              modifyShareMode: modifyShareResponse,
              modifyRecipients: modifyRecipientsResponse
            };
            dfd.resolve(response);
          }).fail(function(error) {
            self.modifyShareMode(node, oldShareMode, commandKey).always(function() {
              dfd.reject(error);
            });
          });
        }).fail(function(error) {
          dfd.reject(error);
        });
      }
      return dfd.promise();
    },
    modifyShareMode: function(node, shareMode, commandKey) {
      var dfd = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.D2_SHARE_TO_CORE), data = {
        share_mode: shareMode
      };
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    modifyRecipients: function(node, recipients, commandKey) {
      var dfd = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, commandKey, RestLinkrels.D2_SHARE_TO_CORE_RECIPIENTS), data = {
        recipients: recipients
      };
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    }
  };
});