/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/utils/non-emptying.region/non-emptying.region'
], function(NonEmptyingRegionImpl){
  'use strict';

  /**
   * A `Marionette.Region` that does not empty it's DOM element on rendering new instance of `Marionette.View`.
   *
   * @example
   * define([
   *  'nuc/lib/underscore',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/regions/non-emptying.region'
   * ], function(_, Marionette, NonEmptyingRegion){
   *  'use strict';
   *
   *  var MyView = Marionette.LayoutView.extend({
   *    template: false,
   *    constructor: function MyView(options) {
   *      options = options || {};
   *      MyView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      if(_.isString(this.options.greet) && !_.isEmpty(this.options.greet)) {
   *        this.$el.text(this.options.greet);
   *      }
   *    }
   *  });
   *
   *  var view1 = new MyView({greet: 'Hello'});
   *  var view2 = new MyView({greet: 'World'});
   *
   *  var region = new NonEmptyingRegion({el: '.host-element'}); //can also set prependChild: true if element for view added later should show before previously added element in DOM.
   *
   *  region.show(view1); //Adds element with 'Hello' in the DOM
   *  region.show(view2, {preventDestroy: true}); //Adds element with 'World' in the DOM, however element with 'Hello' is not removed and still exists in the DOM.
   *
   *  //With normal Marionette.Region, after adding view2, the HTML element specific to view1 would have been removed.
   * });
   *
   * @module {d2/sdk/controls/regions/non-emptying.region} d2/sdk/controls/regions/"non-emptying.region"
   * @name NonEmptyingRegion
   * @extends {external:Marionette.Region}
   *
   */

  /**
   * @external "Marionette.Region"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.region.html
   */

  var NonEmptyingRegion = NonEmptyingRegionImpl.extend({

    /**
     * @constructs
     * @name NonEmptyingRegion
     * @alias module:NonEmptyingRegion
     * @param {object} [options] - Constructor options. Usual constructor options as per `Marionette.Region` specification are all supported but not
     * explicitly documented here. Below are the special parameter supported by this region type.
     * @param {Boolean} [options.prependChild] - Flag to indicate whether current view's element is to be placed before or after
     * previous view's element in DOM when `show()` is called with `options.preventDestroy=true`. Defaults to `false`.
     * @param {number} [options.index] - Positive integer to indicate any specific ordered spot for current view's element in the DOM
     * when a previous view exists and current view is being shown with `options.preventDestroy=true`.
     */
    constructor: function NonEmptyingRegion(options) {
      NonEmptyingRegion.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name show
   * @description Shows a `Marionette.View` in the region.
   * @param {Marionette.View} view - The view to be shown
   * @param {object} [options] - Display control options
   * @param {Boolean} [options.preventDestroy] - Indicates whether previous view should be destroyed before showing current view or not. This flag is
   * an important indication that tells the `NonEmptyingRegion` to keep adding view content as children of it own element. Without this flag set to `true`
   * the previously shown view is destroyed and its element is removed from DOM as usual.
   * @instance
   */

  return NonEmptyingRegion;
});