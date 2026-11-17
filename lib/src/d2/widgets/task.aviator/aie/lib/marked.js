/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/task.aviator/aie/lib/marked/marked-core", "d2/widgets/task.aviator/aie/lib/marked/marked-highlight", "d2/widgets/task.aviator/aie/lib/highlight", "d2/widgets/task.aviator/aie/lib/marked/marked-smartypants", "d2/widgets/task.aviator/aie/lib/marked/marked-linkify-it", "d2/widgets/task.aviator/aie/lib/dompurify" ], function(marked, highlight, hljs, smartypants, linkify, dompurify) {
  "use strict";
  marked.use(smartypants());
  marked.use(linkify());
  marked.use(highlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, {
          language: language
        }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  }));
  marked.use({
    headerIds: false,
    mangle: false,
    breaks: false,
    gfm: true
  });
  marked.parseSafe = function parseSafe(md, options) {
    const html = marked.parse(md, options);
    return dompurify.sanitize(html);
  };
  marked.parseSafeInline = function parseSafeInline(md, options) {
    const html = marked.parseInline(md, options);
    return dompurify.sanitize(html);
  };
  return marked;
});