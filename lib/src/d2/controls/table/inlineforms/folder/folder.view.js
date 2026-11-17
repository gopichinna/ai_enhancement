/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/utils/url", "csui/controls/table/inlineforms/base/inline.edit.view", "csui/controls/table/inlineforms/inlineform.registry", "d2/widgets/metadata/utils/form.converter", "d2/controls/table/inlineforms/folder/folder.view.mixin", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils" ], function($, Url, InlineEditView, inlineFormViewRegistry, MetadataConverter, FolderViewMixin, RestLinkrels, constants, utils) {
  "use strict";
  var InlineFormD2FolderView = InlineEditView.extend({
    saveClicked: function(event) {
      var dfd = $.Deferred();
      event.preventDefault();
      event.stopPropagation();
      this._performAction(true, false).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    },
    metadataIconClicked: function(event) {
      var dfd = $.Deferred();
      event.preventDefault();
      event.stopPropagation();
      this._performAction(false).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    },
    _fetchPropertyPageData: function(node, folderType, opts) {
      var deferred = $.Deferred(), url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_FOLDER_CREATION_PROPERTY_PAGE);
      url = Url.appendQuery(url, Url.combineQueryString({
        type: folderType
      }));
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var data = MetadataConverter.convertConfig(response["page-content"], {
            actionMode: "create"
          });
          if (opts.resolveWithCachedData) {
            deferred.resolve({
              propertyPageData: data,
              cachedData: {
                "page-content": response["page-content"],
                options: {
                  actionMode: "create"
                }
              }
            });
          } else {
            deferred.resolve(data);
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          deferred.reject(utils.parseAjaxError(xhr, textStatus, errorThrown));
        }
      }));
      return deferred.promise();
    }
  });
  FolderViewMixin.mixin(InlineFormD2FolderView.prototype);
  inlineFormViewRegistry.registerByAddableType(constants.Types.FOLDER, InlineFormD2FolderView);
  return InlineFormD2FolderView;
});