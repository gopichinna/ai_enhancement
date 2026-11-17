/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import template from "hbs!dctmw/dialogs/about/client.info.view";

import "css!dctmw/dialogs/about/client.info.view";

class ClientInfoView extends LayoutView {
  template = template;
  className() {
    return "client-info-view";
  }
  templateHelpers() {
    const data = this.options.data || {};
    return {
      D2ArchiveConfigVersion: {
        label: data.D2ArchiveConfigVersion?.label || "D2 Archive Config Version",
        value: data.D2ArchiveConfigVersion?.value || "Not Available"
      },
      D2DocAppVersion: {
        label: data.D2DocAppVersion?.label || "D2 Document App Version",
        value: data.D2DocAppVersion?.value || "N/A"
      },
      D2ApiServerVersion: {
        label: data.D2ApiServerVersion?.label || "D2 API Server Version",
        value: data.D2ApiServerVersion?.value || "N/A"
      },
      D2fsVersion: {
        label: data.D2fsVersion?.label || "D2 FS Version",
        value: data.D2fsVersion?.value || "N/A"
      },
      D2fs4DctmVersion: {
        label: data.D2fs4DctmVersion?.label || "D2 FS for DCTM Version",
        value: data.D2fs4DctmVersion?.value || "N/A"
      },
      D2ApiVersion: {
        label: data.D2ApiVersion?.label || "D2 API Version",
        value: data.D2ApiVersion?.value || "N/A"
      },
      D2Plugin: {
        label: data.D2Plugin?.label || "D2 Plugin",
        value: data.D2Plugin?.value || "N/A"
      }
    };
  }
}

export default ClientInfoView;