/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import CSUIBrandingConfigFactory from "csui/utils/contexts/factories/branding.config.factory";

import ModuleCollection from "dctmw/models/module.collection";

import Session from "dctmw/utils/authenticators/session";

import utils from "dctmw/utils/utils";

import lang from "i18n!dctmw/utils/nls/lang";

const config = {
  brandingSourcePackage: "dctmw",
  ...module.config()
};

const modules = new ModuleCollection(), brandingModuleData = modules.get(config.brandingSourcePackage);

function intializeBrandingModel() {
  const context = Session.get().getContext(), brandingConfig = context.getModel(CSUIBrandingConfigFactory, {
    brandingConfigModel: new Model({
      brandingSettingCodes: {
        primaryText: lang.ProductSuite,
        secondaryText: brandingModuleData.get("productName"),
        versionText: _.str.sformat(lang.ProductEdition, utils.normalizeSVVersion(brandingModuleData.get("version")))
      }
    })
  });
  context.brandingConfigData = brandingConfig;
  return brandingConfig;
}

let brandingConfigModel = null;

const BrandingUtils = {
  getBrandingConfigModel: function() {
    if (brandingConfigModel == null) {
      brandingConfigModel = intializeBrandingModel();
    }
    return brandingConfigModel;
  }
};

export default BrandingUtils;