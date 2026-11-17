/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/controls/rich.text.editor/impl/rich.text.util", "css!csui/widgets/html.editor/impl/html.editor" ], function($, _, Backbone, RichTextEditorUtils) {
  "use strict";
  var getRichTextEditorUtils = function getRichTextEditorUtils() {
    return RichTextEditorUtils;
  };
  var isEmptyContent = function(content) {
    return !!content && content.html.get().trim().replace(/<\/div>|<div>|<\/p>|<p>|&nbsp;|<br \/>|\s/g, "");
  };
  return {
    getRichTextEditorUtils: getRichTextEditorUtils,
    isEmptyContent: isEmptyContent
  };
});