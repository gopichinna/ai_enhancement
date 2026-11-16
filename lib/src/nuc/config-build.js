/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
require.config({
  "paths": {
    "nuc": ".",
    "css": "../lib/src/nuc/lib/css",
    "csui-ext": "../lib/src/nuc/utils/load-extensions/load-extensions",
    "hbs": "../lib/src/nuc/lib/hbs",
    "i18n": "../lib/src/nuc/lib/i18n",
    "json": "../lib/src/nuc/lib/json",
    "less": "../lib/src/nuc/lib/less",
    "txt": "../lib/src/nuc/lib/text"
  },
  "hbs": {
    "disableI18n": true,
    "disableHelpers": true,
    "templateExtension": "hbs"
  },
  "less": {
    "sourceMap": {
      "sourceMapFileInline": true
    }
  }
});