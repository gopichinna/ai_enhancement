/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import WidgetSettingsCollectionFactory from "csui/utils/contexts/factories/widget.settings.collection.factory";

import WidgetUtils from "d2/utils/widgets.utils";

import iviewerUtils from "d2/commands/open.plugins/impl/iviewer/utils";

import Session from "dctmw/utils/authenticators/session";

import ConnectorFactory from "nuc/contexts/factories/connector";

export default class ViewerMarkupCount {
  static enabled(options) {
    if (options.widgetType && options.widgetName) {
      const preferenceStorageId = WidgetUtils.getPreferenceStorageId(options.widgetType, options.widgetName), widgetSettingsCollection = Session.get().getContext().getCollection(WidgetSettingsCollectionFactory);
      return widgetSettingsCollection.length > 0 && widgetSettingsCollection.get(preferenceStorageId)?.get("showMarkupStatus") && options.ids.length > 0 || false;
    }
    return false;
  }
  static getData(options) {
    const deferred = $.Deferred(), connector = Session.get().getContext().getObject(ConnectorFactory), ids = options.ids;
    if (!this.enabled(options)) {
      deferred.resolve([]);
    } else {
      iviewerUtils.getMarkupCounts(connector, ids).done(function(result) {
        deferred.resolve({
          viewer_markup_count: result.markupCount
        });
      });
    }
    return deferred.promise();
  }
}