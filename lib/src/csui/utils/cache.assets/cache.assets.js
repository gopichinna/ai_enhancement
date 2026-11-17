/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui-ext!csui/utils/cache.assets/cache.assets" ], function(_, extraCacheAssets) {
  let cacheAssetsList = [ {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/theme_unchecked.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/theme_checked.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/icon_theme_default.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/icon_theme_light.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/icon_theme_dark.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/light_favorites_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/dark_favorites_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/light_help_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/dark_help_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/light_search_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/dark_search_icon.svg"
  } ];
  if (extraCacheAssets) {
    extraCacheAssets = _.flatten(extraCacheAssets);
    cacheAssetsList.push(...extraCacheAssets);
  }
  return cacheAssetsList;
});