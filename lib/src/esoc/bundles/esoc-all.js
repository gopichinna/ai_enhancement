/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */




define([

  'esoc/controls/userwidget/userwidget.view',
  'esoc/widgets/utils/commentdialog/commentdialog',
  'esoc/widgets/utils/commentdialog/commentdialog.view',

  'esoc/widgets/utils/command/comment/comment.toolitem.view',

  "esoc/commands/comment/comment.command",
  "esoc/commands/open.roi",

  "esoc/widgets/utils/esocactionitems",

  "esoc/widgets/utils/esocnodesprites",

  "esoc/controls/icons/esoc.icons.v2",

  'esoc/widgets/socialactions/socialactions.main',
  'esoc/widgets/activityfeedwidget/activityfeedwidget.view',
  'esoc/widgets/activityfeedwidget/activityfeedfactory',
  'esoc/widgets/activityfeedwidget/activityfeedcontent',
  'esoc/widgets/tablecell/tablecell.view',
  'esoc/widgets/tablecell/thumbnail.content.view',
  'esoc/widgets/userwidget/userwidget',
  'esoc/widgets/userwidget/view/userprofile.view',
  'esoc/widgets/userwidget/view/miniprofile.view',
  'esoc/widgets/userwidget/view/simple.userwidget.view',
  "esoc/widgets/userwidget/view/profile",

  'json!esoc/widgets/activityfeedwidget/activityfeedwidget.manifest.json',
  'i18n!esoc/widgets/activityfeedwidget/impl/nls/activityfeedwidget.manifest'

], {});

require(['require', 'css'], function (require, css) {

  css.styleLoad(require, 'esoc/bundles/esoc-all', true);

});
