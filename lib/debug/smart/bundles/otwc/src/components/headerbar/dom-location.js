// class to manage DOM position of searchfield
class DomLocation {
  #slotName = '';

  #parentNode = undefined;

  #nextSibling = undefined;

  #initialized = false;

  get slotName() {
    return this.#slotName;
  }

  set slotName(sname) {
    this.#slotName = sname;
    this.#initialized = true;
  }

  get parentNode() {
    return this.#parentNode;
  }

  set parentNode(pnode) {
    this.#parentNode = pnode;
    this.#initialized = true;
  }

  get nextSibling() {
    return this.#nextSibling;
  }

  set nextSibling(nsibling) {
    this.#nextSibling = nsibling;
    this.#initialized = true;
  }

  // returns if class was initialized by setting values
  get isInitialized() {
    return this.#initialized;
  }
}

export { DomLocation };
//# sourceMappingURL=dom-location.js.map
