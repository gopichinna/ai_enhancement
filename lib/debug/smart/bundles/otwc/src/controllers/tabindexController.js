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
