/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import MenuItemsView from "csui/controls/otc.menu/menu.items.view";

import ClientLocationUtils from "dctmw/utils/client.location";

import JatoActionIcons from "dctmw/utils/icons/dctmw.jato.action.icons";

import languageCollection from "dctmw/utils/sv.languages";

import lang from "i18n!dctmw/controls/signin.jato/impl/nls/lang";

import template from "hbs!dctmw/controls/signin.jato/impl/footer/impl/footer.template";

import "css!dctmw/controls/signin.jato/impl/footer/impl/footer";

class SigninFooterView extends LayoutView {
  template = template;
  className() {
    return `footer-frame`;
  }
  regions() {
    return {
      rgnLangDropdown: ".dctm-sigin-lang-dropdown"
    };
  }
  ui() {
    return {
      langBtn: "#dctm-signin-lang-btn",
      langMenu: "#signin-lang-menu",
      langLabel: ".lang-label"
    };
  }
  templateHelpers() {
    return {
      syncSVG: JatoActionIcons.actionSync,
      copyrightMessage: lang.copyrightMessage,
      privacyPolicy: lang.privacyPolicy,
      helpAndSupport: lang.helpAndSupport,
      langPreference: this.#getLocaleName()
    };
  }
  constructor(options = {}) {
    super(options);
  }
  onRender() {
    this.currLangCode = this.#getCurrentLocale();
    this.#showLangMenu();
  }
  onAttach() {
    const langCode = this.#getCurrentLocale();
    if (this.currLangCode !== langCode) {
      this.currLangCode = langCode;
      this.ui.langLabel.text(this.#getLocaleName());
      this.#showLangMenu();
    }
  }
  #showLangMenu() {
    const langCollection = new Collection(languageCollection.map(model => ({
      id: model.get("id"),
      displayName: model.get("name"),
      name: model.get("name"),
      checked: model.get("id") === this.currLangCode
    })));
    this.langMenuBtn = new MenuItemsView({
      collection: langCollection,
      childElm: "otc-menuradio"
    });
    this.rgnLangDropdown.show(this.langMenuBtn);
    this.listenTo(this.langMenuBtn, "change:selection", ({
      itemValue
    }) => {
      this.#syncLocaleInUrl(itemValue);
    });
  }
  #getLocaleName() {
    const id = this.#getCurrentLocale();
    return (languageCollection.find(locale => locale.get("id") === id) || languageCollection.at(0)).get("name");
  }
  #getCurrentLocale() {
    return window.sv.getPreloadData().langCode || "";
  }
  #syncLocaleInUrl(itemValue) {
    const url = new URL(window.location.href);
    url.searchParams.set("preferred-locale", itemValue.get("id"));
    window.history.replaceState(window.history.state, "", url.toString());
    ClientLocationUtils.reload();
  }
}

export default SigninFooterView;