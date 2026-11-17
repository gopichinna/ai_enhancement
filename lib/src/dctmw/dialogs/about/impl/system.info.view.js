/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import template from "hbs!dctmw/dialogs/about/system.info.view";

import "css!dctmw/dialogs/about/system.info.view";

class SystemInfoView extends LayoutView {
  template = template;
  className() {
    return "system-info-view";
  }
  templateHelpers() {
    const data = this.options.data || {};
    return {
      ServerVersion: {
        label: data.ServerVersion?.label || "Server Version",
        value: data.ServerVersion?.value || "N/A"
      },
      JdkVersion: {
        label: data.JdkVersion?.label || "JDK Version",
        value: data.JdkVersion?.value || "N/A"
      },
      DfVersion: {
        label: data.DfVersion?.label || "DF Version",
        value: data.DfVersion?.value || "N/A"
      },
      DocumentumVersion: {
        label: data.DocumentumVersion?.label || "Documentum Version",
        value: data.DocumentumVersion?.value || "N/A"
      }
    };
  }
}

export default SystemInfoView;