/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import i18n from "i18n";

import lang from "i18n!dctmw/utils/nls/lang.names";

class SVLanguages extends Collection {
  constructor() {
    let models = i18n.settings.loadableLocales.map(langKey => {
      if (langKey === "root") {
        langKey = "en";
      }
      return {
        id: langKey,
        name: lang[langKey]
      };
    });
    models = _.sortBy(models, "name");
    models = [ {
      id: "",
      name: lang.browserDefault
    }, ...models ];
    super(models, {});
  }
}

Object.defineProperty(SVLanguages.prototype.constructor, "name", {
  value: "SVLanguages"
});

const svLanguages = new SVLanguages();

[ "add", "remove", "reset", "set", "fetch", "save", "sync" ].forEach(mName => {
  svLanguages[mName] = _.noop();
});

export default svLanguages;