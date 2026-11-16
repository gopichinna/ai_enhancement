define([
  'i18n!<%= namespace %>/extensions/nls/lang',
  '<%= namespace %>/utils/constants'
], function (lang, constants) {
  'use strict';

  return [
    {
      decides: function (node) {
        return node.get('type') === constants.ObjectTypes.GROUP;
      },
      className: 'csui-icon d2-icon-type-group-user',
      mimeType: lang.mimeTypeGroupLabel,
      sequence: 20
    },
    {
      decides: function (node) {
        return node.get('type') === constants.ObjectTypes.USER;
      },
      className: 'csui-icon d2-icon-type-single-user',
      mimeType: lang.mimeTypeUserLabel,
      sequence: 20
    }
  ];
});