/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { Console } from '../utilities/logging-utilities.js';
import { isRTL } from '../utilities/common-utilities.js';

class RTLController {
  #host;

  #isRTL = false;

  #dirMutationObserver = new MutationObserver(this.#handleToolbarDirMutation.bind(this));

  constructor(host) {
    this.#host = host;
    this.#host.addController(this);
  }

  hostConnected() {
    // Save the initial text direction value.
    this.#isRTL = isRTL(this.#host);

    // Watch for changes in the text direction.
    this.#dirMutationObserver.observe(document, { attributes: true, attributeFilter: ['dir'], subtree: true });
  }

  hostDisconnected() {
    // Stop watching for changes in the text direction.
    this.#dirMutationObserver.disconnect();
  }

  #handleToolbarDirMutation(updateHost = true) {
    Console.log('rtlController: Text direction has changed: ', document.dir);
    // Save the new value of the text direction.
    this.#isRTL = isRTL(this.#host);

    if (updateHost) {
      // Trigger an update on the host to reflect the new text direction.
      this.#host.requestUpdate();
    }
  }

  get isRTL() {
    return this.#isRTL;
  }
}

export { RTLController };
//# sourceMappingURL=rtlController.js.map
