/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
class TabIndexController {
  #host;

  constructor(host) {
    this.#host = host;
    this.#host.addController(this);
  }

  hostUpdate() {
    if (!this.#host.hasAttribute('tabindex')) {
      this.#host.setAttribute('tabindex', 0);
    }
  }
}

export { TabIndexController };
//# sourceMappingURL=tabindexController.js.map
