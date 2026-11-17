/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  ItemView
} from "nuc/lib/marionette";

import jatoIcons from "smart/themes/jato.icons/smart.jato.status.icons";

import theming from "smart/themes/theming";

import template from "hbs!dctmw/controls/slim.status.message/impl/slim.status.message";

import "css!dctmw/controls/slim.status.message/impl/slim.status.message";

class SlimStatusMessageView extends ItemView {
  template = template;
  className() {
    return "dctmw-slim-status-message " + (this.options.type || "");
  }
  constructor(options) {
    super(options);
  }
  templateHelpers() {
    let iconSVG;
    switch (this.options.type) {
     case "info":
      iconSVG = jatoIcons.statusInfoSmall;
      break;

     case "error":
      iconSVG = jatoIcons.statusErrorSmall;
      break;

     case "warning":
      iconSVG = jatoIcons.statusWarningSmall;
      break;

     default:
      iconSVG = this.options.iconSVG;
    }
    return {
      isJATO: theming.isJATOTheme(),
      iconSVG: iconSVG,
      message: this.options.message
    };
  }
}

Object.defineProperty(SlimStatusMessageView.prototype.constructor, "name", {
  value: "SlimStatusMessageView"
});

export default SlimStatusMessageView;