/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([

  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/behaviors/item.state/item.state.behavior',
  'csui/behaviors/item.state/item.state.view',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/resizable/resizable.behavior',

  'csui/controls/tile/behaviors/expanding.behavior',
  'csui/controls/tile/tile.view',
  'csui/controls/iconpreload/icon.preload.view',
  'csui/controls/rich.text.editor/rich.text.editor',
  'csui/controls/selected.count/selected.count.view',
  'csui/controls/selected.count/selected.count.control.view',





  'csui/lib/jquery.simulate',
  'csui/lib/othelp',


  'csui/utils/froala/bootstrap',

  'csui/pages/start/start.page.view',
  'csui/pages/start/pendo.dialog.view',

  'csui/widgets/navigation.header/controls/help/help.view',
  'csui/widgets/navigation.header/controls/home/home.view',
  'csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view',
  'csui/widgets/navigation.header/controls/search/search.view',
  'csui/widgets/navigation.header/controls/favorites/favorites.view',
  'csui/widgets/navigation.header/controls/user.profile/user.profile.view',
  'csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',
  'csui/widgets/navigation.header/navigation.header.controls',

  "csui/controls/app.header/app.header.controls/logo/logo.view",
  "csui/controls/app.header/app.header.controls/search.box/search.box.view",
  "csui/controls/app.header/app.header.controls/progresspanel/progressbar.maximize.view",
  "csui/controls/app.header/app.header.controls/favorites/favorites.view",
  "csui/controls/app.header/app.header.controls/help/help.view",
  "csui/controls/app.header/app.header.controls/user.profile/user.profile.view",
  "csui/controls/app.header/app.header.controls/csui.app.header.controls",
  "csui/controls/app.header/burger.menu/burger.menu",


  'csui/utils/proxysettings/proxy.dynamic.menu',
  "csui/utils/usersettings/cm.dynamic.menu",

    'csui/perspective.manage/sidebar/pman.sidebar.container.view',
    'csui/perspective.manage/sidebar/layouts',
    'csui/perspective.manage/sidebar/widgets',


  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/tabletoolbar/impl/nls/localized.strings',


  'json!csui/utils/contexts/perspective/impl/perspectives/error.global.json',

  'csui/widgets/error.global/error.global.view',
  'csui/widgets/favorites/favorites.view',
  'csui/widgets/favorites/tileview.toolbaritems',
  'csui/widgets/navigation.header/profile.menuitems',
  'csui/widgets/navigation.header/profile.menuitems.mask',
  'csui/widgets/placeholder/placeholder.view',
  'csui/widgets/recentlyaccessed/recentlyaccessed.columns',
  'csui/widgets/recentlyaccessed/recentlyaccessed.view',
  'csui/widgets/recentlyaccessed/tileview.toolbaritems',
  'csui/widgets/search.box/search.box.view',
  'csui/widgets/shortcut/shortcut.view',
  'csui/widgets/shortcuts/shortcuts.view',
  'csui/widgets/welcome.placeholder/welcome.placeholder.view',

  'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',
  'csui/widgets/html.editor/html.editor.view',
  'csui/widgets/document.overview/document.overview.view',
  'csui/widgets/version.overview/version.overview.view',

  'json!csui/widgets/error.global/error.global.manifest.json',
  'json!csui/widgets/favorites/favorites.manifest.json',
  'json!csui/widgets/placeholder/placeholder.manifest.json',
  'json!csui/widgets/recentlyaccessed/recentlyaccessed.manifest.json',
  'json!csui/widgets/shortcut/shortcut.manifest.json',
  'json!csui/widgets/shortcuts/shortcuts.manifest.json',
  'json!csui/widgets/welcome.placeholder/welcome.placeholder.manifest.json',
  'json!csui/widgets/recycle.items.table/recycle.items.table.manifest.json',
  'json!csui/widgets/html.editor/html.editor.manifest.json',
  'json!csui/widgets/document.overview/document.overview.manifest.json',

  'i18n!csui/widgets/favorites/impl/nls/favorites.manifest',
  'i18n!csui/widgets/placeholder/impl/nls/placeholder.manifest',
  'i18n!csui/widgets/recentlyaccessed/impl/nls/recentlyaccessed.manifest',
  'i18n!csui/widgets/shortcut/impl/nls/shortcut.manifest',
  'i18n!csui/widgets/shortcuts/impl/nls/shortcuts.manifest',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/welcome.placeholder.manifest',
  'i18n!csui/widgets/recycle.items.table/impl/nls/recycle.items.table.manifest',
  'i18n!csui/widgets/html.editor/impl/nls/html.editor.manifest',
  'i18n!csui/widgets/document.overview/impl/nls/document.overview.manifest',

  'i18n!csui/widgets/favorites/impl/nls/lang',

  'i18n!csui/widgets/recentlyaccessed/impl/nls/lang',

  'i18n!csui/widgets/search.forms/impl/nls/lang',
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-app', true);
});
