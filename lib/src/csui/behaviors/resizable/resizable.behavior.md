ResizableBehavior
=================

This behavior is to resize any DOM element.
With the cursor grab the right and drag to the desired width.
Maximium width supported is 50% of the parent container.


Usage
-----

var ResizableBehavior = Marionette.Behavior.extend({
  options.content = contentPanel
  ...
  
});

contentPanel which need to be resized should be passed to the behaviour class like below

import ResizableBehavior from '../..ResizableBehavior';
this.behaviors = _.extend({
      ResizableBehavior: {
        behaviorClass: ResizableBehavior,
        content: contentPanel,
        minWidth: 248 //The minWidth can be customized with any value between 240px and 50% of the viewport width
      }
    }, this.behaviors);
Marionette.LayoutView.prototype.constructor.call(this, arguments);