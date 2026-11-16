/**
 * @preserve
 * bootstrap3-typeahead.js v3.1.0
 * https://github.com/bassjobsen/Bootstrap-3-Typeahead
 * Original written by @mdo and @fat
 * Copyright 2014 Bass Jobsen @bassjobsen
 * Licensed under the Apache License, Version 2.0
 */

/* =============================================================
 * Changes:
 *  - changed 'jquery' constant to 'csui/lib/jquery'.
 *  - changed 'worker' to handle 'source' functions returning a promise.
 *  - changed 'show' to support perfect-scrollbar in case the plugin is
 *    available and it is configured to use. Therefore additional library
 *    options are introduced
 *     - prettyScrolling: Flag whether to render a perfect-scrollbar or not.
 *     - scrollContainer: The perfect-scrollbar container element.
 *     - scrollContainerHeight: The maximum height of the scroll container.
 *     - currentHighlighter : to handle actions on current active element.
 *     - nextHighlighter : to handle actions on next active element.
 */

define(['csui/lib/jquery', 'csui/utils/log'], function ($, log) {
  'use strict';
  // jshint laxcomma: true

  /* TYPEAHEAD PUBLIC CLASS DEFINITION
   * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element);
    this.scrollContainerHeight = !!options.scrollContainerHeight;
    this.options = $.extend({}, $.fn.typeahead.defaults, options);
    this.matcher = this.options.matcher || this.matcher;
    this.sorter = this.options.sorter || this.sorter;
    this.select = this.options.select || this.select;
    this.autoSelect = typeof this.options.autoSelect == 'boolean' ? this.options.autoSelect : true;
    this.highlighter = this.options.highlighter || this.highlighter;
    this.render = this.options.render || this.render;
    this.updater = this.options.updater || this.updater;
    this.displayText = this.options.displayText || this.displayText;
    this.source = this.options.source;
    this.delay = this.options.delay;
    this.$menu = $(this.options.menu);
    this.options.pickerListId && this.$menu.attr('id', options.pickerListId);
    this.options.pickerListClass && this.$menu.addClass(this.options.pickerListClass);
    this.$appendTo = this.options.appendTo ? $(this.options.appendTo) : null;
    this.shown = false;
    this.blur = this.options.blur || this.blur;
    this.focus = this.options.focus || this.focus;
    this.listen();
    this.showHintOnFocus = typeof this.options.showHintOnFocus == 'boolean' || this.options.showHintOnFocus === 'all' ? this.options.showHintOnFocus : false;
    this.afterSelect = this.options.afterSelect;
    this.currentHighlighter = this.options.currentHighlighter;
    this.nextHighlighter = this.options.nextHighlighter;
    this.accessibility = this.options.accessibility;
    this.addItem = false;
    // perfect-scrollbar support
    this.prettyScrolling = ($.isFunction($.fn.perfectScrollbar) && this.options.prettyScrolling);
    if(this.prettyScrolling){
      log.warn('perfect scrollbar is depricated hence ignoring this option');
      this.prettyScrolling = false;
    }
    this.$scrollContainer = this.options.scrollContainer ? $(this.options.scrollContainer) : this.$menu;
    this.handleNoResults = !!this.options.handleNoResults;
    this.emptyTemplate = (!!this.handleNoResults && !!this.options.emptyTemplate) ?
                         this.options.emptyTemplate : "";
    if (this.handleNoResults) {
      this.dataFound = false;
    }
    if (this.options.showMore) {
      this.options.rollOver = false;
    }
  };

  Typeahead.prototype = {

    constructor: Typeahead,

    select: function () {
      var val = this.$menu.find('.binf-active').data('value');
      this.$element.data('active', val);
      if (this.autoSelect || val) {
        var newVal = this.updater(val);
        this.$element
            .val(this.displayText(newVal) || newVal)
            .trigger('change');
        this.afterSelect(newVal);
      }
      return this.hide();
    },

    updater: function (item) {
      return item;
    },

    setSource: function (source) {
      this.source = source;
    },

    show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element.outerHeight()
      }), scrollHeight;

      scrollHeight = typeof this.options.scrollHeight == 'function' ?
                     this.options.scrollHeight.call() :
                     this.options.scrollHeight;

        this.$appendTo = this.$appendTo
            ? this.$scrollContainer.appendTo(this.$appendTo)
            : this.$scrollContainer.insertAfter(this.$element);

      if (this.options.beforeShow) {
        this.options.beforeShow(this);
      }

      (this.$appendTo ? this.$menu.appendTo(this.$appendTo) : this.$menu.insertAfter(this.$element))
          .css({
            top: pos.top + pos.height + scrollHeight
            , left: pos.left
          })
          .show();

      if (this.$scrollContainer[0]!==this.$menu[0]) {
        this.$scrollContainer.show();
      }

      var scrollContainerHeight, scrollBorderPadding, scrollContentHeight;
      var heights = [], height;
      if (this.options.showMore && this.allItems) {
        // menu contains items for first page, use this as scroll container height.
        this.$scrollContainer.css("height","auto");
        this.scrollItemsHeight = this.$scrollContainer.outerHeight();
        this.$menu.html(this.allItems);
        delete this.allItems;
      }
      this.scrollItemsHeight && heights.push(this.scrollItemsHeight);

      if (this.scrollContainerHeight || !(this.options.showMore && this.options.items>0)) {
        scrollContainerHeight = isNaN(this.options.scrollContainerHeight) ? undefined : this.options.scrollContainerHeight-0;
        if (scrollContainerHeight) {
          heights.push(scrollContainerHeight);
        } else if (this.options.scrollContainerHeight!=="auto") {
          this.$scrollContainer.css("height", this.options.scrollContainerHeight);
          height = this.$scrollContainer.outerHeight();
        }
      }

      if (heights.length>0 || height) {
        scrollBorderPadding = this.$scrollContainer.outerHeight() - this.$scrollContainer.height();
        scrollContentHeight = contentHeight.call(this);
        heights.push(scrollContentHeight+scrollBorderPadding);
        scrollContainerHeight = heights.length===1 ? heights[0] : Math.min.apply(Math,heights);
        if (!height || scrollContainerHeight<height) {
          this.$scrollContainer.css("height", scrollContainerHeight);
        }
      }

      var scrollYMarginOffset = 0;

      if (this.options.showMore) {
        !this.processMore && this.$scrollContainer.scrollTop(0);
      }

      this.shown = true;

      if (this.options.afterShow) {
        this.options.afterShow(this);
      }

      if (this.options.showMore) {
        scrollContentHeight = contentHeight.call(this);
        scrollContainerHeight = this.$scrollContainer.outerHeight();
        scrollBorderPadding = scrollContainerHeight - this.$scrollContainer.height();
        if (scrollContainerHeight-scrollBorderPadding+scrollYMarginOffset>=scrollContentHeight) {
          if (this.options.showMore && this.options.showMore()) {
            // force a scrollbar
            $('<li class="typeahead-force-scrollbar"></li>').appendTo(this.$menu).css({
              'background-color': 'transparent',
              'height': scrollYMarginOffset + 1
            });
          }
        }
      }

      return this;
    },

    hide: function () {

      this.$scrollContainer.hide();
      if (this.$scrollContainer[0]!==this.$menu[0]) {
        this.$menu.hide();
      }
      this.shown = false;
      return this;
    },

    lookup: function (query) {
      if (typeof(query) != 'undefined' && query !== null) {
        this.query = query;
      } else {
        this.query = this.$element.val() || '';
      }

      if (this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this;
      }

      var worker = $.proxy(function () {
        var that = this;

        // don't call source callback with too short query, when user types fast.
        if (this.query.length < this.options.minLength) {
          return;
        }
        if ($.isFunction(this.source)) {
          $.when(this.source(this.query, $.proxy(this.process, this))).done(function (items) {
            that.process(items);
          });
        } else if (this.source) {
          this.process(this.source);
        }
      }, this);

      clearTimeout(this.lookupWorker);
      this.lookupWorker = setTimeout(worker, this.delay);
    },

    process: function (items) {
      this.dataFound = true;
      var that = this;

      items = $.grep(items, function (item) {
        return that.matcher(item);
      });
      if (items.length === 0 && this.handleNoResults) {
        this.dataFound = false;
        return this.renderNoResults().show();
      }

      items = this.sorter(items);

      if (!items.length && !this.options.addItem) {
        return this.shown ? this.hide() : this;
      }

      if (items.length > 0) {
        this.$element.data('active', items[0]);
      } else {
        this.$element.data('active', null);
      }

      // Add item
      if (this.options.addItem) {
        items.push(this.options.addItem);
      }

      if (this.options.items == 'all' || this.options.showMore) {
        return this.render(items).show();
      } else {
        return this.render(items.slice(0, this.options.items)).show();
      }
    },

    matcher: function (item) {
      var it = this.displayText(item);
      return ~it.toLowerCase().indexOf(this.query.toLowerCase());
    },

    sorter: function (items) {
      var beginswith        = []
          , caseSensitive   = []
          , caseInsensitive = []
          , item;

      while ((item = items.shift())) {
        var it = this.displayText(item);
        if (!it.toLowerCase().indexOf(this.query.toLowerCase())) {
          beginswith.push(item);
        } else if (~it.indexOf(this.query)) {
          caseSensitive.push(item);
        } else {
          caseInsensitive.push(item);
        }
      }

      return beginswith.concat(caseSensitive, caseInsensitive);
    },

    highlighter: function (item) {
      var html = $('<div></div>');
      var query = this.query;
      var i = item.toLowerCase().indexOf(query.toLowerCase());
      var len, leftPart, middlePart, rightPart, strong;
      len = query.length;
      if (len === 0) {
        return html.text(item).html();
      }
      while (i > -1) {
        leftPart = item.substr(0, i);
        middlePart = item.substr(i, len);
        rightPart = item.substr(i + len);
        strong = $('<strong></strong>').text(middlePart);
        html
            .append(document.createTextNode(leftPart))
            .append(strong);
        item = rightPart;
        i = item.toLowerCase().indexOf(query.toLowerCase());
      }
      return html.append(document.createTextNode(item)).html();
    },

    render: function (items) {
      var that = this;
      var self = this;
      var activeFound = false;
      var limited = [];
      items = $(items).map(function (i, item) {
        function create_item(){
          i = $(that.options.item).data('value', item);
          i.find('a').html(that.highlighter(text,item));
          i.attr("id", "user-item" + item.cid);
          if (text == self.$element.val()) {
            i.addClass('binf-active');
            self.$element.data('active', item);
            activeFound = true;
          }
        }
        var text = self.displayText(item);
        create_item();
        if (self.options.showMore && !self.scrollItemsHeight && self.options.items>0) {
          if (limited.length<self.options.items) {
            limited.push(i[0]);
            create_item();
          }
        }
        return i[0];
      });

      if (this.autoSelect && !activeFound) {
        items.first().addClass('binf-active');
        this.$element.data('active', items.first().data('value'));
      }
      if (this.options.items>0 && limited.length===this.options.items) {
        this.allItems = items;
        this.$menu.html(limited);
      } else {
        delete this.allItems;
        this.$menu.html(items);
      }
      this.nextHighlighter(items.first());
      return this;
    },

    renderNoResults: function () {
      this.$menu.html(this.emptyTemplate).addClass("csui-no-results-wrapper");
      return this;
    },

    displayText: function (item) {
      return item.name || item;
    },

    next: function (event) {
      var active = this.$menu.find('.binf-active')
          , next = active.next('li:not(.typeahead-force-scrollbar)');

      if (!next.length) {
        if (active.length && !this.options.rollOver && this.shown) {
          return;
        }
        next = $(this.$menu.find('li:not(.typeahead-force-scrollbar)')[0]);
      }

      selectScrollFetch.call(this,next,event);
    },

    prev: function (event) {
      var active = this.$menu.find('.binf-active')
          , prev = active.prev('li:not(.typeahead-force-scrollbar)');

      if (!prev.length) {
        if (!this.options.rollOver) {
          return;
        }
        prev = this.$menu.find('li:not(.typeahead-force-scrollbar)').last();
      }

      selectScrollFetch.call(this,prev,event);
    },

    forward: function (event) {

      function nextPageIndex(menuItems,index) {
        if (index>=menuItems.length-1) {
          return undefined;
        }
        var top = topPos(menuItems,index);
        var scrollContainerHeight = this.$scrollContainer.height();
        for (var ii = index+1; ii<menuItems.length; ii++) {
          var bottom = bottomPos(menuItems,ii);
          if (bottom-top>scrollContainerHeight) {
            ii--;
            break;
          } else if (bottom-top===scrollContainerHeight) {
            break;
          } else if (ii+1>=menuItems.length) {
            return undefined;
          }
        }
        if (ii<=index) {
          ii = index + 1;
        }
        if (ii<menuItems.length) {
          return ii;
        }
        return undefined;
      }

      function isLess(menuItems,index){
        var top = topPos(menuItems,index>=0?index:0);
        var bottom = bottomPos(menuItems,menuItems.length-1);
        return bottom-top+minSpaceY($(menuItems[menuItems.length-1]))<this.$scrollContainer.height();
      }

      function checkForward(index) {
        var menuItems = this.$menu.find("li:not(.typeahead-force-scrollbar)");
        var newIndex = nextPageIndex.call(this,menuItems,index>=0?index:0);
        if (newIndex==null && this.options.showMore && isLess.call(this,menuItems,index) && this.options.showMore()) {
          fetchMore.call(this,checkForward,index);
          return;
        }
        selectScrollFetch.call(this,$(menuItems[newIndex>=0?newIndex:menuItems.length-1]),event);
      }

      checkForward.call(this,this.$menu.find('li:not(.typeahead-force-scrollbar)').index(this.$menu.find('.binf-active')));
    },

    backward: function (event) {

      function prevPageIndex(menuItems,index) {
        if (index<=0) {
          return undefined;
        }
        var bottom = bottomPos(menuItems,index);
        var scrollContainerHeight = this.$scrollContainer.height();
        for (var ii = index-1; ii>=0; ii--) {
          var top = topPos(menuItems,ii);
          if (bottom-top>scrollContainerHeight) {
            ii++;
            break;
          } else if (bottom-top===scrollContainerHeight) {
            break;
          }
        }
        if (ii>=index) {
          ii = index - 1;
        }
        if (ii>=0) {
          return ii;
        }
        return undefined;
      }

      var menuItems = this.$menu.find('li:not(.typeahead-force-scrollbar)');
      var index = menuItems.index(this.$menu.find('.binf-active'));
      var newIndex = prevPageIndex.call(this,menuItems,index>=0?index:0);
      selectScrollFetch.call(this,$(menuItems[newIndex>=0?newIndex:0]),event);
    },

    first: function (event) {
      selectScrollFetch.call(this,this.$menu.find('li:not(.typeahead-force-scrollbar)').first(),event);
    },

    last: function (event) {
      selectScrollFetch.call(this,this.$menu.find('li:not(.typeahead-force-scrollbar)').last(),event);
    },

    listen: function () {
      this.$element
          .on('focus', $.proxy(this.focus, this))
          .on('blur', $.proxy(this.blur, this))
          .on('keypress', $.proxy(this.keypress, this))
          .on('keyup', $.proxy(this.keyup, this));

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this));
      }

      this.$menu
          .on('click', $.proxy(this.click, this))
          .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
          .on('mouseleave', 'li', $.proxy(this.mouseleave, this));
    },

    destroy: function () {
      this.$element.data('typeahead', null);
      this.$element.data('active', null);
      this.$element
          .off('focus')
          .off('blur')
          .off('keypress')
          .off('keyup');

      if (this.eventSupported('keydown')) {
        this.$element.off('keydown');
      }

      this.$menu.remove();
    },

    eventSupported: function (eventName) {
      var isSupported = eventName in this.$element;
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;');
        isSupported = typeof this.$element[eventName] === 'function';
      }
      return isSupported;
    },

    move: function (e) {
      function handleKey() {
        if (!this.shown) {
          return;
        }
        
        // up arrow with the shiftKey (this is actually the left parenthesis)
        // down arrow with the shiftKey (this is actually the right parenthesis)
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        return true;
      }

      switch (e.keyCode) {
      case 9: // tab
      case 13: // enter
      case 27: // escape
        this.shown && e.preventDefault();
        break;

      case 33: // page up
        handleKey.call(this) && this.backward(e);
        break;

      case 34: // page down
        handleKey.call(this) && this.forward(e);
        break;

      case 35: // last pos
        if (e.ctrlKey) {
          !this.shown && e.preventDefault();
          handleKey.call(this) && this.last(e);
        }
        break;

      case 36: // first pos
        if (e.ctrlKey) {
          !this.shown && e.preventDefault();
          handleKey.call(this) && this.first(e);
        }
        break;

      case 38: // up arrow
        handleKey.call(this) && this.prev(e);
        break;

      case 40: // down arrow
        handleKey.call(this) && this.next(e);
        break;
      }
    },

    keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 33, 34, 35, 36, 9, 13, 27]);
      if (!this.shown && e.keyCode == 40) {
        this.lookup();
      } else {
        this.move(e);
      }
    },

    keypress: function (e) {
      if (this.suppressKeyPressRepeat) {
        return;
      }
      this.move(e);
    },

    keyup: function (e) {
      switch (e.keyCode) {
      case 40: // down arrow
      case 39: // arrow right : Fix LPAD-95055 : with each ARROW RIGHT the user list flickers and the query is executed again
      case 38: // up arrow
      case 37: // arrow left : Fix LPAD-95055 : with each ARROW LEFT the user list flickers and the query is executed again
      case 36: // first pos
      case 35: // last pos
      case 34: // page down
      case 33: // page up
      case 16: // shift
      case 17: // ctrl
      case 18: // alt
      case 44: // PrtSc : LPAD-106774 : Fix User picker: PRINT button scrolls to top
        break;

      case 9: // tab
      case 13: // enter
        if (!this.shown) {
          return;
        }
        if (this.handleNoResults && !this.dataFound) {
          return;
        }
        this.select();
        break;
      case 27: // escape
        if (!this.shown) {
          return;
        }
        this.hide();
        break;
      case 116: // Refresh/F5. suppress menu being displayed in oversize.
      case 113: // F2 restricts to open dropdown
        return;
      
      case 8: //backspace
      case 46: //delete
        if(this.options.collection.filters?.name === this.$element.val()) {
          break;
        }
      
      default:
        this.lookup();
      }

      e.preventDefault();
    },

    focus: function (e) {    
      if (!this.focused) {
        this.focused = true;
        if (this.options.showHintOnFocus && this.skipShowHintOnFocus !== true) {
            if (this.options.showHintOnFocus === 'all') {
                this.lookup('');
            } else {
                this.lookup();
            }
        }
    }
    if (this.skipShowHintOnFocus) {
        this.skipShowHintOnFocus = false;
    }
    },

    blur: function (e) {
      this.focused = false;
      if (!this.mousedover && this.shown) {
        this.hide();
      }
    },

    click: function (e) {
      e.preventDefault();
      if(!!this.dataFound) {
        var clicked = (e.target && e.target.nodeName==="LI") ? e.target : $(e.target).parentsUntil(this.$menu,"li")[0];
        if (clicked) {
          this.currentHighlighter(this.$menu.find('.binf-active'));
          this.$menu.find('.binf-active').removeClass('binf-active');
          $(clicked).addClass('binf-active');
          this.nextHighlighter(this.$menu.find('.binf-active'));
        }
        this.skipShowHintOnFocus = true;
        this.select();
       this.$element[0].focus();
      } else {
        this.hide();
      }
    },

    mouseenter: function (e) {
      this.mousedover = true;
      if (this.scrollByKey) {
        // skip, if mouseenter is generated by a keyboard scroll.
        delete this.scrollByKey;
      } else {
        this.currentHighlighter(this.$menu.find('.binf-active'));
        this.$menu.find('.binf-active').removeClass('binf-active');
        $(e.currentTarget).addClass('binf-active');
        this.nextHighlighter(this.$menu.find('.binf-active'));
      }
    },

    mouseleave: function (e) {
      this.mousedover = false;
      if (!this.focused && this.shown) {
        this.hide();
      }
    },

    /**
     * scroll item into viewable area. if event is passed scroll is handled as triggered by keyboard.
     *
     * @param {*} item (mandatory) item to scroll into view
     * @param {*} keyEvent (optional) event used as marker to handle this scroll as triggered by keyboard
     */
    scrollIntoView: function (item,keyEvent) {
      var currentItem         = this.$menu.find(item),
          parentScrollElement = this.$scrollContainer,
          currentItemHeight   = currentItem.outerHeight(true),
          offSetVariation     = outerTop(currentItem) - innerTop(parentScrollElement),
          menuScrollTop       = parentScrollElement.scrollTop(),
          menuScrollHeight    = parentScrollElement.height();

      if (keyEvent) {
        var scrollByKey = this.scrollByKey = { keyEvent: keyEvent };
        setTimeout(function(){
          if (this.scrollByKey && this.scrollByKey===scrollByKey) {
            // autodelete keyEvent after timeout, to ensure clean-up, if mouseenter event is not triggered.
            delete this.scrollByKey;
          }
        }.bind(this),30);
      }

      // scroll more than needed to get some space between last item and bottom
      var nextItem = currentItem.next('li:not(.typeahead-force-scrollbar)');
      var offset = nextItem.length===0 ? 0 : scrollMoreY(nextItem.height(),nextItem.outerHeight(true));
      if (offSetVariation < 0) {
        parentScrollElement.scrollTop(menuScrollTop + offSetVariation);
      } else if (offSetVariation + currentItemHeight + offset > menuScrollHeight) {
        parentScrollElement.scrollTop(
            menuScrollTop + offSetVariation + offset + currentItemHeight - menuScrollHeight
        );
      }
    }

  };

  function topPos(menuItems,index) {
    var item = $(menuItems[index]);
    var top = outerBottom(item) - scrollMoreY(item.height(),item.outerHeight(true));
    return top;
  }

  function bottomPos(menuItems,index) {
    var item = $(menuItems[index]);
    var bottom = outerBottom(item);
    if (index+1<menuItems.length) {
      item = $(menuItems[index+1]);
      bottom += scrollMoreY(item.height(),item.outerHeight(true));
    }
    return bottom;
  }

  function scrollMoreY(innerHeight,outerHeight) {
    return Math.min(Math.max(2*innerHeight-outerHeight,0.4*outerHeight),32);
  }

  function minSpaceY(item) {
    var height = cssnumber(item,"font-size");
    var outerHeight = height + item.outerHeight(true) - item.height();
    return outerHeight + scrollMoreY(height,outerHeight);
  }

  function contentHeight() {
    var sum;
    if (this.$scrollContainer[0]===this.$menu[0]) {
      sum = 0;
      this.$menu.find("li:not(.typeahead-force-scrollbar)").each(function (ix,el) {
        sum += $(el).outerHeight(true);
      });
    } else {
      sum = this.$menu.outerHeight(true) - (this.$menu.find("li.typeahead-force-scrollbar").outerHeight(true)||0);
    }
    return sum;
  }

  function cssnumber(el,name) {
    return parseFloat(el.css(name).replace('px',''))||0;
  }

  function innerTop(item) {
    return item.offset().top + cssnumber(item,"border-top-width") + cssnumber(item,"padding-top");
  }

  function outerTop(item) {
    return item.offset().top - cssnumber(item,"margin-top");
  }

  function outerBottom(item) {
    return outerTop(item) + item.outerHeight(true);
  }

  function fetchMore(callback,context) {
    if ($.isFunction(this.source)) {
      this.source(this.query,$.proxy(process, this, context),{more:true}).then(function (items) {
        process.call(this,context,items);
      }.bind(this));
    } else if (this.source) {
      process.call(this,context,this.source);
    }
    function process(context,items) {
      this.processMore = true;
      this.process(items);
      delete this.processMore;
      callback && callback.call(this,context);
    }
  }

  function selectScrollFetch(item,event) {
    var active = this.$menu.find('.binf-active');
    active.removeClass('binf-active');
    this.currentHighlighter(active);
    this.accessibility && this.accessibility(item);
    item.addClass('binf-active');
    this.scrollIntoView(item[0],event);
    this.nextHighlighter(item);
    var next = item.next('li:not(.typeahead-force-scrollbar)');
    if (next.length===0) {
      if (this.options.showMore && this.options.showMore()) {
        var index = this.$menu.find("li:not(.typeahead-force-scrollbar)").index(item);
        fetchMore.call(this,function(index){
          selectScrollFetch.call(this,$(this.$menu.find("li:not(.typeahead-force-scrollbar)")[index]),event);
        },index);
      }
    }
  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.typeahead;

  $.fn.typeahead = function (option) {
    var arg = arguments;
    if (typeof option == 'string' && option == 'getActive') {
      return this.data('active');
    }
    return this.each(function () {
      var $this     = $(this)
          , data    = $this.data('typeahead')
          , options = typeof option == 'object' && option;
      if (!data) {
        $this.data('typeahead', (data = new Typeahead(this, options)));
      }
      if (typeof option == 'string') {
        if (arg.length > 1) {
          data[option].apply(data, Array.prototype.slice.call(arg, 1));
        } else {
          data[option]();
        }
      }
    });
  };

  $.fn.typeahead.defaults = {
    source: []
    , items: 8
    , menu: '<ul class="typeahead binf-dropdown-menu" role="listbox" id="user-picker-ul"></ul>'
    , item: '<li role="option"><a href="#"></a></li>'
    , minLength: 1
    , scrollHeight: 0
    , autoSelect: true
    , afterSelect: $.noop
    , currentHighlighter: $.noop
    , nextHighlighter: $.noop
    , addItem: false
    , delay: 0
    // implement perfect-scrollbar support
    , prettyScrolling: false
    , scrollContainer: '<div class="typeahead scroll-container csui-normal-scrolling csui-no-scroll-x"></div>'
    , scrollContainerHeight: 320
    , rollOver: true
  };

  $.fn.typeahead.Constructor = Typeahead;

  /* TYPEAHEAD NO CONFLICT
   * =================== */

  $.fn.typeahead.noConflict = function () {
    $.fn.typeahead = old;
    return this;
  };

  /* TYPEAHEAD DATA-API
   * ================== */

  $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
    var $this = $(this);
    if ($this.data('typeahead')) {
      return;
    }
    $this.typeahead($this.data());
  });

});
