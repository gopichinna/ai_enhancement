define([
  'nuc/lib/jquery',
  'csui/lib/jquery.ui/js/jquery-ui'
], function ($) {
  /*!
  * A seperate jQuery UI widget to support drag and drop in touch devices,
  *    --Actual draggable plugin remains untouched
  *    -- [OT] Actual touch punch implementation will not differentiate normal touch and long press to drag the element.
  *            So if we directly override $.ui.mouse, then dragging behavior will inteferece with scroll.
  *            This modified version will wait for a delay and then send
  *            simulated mouse event on the element if needed
  *    -- [Ref]: https://github.com/furf/jquery-ui-touch-punch
  * */

  // Detect touch support
  $.support.touch = 'ontouchend' in document;

  // Ignore browsers without touch support
  if (!$.support.touch) {
    return;
  }

  function getTouchCoords(event) {
    return {
      x: event.originalEvent.changedTouches[0].pageX,
      y: event.originalEvent.changedTouches[0].pageY
    };
  }

  function getSimulatedEvent(event, type) {
    var touch = event.originalEvent.changedTouches[0];
    return new MouseEvent(type, {
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
      view: window,
      target: event.target
    });
  }

  function simulateMouseEvent(event, type) {

    // Ignore multi-touch events
    if (event.originalEvent.touches.length > 1) {
      return;
    }

    // Prevent "Ignored attempt to cancel a touchmove event with cancelable=false" errors
    if (event.cancelable) {
      event.preventDefault();
    }

    var simulatedEvent = getSimulatedEvent(event, type);

    event.target.dispatchEvent(simulatedEvent);
  }

  var touchProxy = {

    isTouchHandled: false,

    _touchStart: function (event) {
      var self = this;
      // Ignore multi-touch event  or allow  _mouseCapture method to decide it
      if (event.touches.length > 1 || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
        return;
      }

      // Interaction time
      this._startedMove = event.timeStamp;

      // Set the flag to prevent other widgets from inheriting the touch event
      self.isTouchHandled = true;

      // Track movement to determine if interaction was a click
      self._touchMoved = false;

      // Track movement to determine if interaction was a click
      this._startPos = this._currentPos = getTouchCoords(event);
      if (this.options.holdDelay === 0) {
        this._triggerInitEvents(event);
      } else {
        this._eventSimulator = setTimeout(function () {
          self._triggerInitEvents(event);
        }, this.options.holdDelay);
      }

    },

    _touchMove: function (event) {
      // Ignore event if not handled
      if (!this.isTouchHandled) {
        return;
      }

      // Interaction was moved
      this._touchMoved = true;

      this._currentPos = getTouchCoords(event);
      if (this.isWatching) {
        simulateMouseEvent(event, 'mousemove');
      }
    },

    _touchEnd: function (event) {
      // Ignore event if not handled
      if (!this.isTouchHandled) {
        return;
      }

      if (this.isWatching) {
        simulateMouseEvent(event, 'mouseup');
        simulateMouseEvent(event, 'mouseout');
        this.isWatching = false;
      }
      this._eventSimulator && clearTimeout(this._eventSimulator);

      // If the touch interaction did not move, it should trigger a click
      // Check for this in two ways - length of time of simulation and distance moved
      // Allow for Apple Stylus to be used also
      var timeMoving = event.timeStamp - this._startedMove;
      if (!this._touchMoved || timeMoving < 500) {
        // Simulate the click event
        simulateMouseEvent(event, 'click');
      } else {
        var endPos = getTouchCoords(event);
        if ((Math.abs(endPos.x - this._startPos.x) < 10) && (Math.abs(endPos.y - this._startPos.y) < 10)) {

          // If the touch interaction did not move, it should trigger a click
          if (!this._touchMoved || event.originalEvent.changedTouches[0].touchType === 'stylus') {
            // Simulate the click event
            simulateMouseEvent(event, 'click');
          }
        }
      }

      // Unset the flag to determine the touch movement stopped
      this._touchMoved = false;

      this.isTouchHandled = false;
    },

    _triggerInitEvents: function (event) {
      if ((Math.abs(this._currentPos.x - this._startPos.x) < 10) && (Math.abs(this._currentPos.y - this._startPos.y) < 10)) {
        // Simulate the mouseover event
        simulateMouseEvent(event, 'mouseover');

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');

        // Simulate the mousedown event
        simulateMouseEvent(event, 'mousedown');

        this.isWatching = true;
      }
    },

    _attachProxyListners: function () {
      // Delegate the touch handlers to the widget's element
      if ($.support.touch) {
        this.element.addClass("d2-ui-touchable");
      }
      this.element.on({
        touchstart: $.proxy(this, '_touchStart'),
        touchmove: $.proxy(this, '_touchMove'),
        touchend: $.proxy(this, '_touchEnd')
      });

    },

    _removeTouchListners: function () {
      // Delegate the touch handlers to the widget's element
      this.element.off({
        touchstart: $.proxy(this, '_touchStart'),
        touchmove: $.proxy(this, '_touchMove'),
        touchend: $.proxy(this, '_touchEnd')
      });
    },
  };

  /*Add-ons to simulate mouse events for touch in existing jquery-ui plugins*/
  var origSortableCreate = $.ui.sortable.prototype._create;
  var origSortableDestroy = $.ui.sortable.prototype._destroy;

  $.extend($.ui.sortable.prototype, {
    _create: function () {
      this._attachProxyListners();
      origSortableCreate.apply(this, arguments);
    },
    _destroy: function () {
      this._removeTouchListners();
      origSortableDestroy.apply(this, arguments);
    }
  }, touchProxy);
  $.extend($.ui.sortable.prototype.options, {holdDelay: 500})


  var origDraggableCreate = $.ui.draggable.prototype._create;
  var origDraggableDestroy = $.ui.draggable.prototype._destroy;


  $.extend($.ui.draggable.prototype, {
    _create: function () {
      this._attachProxyListners();
      origDraggableCreate.apply(this, arguments);
    },
    _destroy: function () {
      this._removeTouchListners();
      origDraggableDestroy.apply(this, arguments);
    }
  }, touchProxy);
  $.extend($.ui.draggable.prototype.options, {holdDelay: 500})


});