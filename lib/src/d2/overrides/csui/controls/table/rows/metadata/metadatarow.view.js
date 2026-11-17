/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import MetadataRowView from "csui/controls/table/rows/metadata/metadatarow.view";

const origOnRender = MetadataRowView.prototype.onRender;

MetadataRowView.prototype.onRender = function() {
  var contentViews = this._contentViews || [];
  _.each(contentViews, function(contentView) {
    contentView.regionElementId = contentView.regionElementId ? contentView.regionElementId.replaceAll("\\.", ".").replaceAll(".", "\\.") : contentView.regionElementId;
  });
  origOnRender.apply(this, arguments);
};