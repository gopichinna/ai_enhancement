/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/lib/binf/js/binf',
  'csui/lib/binf/js/binf-switch',
  'csui/lib/fastclick',
  'csui/lib/hammer',
  'csui/lib/jquery.redraw',
  'csui/lib/jquery.renametag',
  'csui/lib/jquery.scrollbarwidth',
  'csui/lib/jquery.touchSwipe',
  'csui/lib/jquery.ui/js/jquery-ui',
  'csui/lib/perfect-scrollbar',
  'csui/lib/exif'
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-libraries', true);
});
