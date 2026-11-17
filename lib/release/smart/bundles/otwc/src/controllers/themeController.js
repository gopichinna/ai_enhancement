class ThemeController {
  #host;

  #themeMutationObserver = new MutationObserver(this.#handleThemeMutation.bind(this));

  static get properties() {
    const props = {
      _themeIsCarbonFiber: { state: true },
    };

    return props;
  }

  constructor(host) {
    this.#host = host;
    this.#host.addController(this);
    this.#host._themeIsCarbonFiber = true;
  }

  hostConnected() {
    // Watch for changes in the theme.
    this.#themeMutationObserver.observe(
      this.#host.ownerDocument.documentElement,
      { attributes: true, attributeFilter: ['data-smart-theme'], subtree: true },
    );
    this.#handleThemeMutation();
  }

  hostDisconnected() {
    // Stop watching for changes in the text direction.
    this.#themeMutationObserver.disconnect();
  }

  #handleThemeMutation() {
    // Find the closest element that contains the theme setting.
    let themeElement = this.#host.closest('[data-smart-theme]');

    if (!themeElement) {
      // While we are in a shadow root, we need to keep walking back out to our host element until we ultimately find the parent that is in
      // the light dom.
      let lightDomElement = this.#host;
      while (lightDomElement.getRootNode() instanceof ShadowRoot) {
        lightDomElement = lightDomElement.getRootNode().host;
      }

      themeElement = lightDomElement.closest('[data-smart-theme]');
    }

    const newTheme = themeElement?.dataset.smartTheme ?? 'cf';

    // Save the new theme. But don't set it if unchanged - it can cause recursion in property updates
    const _themeIsCarbonFiber = newTheme === 'cf';
    if (this.#host._themeIsCarbonFiber !== _themeIsCarbonFiber) {
      this.#host._themeIsCarbonFiber = _themeIsCarbonFiber;
    }
  }
}

export { ThemeController };
//# sourceMappingURL=themeController.js.map
