/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Marionette from "nuc/lib/marionette";

class ViewSwappingRegion extends Marionette.Region {
  constructor(options = {}) {
    super(options);
    this.wrapContainerClass = _.isString(options.wrapContainerClass) ? options.wrapContainerClass : null;
    this.wrapViewInContainer = !!this.wrapContainerClass;
    this.$el.empty();
  }
  show(view, options = {}) {
    if (this.currentView !== view) {
      _.extend(options, {
        render: !view._isRendered
      });
      super.show(view, options);
    }
  }
  empty(options = {}) {
    _.extend(options, {
      preventDestroy: true
    });
    const view = this.currentView;
    if (view) {
      this.lastView = view;
      super.empty(options);
    }
  }
  attachHtml(view) {
    let $swapInParent = this.wrapViewInContainer ? view.$el.parent(`.${this.wrapContainerClass}`) : view.$el;
    let $swapOutParent = this.lastView && (this.wrapViewInContainer ? this.lastView.$el.parent(`.${this.wrapContainerClass}`) : this.lastView.$el);
    if ($swapInParent.length === 0) {
      $swapInParent = view.$el.wrap(`<div class="${this.wrapContainerClass}"></div>`).parent();
    }
    $swapInParent.removeClass("binf-hidden");
    this._raiseEventOnView(this.lastView, "before:deactivate");
    this._raiseEventOnView(view, "before:activate");
    setTimeout(() => {
      if (this.lastView) {
        $swapOutParent.addClass("binf-hidden");
        $swapOutParent.detach();
        this._raiseEventOnView(this.lastView, "deactivate");
        delete this.lastView;
      }
      this.$el.append($swapInParent);
      if (view._isDomRefreshMonitored === true) {
        this._raiseEventOnView(view, "dom:refresh");
      }
      this._raiseEventOnView(view, "activate");
    }, 0);
  }
  _raiseEventOnView(view, event) {
    view && Marionette.triggerMethodOn(view, event, view);
  }
}

Object.defineProperty(ViewSwappingRegion.prototype.constructor, "name", {
  value: "ViewSwappingRegion"
});

export default ViewSwappingRegion;