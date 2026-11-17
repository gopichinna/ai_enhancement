/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import _ from "nuc/lib/underscore";

import theming from "smart/themes/theming";

import BrandingUtil from "dctmw/utils/dctmw.branding.util";

import DctmActionIcons from "dctmw/utils/icons/dctmw.jato.action.icons";

import DctmBrandingIcons from "dctmw/utils/icons/dctmw.jato.branding";

import template from "hbs!dctmw/dialogs/about/impl/header/header";

import cfTemplate from "hbs!dctmw/dialogs/about/impl/header/header.cf";

import lang from "i18n!dctmw/dialogs/about/impl/nls/lang";

import "css!dctmw/dialogs/about/impl/header/header";

class AboutDialogHeaderView extends LayoutView {
  template = theming.isJATOTheme() ? template : cfTemplate;
  className() {
    return `dctmw-about-dialog-header`;
  }
  templateHelpers() {
    const brandingModel = BrandingUtil.getBrandingConfigModel().get("brandingSettingCodes");
    return {
      isJato: theming.isJATOTheme(),
      logoSvg: DctmBrandingIcons.brandingOtLockup,
      productSuite: brandingModel.primaryText,
      productName: brandingModel.secondaryText,
      versionText: brandingModel.versionText,
      closeTooltip: lang.DialogCloseBtn,
      version: _.str.sformat(lang.Version, this.options.data["VersionInfo"].value),
      actionCloseSVG: DctmActionIcons.actionCloseSmall
    };
  }
  constructor(options = {}) {
    super(options);
  }
}

Object.defineProperty(AboutDialogHeaderView.prototype.constructor, "name", {
  value: "AboutDialogHeaderView"
});

export default AboutDialogHeaderView;