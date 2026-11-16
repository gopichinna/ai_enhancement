/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/pagination/nodespagination.view", "i18n!d2/overrides/csui/widgets/navigation.header/controls/pagination/impl/nls/lang", "css!d2/overrides/csui/widgets/navigation.header/controls/pagination/impl/nodespagination" ], function(_, $, NodesPaginationView, lang1) {
  "use strict";
  var prototype = NodesPaginationView.prototype;
  var origRender = prototype.render;
  var origreCalculatePageSize = prototype._reCalculatePageSize;
  prototype.render = function() {
    origRender.apply(this, arguments);
    this.skipPaginationUpdateRequest = true;
    if (this.collection.hasMoreRecords === true) {
      if (!this.collection.totalFromServer && this.collection.serverTotalCountUrl) {
        var loaderEl = ' <div class="dots-loader">' + '<span class="csui-loading-dots-wrapper">' + '<span class="csui-loading-dot"></span>' + '<span class="csui-loading-dot"></span>' + '<span class="csui-loading-dot"></span>' + "</span>" + "</div>";
        this.ui.totalCount.after(loaderEl);
      } else {
        var title, addnlStyle = "";
        if (this.collection.totalFromServer === -1) {
          title = lang1.totalItemErrorNotification;
          addnlStyle = "error";
        } else {
          title = _.str.sformat(lang1.totalItemNotification, this.collection.totalCount, this.collection.totalFromServer);
        }
        var div = '<div role="button" class="d2-total-notification-icon" aria-label="' + title + '" title="' + title + '"><span class="icon d2-totalItem-icon-notification ' + addnlStyle + '"></span> </div>';
        this.ui.totalCount.after(div);
      }
    }
  };
  prototype._reCalculatePageSize = function() {
    origreCalculatePageSize.apply(this, arguments);
    if (this.pageSize <= this._getTotalCount()) {
      this.collection.setLimit(this.collection.skipCount, this.selectedPageSize);
    }
  };
});