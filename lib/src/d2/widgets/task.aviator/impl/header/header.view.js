/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  View
} from "nuc/lib/marionette3";

import {
  sformat
} from "nuc/lib/underscore.string";

import {
  getPluralMessageForCardinal
} from "d2/widgets/task.aviator/aie/utils/plurals/plurals";

import template from "hbs!d2/widgets/task.aviator/impl/header/header";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import sphere from "txt!d2/widgets/task.aviator/aie/icons/mime_aviator32.svg";

import "css!d2/widgets/task.aviator/impl/header/header";

import "d2/widgets/task.aviator/aie/icons/icons_aie_action";

import "smart/themes/carbonfiber/ot-icons/icons_smart_action";

import "smart/utils/otwc.loader";

class HeaderView extends View {
  templateContext() {
    return {
      sphere: sphere,
      subtitle: this.#getSubtitle(),
      lang: lang
    };
  }
  onRender() {
    this.el.children[0].setAttribute("aria-hidden", "true");
  }
  focus() {
    this.#firstElement().focus();
  }
  firstFocused() {
    return this.#firstElement() === document.activeElement;
  }
  #firstElement() {
    return this.ui.close[0];
  }
  #getSubtitle() {
    const {
      nodes
    } = this.options;
    if (nodes.length === 1) {
      return nodes[0].get("name");
    }
    const suffix = nodes[0]?.get("type") === 848 ? "Workspace" : "Document";
    const format = getPluralMessageForCardinal(lang, `chatSubtitle${suffix}`, nodes.length);
    return sformat(format, nodes.length);
  }
  onClose() {
    this.triggerMethod("close:panel");
  }
}

Object.assign(HeaderView.prototype, {
  className: "aie-chat-header",
  template: template,
  ui: {
    close: ".aie-close"
  },
  triggers: {
    "click @ui.close": "close"
  },
  events: {
    close: "onClose"
  }
});

Object.defineProperty(HeaderView.prototype.constructor, "name", {
  value: "HeaderView"
});

export default HeaderView;