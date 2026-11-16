class RadioGroupController {
  constructor(groupItem) {
    this.groupWithFocus = undefined;
    this.isMouseDown = false;
    this.isUpdating = false;
    this.groups = {};
    this.idCounter = 0;

    groupItem.addEventListener('mousedown', () => {
      this.isMouseDown = true;
    });
    groupItem.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });
    groupItem.addEventListener('keydown', (e) => {
      this.keydown(e);
    });
  }

  // Get a RadioGroupController for the given element. If no controller exists, one will
  // be created.
  // Returns the same controller for all elements which have the same root node.

  static getController(element) {
    const controllerSymbol = 'radio group controller';
    const root = element.getRootNode();
    let controller = root[controllerSymbol];
    if (controller === undefined) {
      controller = new RadioGroupController(root);
      root[controllerSymbol] = controller;
    }
    return controller;
  }

  // register the DOM element as a radio group element (use the name attribute to group elements)
  register(element) {
    const name = element.name || element.getAttribute('name') || '';
    if (!name) {
      // don't register without name
      return;
    }
    const group = this.groupByName(name);
    group.items.add(element);
    group.sorted = null;
  }

  // remove the given DOM element (identified by name from the group items (group is referenced by
  // element.name)
  unregister(element, oldName) {
    if (!oldName) {
      return;
    }
    const group = this.groupByName(oldName);
    if (!group) {
      return;
    }
    group.ordered = null;
    if (group.selected === element) {
      group.selected = null;
    }
    group.items.delete(element);
    if (group.items.size === 0) {
      delete this.groups[oldName];
    }
  }

  groupByName(nameOfGroup) {
    let group;
    if (this.groups[nameOfGroup]) {
      group = this.groups[nameOfGroup];
    } else {
      const items = new Set();
      group = { items, selected: undefined, sorted: undefined };
      this.groups[nameOfGroup] = group;
    }
    return group;
  }

  sort(group) {
    group.sorted = Array.from(group.items);
    group.sorted.sort((a, b) => {
      switch (a.compareDocumentPosition(b)) {
        case Node.DOCUMENT_POSITION_PRECEDING:
          return 1;
        case Node.DOCUMENT_POSITION_FOLLOWING:
          return -1;
        default:
          return 0;
      }
    });
  }

  has(element) {
    const name = element.name || element.getAttribute('name') || '';
    const group = this.groupByName(name);
    return group.items.has(element);
  }

  hasChecked(group) {
    for (const item of group.items) {
      if (item.checked) {
        return true;
      }
    }
    return false;
  }

  // Unselects other elements in element's group if element is checked.
  updateForChecked(element) {
    const name = element.name || element.getAttribute('name') || '';
    const group = this.groupByName(name);
    // console.log(`Update ${element.value}: checked: ${element.checked}`);

    for (const otcRadioItem of group.items) {
      if (otcRadioItem !== element) {
        otcRadioItem.isInvalid = false;
        otcRadioItem.checked = false;
        otcRadioItem.isFocusable = false;
      } else {
        otcRadioItem.checked = true;
      }
    }
    group.selected = element;
  }

  isAtLeastOneSelected(element) {
    const name = element.name || element.getAttribute('name') || '';
    const group = this.groupByName(name);
    let oneSelected = false;
    for (const otcRadioItem of group.items) {
      if (otcRadioItem.checked) {
        oneSelected = true;
        break;
      }
    }
    return oneSelected;
  }

  async selectPrevious(element) {
    const name = element.name || element.getAttribute('name') || '';
    const group = this.groupByName(name);
    if (!group || group.items.size < 1) {
      return; // noting to do if no group or no items in group
    }
    if (!group.sorted) {
      this.sort(group);
    }
    const { sorted } = group;
    const idx = sorted.indexOf(element);
    let prev;
    // loop through the remaining elements until either the element is not disabled or no more avail
    for (let i = idx - 1; i >= 0; i -= 1) {
      prev = sorted[i];
      if (prev.disabled) {
        prev = undefined; // don't use this element later
      } else {
        // stop loop if element is not disabled
        break;
      }
    }
    if (prev) {
      await prev.selectAndFocus();
    } else {
      // circle to the last element and skip all disabled
      for (let i = sorted.length - 1; i >= idx; i -= 1) {
        prev = sorted[i];
        if (sorted[i].disabled) {
          prev = undefined;
        } else {
          // stop loop if element is not disabled
          break;
        }
      }
      if (prev) {
        await prev.selectAndFocus();
      }
    }
  }

  async selectNext(element) {
    const name = element.name || element.getAttribute('name') || '';
    const group = this.groupByName(name);
    if (!group || group.items.size < 1) {
      return; // noting to do if no group or no items in group
    }
    if (!group.sorted) {
      this.sort(group);
    }
    const { sorted } = group;
    const idx = sorted.indexOf(element);
    let next;
    // loop through the remaining elements until either the element is not disabled or no more avail
    for (let i = idx + 1; i < sorted.length; i += 1) {
      next = sorted[i];
      if (next.disabled) {
        next = undefined; // don't use this element later
      } else {
        // stop loop if element is not disabled
        break;
      }
    }
    if (next) {
      await next.selectAndFocus();
    } else {
      // circle to the first element and skip all disabled
      for (let i = 0; i < idx; i += 1) {
        next = sorted[i];
        if (next.disabled) {
          next = undefined;
        } else {
          // stop loop if element is not disabled
          break;
        }
      }
      if (next) {
        await next.selectAndFocus();
      }
    }
  }

  keydown(e) {
    const element = e.target;

    if (!this.has(element)) {
      return;
    }

    if (element.readonly) {
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      this.selectNext(element);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      this.selectPrevious(element);
    }
  }

  getUniqueId(prefix) {
    const id = `${this.idCounter}`;
    this.idCounter += 1;
    return prefix ? prefix + id : id;
  }
}

export { RadioGroupController };
//# sourceMappingURL=RadioGroupController.js.map
