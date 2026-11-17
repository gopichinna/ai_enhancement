/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
require.config({
  paths: {
    d2: ".",
    nuc: "empty:",
    smart: "empty:",
    csui: "empty:",
    esoc: "empty:",
    dctmw: "empty:",
    aie: "empty:",
    css: "../lib/src/nuc/lib/css",
    "csui-ext": "../lib/src/nuc/utils/load-extensions/load-extensions",
    hbs: "../lib/src/nuc/lib/hbs",
    i18n: "../lib/src/nuc/lib/i18n",
    json: "../lib/src/nuc/lib/json",
    less: "../lib/src/nuc/lib/less",
    txt: "../lib/src/nuc/lib/text",
    "nuc/lib/css-buffers": "../lib/src/nuc/lib/css-buffers",
    "nuc/lib/css-builder": "../lib/src/nuc/lib/css-builder",
    "nuc/lib/handlebars": "../lib/src/nuc/lib/handlebars",
    "nuc/lib/handlebars3": "../lib/src/nuc/lib/handlebars3",
    "nuc/lib/i18nprecompile": "../lib/src/nuc/lib/i18nprecompile",
    "nuc/lib/less-builder": "../lib/src/nuc/lib/less-builder",
    "nuc/lib/lessc": "../lib/src/nuc/lib/lessc",
    "nuc/lib/normalize": "../lib/src/nuc/lib/normalize",
    "nuc/lib/source-map": "../lib/src/nuc/lib/source-map",
    "nuc/lib/underscore": "../lib/src/nuc/lib/underscore",
    "csui/utils/high.contrast/detector": "../lib/src/csui/utils/high.contrast/detector",
    "dctm-ext": "../lib/src/dctmw/utils/load-extensions/load-extensions"
  },
  map: {
    "*": {
      "d2/utils/sort.utils": "dctmw/utils/sort.utils",
      "nuc/utils/base": "csui/utils/base",
      "csui/utils/contexts/context": "nuc/contexts/context",
      "csui/utils/contexts/context.plugin": "nuc/contexts/context.plugin",
      "csui/utils/contexts/factories/connector": "nuc/contexts/factories/connector",
      "csui/utils/contexts/factories/factory": "nuc/contexts/factories/factory",
      "csui/utils/contexts/fragment/context.fragment": "nuc/contexts/fragment/context.fragment",
      "csui/utils/contexts/mixins/clone.and.fetch.mixin": "nuc/contexts/mixins/clone.and.fetch.mixin",
      "csui/utils/contexts/page/page.context": "nuc/contexts/page/page.context",
      "csui/utils/contexts/synchronized.context": "nuc/contexts/synchronized.context",
      "nuc/utils/promoted.actionitems": "nuc/utils/promoted.actionitems"
    }
  },
  hbs: {
    disableI18n: true,
    disableHelpers: true,
    templateExtension: "hbs"
  },
  less: {
    sourceMap: {
      sourceMapFileInline: true
    }
  },
  prefix: "d2"
});