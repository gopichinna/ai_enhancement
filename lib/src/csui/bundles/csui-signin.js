/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([

  'csui/pages/signin/signin.page.view',

  'csui/utils/authenticators/core.authenticators',
  'csui/utils/high.contrast/detector',

  'csui/utils/contexts/impl/csui.context.plugin'
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-signin', true);
});
