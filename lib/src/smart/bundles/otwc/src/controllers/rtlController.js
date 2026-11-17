/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
class RTLController {
  #host;

  #isRTL = false;

  #dirMutationObserver = new MutationObserver(this.#handleDirMutation.bind(this));

  constructor(host) {
    this.#host = host;
    this.#host.addController(this);
  }

  hostConnected() {
    // Save the initial text direction value.
    this.#isRTL = (getComputedStyle(this.#host).direction === 'rtl');

    // Watch for changes in the text direction.
    this.#dirMutationObserver.observe(document, { attributes: true, attributeFilter: ['dir'], subtree: true });
  }

  hostDisconnected() {
    // Stop watching for changes in the text direction.
    this.#dirMutationObserver.disconnect();
  }

  #handleDirMutation(updateHost = true) {
    // Save the new value of the text direction.
    this.#isRTL = (getComputedStyle(this.#host).direction === 'rtl');

    if (updateHost) {
      // Trigger an update on the host to reflect the new text direction.
      this.#host.requestUpdate('#isRTL', !this.#isRTL);
    }
  }

  get isRTL() {
    return this.#isRTL;
  }
}

export { RTLController };
//# sourceMappingURL=rtlController.js.map
