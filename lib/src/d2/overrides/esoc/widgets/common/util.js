/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/contexts/factories/user", "csui/utils/contexts/factories/connector", "esoc/controls/userwidget/userwidget.view" ], function(require, $, _, UserModelFactory, ConnectorFactory) {
  "use strict";
  require([ "esoc/widgets/userwidget/util", "esoc/widgets/common/util", "d2/utils/user.utils" ], function(UserwidgetUtil, CommonUtil, userUtils) {
    _.extend(CommonUtil, {
      getUserPhotoURL: function(options) {
        var dfd = $.Deferred();
        if (options.userModel && options.userModel.has("photo_url")) {
          dfd.resolve(options.userModel.get("photo_url"));
        } else {
          var photoUrl = userUtils.getUserPhotoUrl(options.userid);
          if (photoUrl) {
            dfd.resolve(userUtils.getUserPhotoUrl(options.userid));
          } else {
            dfd.reject();
          }
        }
        return dfd;
      },
      setProfilePic: function(options) {
        var context = options.context, connector = options.context.getObject(ConnectorFactory), connObj = connector.connection, userFactories = context && context.getFactory(UserModelFactory), userid = options.userid, dfd = this.getUserPhotoURL({
          context: options.context,
          noCache: options.noCache,
          connectionURL: connObj.url,
          userid: options.userid,
          userModel: options.userModel
        });
        dfd.promise().done(function(url) {
          var photoElement = options.photoElement && options.photoElement.length > 0 ? options.photoElement : $('[class*="esoc-userprofile-img-' + UserwidgetUtil.escapeSelector(options.userid) + '"]'), defaultPhotoElement = options.defaultPhotElement && options.defaultPhotElement.length > 0 ? options.defaultPhotElement : $('[class*="esoc-user-default-avatar-' + UserwidgetUtil.escapeSelector(options.userid) + '"]');
          photoElement.addClass("binf-hidden");
          defaultPhotoElement.addClass("esoc-user-show-profilepic");
          defaultPhotoElement.removeClass("binf-hidden");
          defaultPhotoElement.css("display", "inline-flex");
          if (url) {
            var _checkPhotoBlobContentInLocal = function() {
              var dfd = $.Deferred(), userFactoriesId = userFactories && userFactories.options[userid], photoBlobContent = userFactories && userFactories.options[userid + "_blob_content"];
              if (userFactoriesId && photoBlobContent) {
                $.ajax({
                  url: photoBlobContent,
                  success: function(response, responseText, xhr) {
                    var contentSize = xhr.getResponseHeader("Content-Length");
                    if (!isNaN(contentSize) && Number(contentSize) > 0) {
                      dfd.resolve(photoBlobContent);
                    } else {
                      dfd.resolve();
                    }
                  },
                  error: function() {
                    dfd.resolve();
                  }
                });
              } else {
                dfd.resolve();
              }
              return dfd.promise();
            };
            var _resolvePhoto = function(photoUrl, photoBlobContent) {
              var dfdPhoto = $.Deferred(), userFactoriesId = userFactories && userFactories.options[userid];
              if (photoBlobContent) {
                dfdPhoto.resolve(photoBlobContent, photoElement, defaultPhotoElement);
              } else if (!userFactoriesId || !userFactoriesId.length) {
                userFactories.options[userid] = [];
                userFactories.options[userid].push(function(photo) {
                  if (photo) {
                    dfdPhoto.resolve(photo, photoElement, defaultPhotoElement);
                  } else {
                    dfdPhoto.reject(photoElement, defaultPhotoElement);
                  }
                });
                connector.makeAjaxCall({
                  url: photoUrl,
                  dataType: "binary",
                  connection: connObj
                }).done(function(response) {
                  var userIdBlobContent = URL.createObjectURL(response);
                  userFactories.options[userid + "_blob_content"] = userIdBlobContent;
                  _.each(userFactories.options[userid], function(photoCallback) {
                    photoCallback(userIdBlobContent);
                  });
                  userFactories.options[userid] = [];
                }).fail(function() {
                  _.each(userFactories.options[userid], function(photoCallback) {
                    photoCallback();
                  });
                });
              } else if (!userFactories.options[userid + "_blob_content"]) {
                userFactories.options[userid].push(function(photo) {
                  if (photo) {
                    dfdPhoto.resolve(photo, photoElement, defaultPhotoElement);
                  } else {
                    dfdPhoto.reject(photoElement, defaultPhotoElement);
                  }
                });
              } else {
                dfdPhoto.resolve(userFactories.options[userid + "_blob_content"], photoElement, defaultPhotoElement);
              }
              return dfdPhoto.promise();
            };
            _checkPhotoBlobContentInLocal().always(function(userBlobContent) {
              _resolvePhoto(url, userBlobContent).done(function(photoBlob, photoElement, defaultPhotoElement) {
                defaultPhotoElement.addClass("binf-hidden");
                photoElement.removeClass("binf-hidden");
                photoElement.attr("src", photoBlob);
                photoElement.css("display", "inline-flex");
                if (options.viewShownEvent) {
                  options.parentView && options.parentView.trigger("view:shown");
                }
              }).fail(function() {
                photoElement.addClass("binf-hidden");
                defaultPhotoElement.addClass("esoc-user-show-profilepic");
                defaultPhotoElement.removeClass("binf-hidden");
                defaultPhotoElement.css("display", "inline-flex");
                if (options.viewShownEvent) {
                  options.parentView && options.parentView.trigger("view:shown");
                }
              });
            });
          } else {
            photoElement.addClass("binf-hidden");
            defaultPhotoElement.addClass("esoc-user-show-profilepic");
            defaultPhotoElement.removeClass("binf-hidden");
            defaultPhotoElement.css("display", "inline-flex");
            if (options.viewShownEvent) {
              options.parentView && options.parentView.trigger("view:shown");
            }
          }
        });
      }
    });
  });
});