import { LitElement } from 'lit';
import packageInfo from '../../package.json.js';

class ElementBase extends LitElement {
  static get version() {
    return packageInfo.version;
  }

  // As suggested by a Lit developer, override the default property setter to immediately call performUpdate() so that it will
  // synchronously update properties.  See: https://github.com/lit/lit-element/issues/643#issuecomment-613754506
  //
  // "We've also recently landed the ability to customize LitElement's default property handling by specifying a custom property descriptor
  // using static getPropertyDescriptor. This should enable users to make base classes that specify custom property options and perform
  // specific actions. For example, it should be simple to make an observer type feature similar to what existed in Polymer. It's also
  // possible to make properties that update the element synchronously by calling performUpdate."
  static getPropertyDescriptor(name, key, options) {
    const defaultDescriptor = super.getPropertyDescriptor(name, key, options);
    return {
      get: defaultDescriptor.get,
      set(value) {
        defaultDescriptor.set.call(this, value);
        if (this.renderRoot) {
          this.performUpdate();
        }
      },
      configurable: defaultDescriptor.configurable,
      enumerable: defaultDescriptor.enumerable,
    };
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    // Call performUpdate() so that we render now synchronously instead of waiting for the asynchronous scheduled update.
    this.performUpdate();
  }
}

export { ElementBase };
//# sourceMappingURL=element-base.js.map
