/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import lang from "i18n!dctmw/dialogs/about/impl/nls/lang";

import template from "hbs!dctmw/dialogs/about/about.info.view";

import "css!dctmw/dialogs/about/about.info.view";

class AboutInfoView extends LayoutView {
  template = template;
  className() {
    return "about-info-view";
  }
  templateHelpers() {
    return {
      copyrightText: lang.copyrightText,
      patentsInfo: lang.patentsInfo,
      disclaimer: lang.disclaimer,
      disclaimerTitle: lang.disclaimerTitle,
      warning: lang.warning,
      warningTitle: lang.warningTitle,
      website: lang.website
    };
  }
}

export default AboutInfoView;