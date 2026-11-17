/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import OpenAppScopeBehavior from "dctmw/controls/behaviors/open.app.scope.behavior";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

class AviatorConfigShortcutBehavior extends OpenAppScopeBehavior {
  constructor(options, view) {
    super(options, view);
    this.viewModel && this.viewModel.set({
      name: lang.titleHeader
    });
  }
}

Object.defineProperty(AviatorConfigShortcutBehavior.prototype.constructor, "name", {
  value: "AviatorConfigShortcutBehavior"
});

export default AviatorConfigShortcutBehavior;