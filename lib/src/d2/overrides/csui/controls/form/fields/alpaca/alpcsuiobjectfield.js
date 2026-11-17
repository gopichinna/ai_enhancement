/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuiobjectfield", "nuc/utils/base", "i18n!csui/controls/form/impl/nls/lang", "i18n" ], function(_, $, Alpaca, CsuiObjectField, base, lang, i18n) {
  var prototype = CsuiObjectField.prototype;
  var originalPostRender = prototype.postRender, origRestructureAllSetContainer = prototype.restructureAllSetContainer;
  prototype.postRender = function() {
    originalPostRender.apply(this, arguments);
    if (this.parent && this.parent.schema._d2Containertype === "d2grid") {
      if (this.parent.containerItemEl) {
        this.parent.containerItemEl.trigger("d2:refresh:setcontainer");
      }
    }
  };
  prototype.showColout = function(e) {
    var popover = $(e.target).data("binf.popover");
    if (popover) {
      var targetElParent = $(e.target).parents(".cs-form-set-container"), scrollableContainer = targetElParent.closest(".ps-container").length > 0 ? targetElParent.closest(".ps-container") : targetElParent.closest(".csui-normal-scrolling");
      e.preventDefault();
      $(e.target).binf_popover("destroy");
      if (base.isTouchBrowser()) {
        scrollableContainer.css({
          "-webkit-overflow-scrolling": "touch"
        });
      }
    } else {
      var dataId = e.target.getAttribute("data-csui-name"), rowIndex = $(e.target).closest(".cs-array.alpaca-container-item").attr("data-alpaca-container-item-index"), selectedId = e.data.data[dataId] ? dataId : dataId.substr(0, dataId.lastIndexOf("_"));
      var child = findChild(e.data, selectedId);
      var data = $.extend(true, [], child.data[rowIndex]), options = $.extend(true, [], child.options.fields.item), schema = $.extend(true, [], child.schema.items);
      e.target.setAttribute("data-csui-row-index", rowIndex);
      _.each(options.fields, function(item) {
        if (!item.readonly) {
          item.readonly = true;
        }
        if (item.isMultiFieldItem) {
          delete item["isMultiFieldItem"];
        }
      });
      _.each(schema.properties, function(item) {
        if (!item.readonly) {
          item.readonly = true;
        }
      });
      var coloutOptions = {
        targetEl: $(e.target),
        coloutContainer: $(e.target).parents(".cs-form-set-container"),
        formdata: data,
        formoptions: {
          fields: options.fields
        },
        formschema: {
          properties: schema.properties
        }
      };
      var coloutEve = $.Event("show:colout");
      _.extend(coloutEve, coloutOptions);
      e.data.domEl.trigger(coloutEve);
      return false;
    }
  };
  function findChild(control, selectedId) {
    var result = _.find(control.children, function(child) {
      if (child.name === selectedId) {
        return child;
      }
    }, this);
    if (_.isUndefined(result)) {
      _.some(control.children, function(child) {
        result = findChild(child, selectedId);
        return result;
      }, this);
    }
    if (result) {
      return result;
    }
  }
  prototype._onFieldChanged = function(event) {
    if (!this.containerItemEl) {
      return;
    }
    var el = this.containerItemEl.parent();
    event.stopPropagation();
    var fieldId = event.fieldpath.split("/").pop();
    this.data[fieldId] = event.fieldvalue;
    var data = {
      fieldvalue: this.data,
      fieldid: this.name,
      fieldpath: this.path,
      targetfieldvalue: event.targetfieldvalue !== undefined ? event.targetfieldvalue : event.fieldvalue,
      targetfieldid: event.targetfieldid ? event.targetfieldid : event.fieldid,
      targetfieldpath: event.targetfieldpath ? event.targetfieldpath : event.fieldpath,
      changedFieldId: fieldId
    };
    var newEvent = $.Event("field:changed");
    _.extend(newEvent, data);
    el.trigger(newEvent);
  };
  prototype.resolvePropertySchemaOptions = function(propertyId, callback) {
    var _this = this;
    var completionFunction = function(resolvedPropertySchema, resolvedPropertyOptions, circular) {
      if (_this.options.readonly) {
        resolvedPropertyOptions.readonly = true;
      }
      callback(resolvedPropertySchema, resolvedPropertyOptions, circular);
    };
    var propertyOptions = {};
    if (_this.options && _this.options.fields && _this.options.fields[propertyId]) {
      propertyOptions = _this.options.fields[propertyId];
      if (propertyOptions.isGridField) {
        propertyOptions = _.clone(propertyOptions);
      }
    }
    var propertySchema = null;
    if (_this.schema && _this.schema.properties && _this.schema.properties[propertyId]) {
      propertySchema = _this.schema.properties[propertyId];
      if (propertyOptions.isGridField) {
        propertySchema = _.clone(propertySchema);
      }
    }
    if (propertySchema && propertySchema["$ref"]) {
      var referenceId = propertySchema["$ref"];
      var topField = this;
      var fieldChain = [ topField ];
      while (topField.parent) {
        topField = topField.parent;
        fieldChain.push(topField);
      }
      var originalPropertySchema = propertySchema;
      var originalPropertyOptions = propertyOptions;
      Alpaca.loadRefSchemaOptions(topField, referenceId, function(propertySchema, propertyOptions) {
        var refCount = 0;
        for (var i = 0; i < fieldChain.length; i++) {
          if (fieldChain[i].schema) {
            if (fieldChain[i].schema.id === referenceId || fieldChain[i].schema.id === "#" + referenceId) {
              refCount++;
            } else if (fieldChain[i].schema["$ref"] === referenceId) {
              refCount++;
            }
          }
        }
        var circular = refCount > 1;
        var resolvedPropertySchema = {};
        if (originalPropertySchema) {
          Alpaca.mergeObject(resolvedPropertySchema, originalPropertySchema);
        }
        if (propertySchema) {
          Alpaca.mergeObject(resolvedPropertySchema, propertySchema);
        }
        if (originalPropertySchema && originalPropertySchema.id) {
          resolvedPropertySchema.id = originalPropertySchema.id;
        }
        var resolvedPropertyOptions = {};
        if (originalPropertyOptions) {
          Alpaca.mergeObject(resolvedPropertyOptions, originalPropertyOptions);
        }
        if (propertyOptions) {
          Alpaca.mergeObject(resolvedPropertyOptions, propertyOptions);
        }
        Alpaca.nextTick(function() {
          completionFunction(resolvedPropertySchema, resolvedPropertyOptions, circular);
        });
      });
    } else {
      Alpaca.nextTick(function() {
        completionFunction(propertySchema, propertyOptions);
      });
    }
  };
  prototype.refreshValidationState = function(validateChildren, cb) {
    var self = this;
    var contexts = [];
    var functions = [];
    const contextLookupMap = {};
    const BATCH_SIZE = 50;
    let validationChildList = [];
    if (validateChildren) {
      var crawl = function(field, contexts) {
        if (field.isValidationParticipant()) {
          if (field.children && field.children.length > 0) {
            for (var i = 0; i < field.children.length; i++) {
              crawl(field.children[i], contexts);
            }
          }
          validationChildList.push(field);
        }
      };
      crawl(this, contexts);
    }
    validationChildList.push(this);
    function batchedValidationBuilder(validationList) {
      let batchedFunctions = [];
      while (validationList.length) {
        let items = validationList.splice(0, BATCH_SIZE);
        let fn = onComplete => {
          if (!items.length) {
            onComplete();
          } else {
            Alpaca.nextTick(function() {
              function validationProcessor(field) {
                Alpaca.compileValidationContext(field, function(context) {
                  contexts.push(context);
                  if (!items.length) {
                    onComplete();
                  } else {
                    validationProcessor(items.splice(0, 1).at(0));
                  }
                }, contextLookupMap);
              }
              validationProcessor(items.splice(0, 1).at(0));
            });
          }
        };
        batchedFunctions.push(fn);
      }
      return batchedFunctions;
    }
    functions = batchedValidationBuilder(validationChildList);
    Alpaca.series(functions, function() {
      var mergedMap = {};
      var mergedContext = [];
      for (var i = 0; i < contexts.length; i++) {
        var context = contexts[i];
        var mIndex = mergedContext.length;
        for (var j = 0; j < context.length; j++) {
          var entry = context[j];
          var existing = mergedMap[entry.id];
          if (!existing) {
            var newEntry = {};
            newEntry.id = entry.id;
            newEntry.path = entry.path;
            newEntry.domEl = entry.domEl;
            newEntry.field = entry.field;
            newEntry.validated = entry.validated;
            newEntry.invalidated = entry.invalidated;
            newEntry.valid = entry.valid;
            mergedContext.splice(mIndex, 0, newEntry);
            mergedMap[newEntry.id] = newEntry;
          } else {
            if (entry.validated && !existing.invalidated) {
              existing.validated = true;
              existing.invalidated = false;
              existing.valid = entry.valid;
            }
            if (entry.invalidated) {
              existing.invalidated = true;
              existing.validated = false;
              existing.valid = entry.valid;
            }
          }
        }
      }
      mergedContext.reverse();
      if (!self.hideInitValidationError) {
        Alpaca.updateValidationStateForContext(self.view, mergedContext);
      }
      if (cb) {
        cb();
      }
    });
  };
  prototype.restructureSetContainer = function(setEl, self, addItemIndex) {
    if (_.findIndex(self.children, child => child.getFieldType() === "array") === -1) {
      return;
    }
    var showScrollBar = false, setOptions;
    function checkPadding(setElement) {
      if (!paddingCheckInterval) {
        scrollDivPadding = isUpdateMode ? $(setElement).find(".csui-lockedcols").width() : $(setElement).find(".csui-lockedcols:first").width();
      }
      if (scrollDivPadding > 0) {
        $(setElement).addClass("csui-native-scrollbar");
        if (paddingCheckInterval) {
          clearInterval(paddingCheckInterval);
        }
      } else {
        scrollDivPadding = isUpdateMode ? $(setElement).find(".csui-lockedcols").width() : $(setElement).find(".csui-lockedcols:first").width();
      }
    }
    function hidePopover() {
      $(".csui-colout-icon").each(function() {
        if ($(this).data("binf.popover")) {
          $(this).binf_popover("destroy");
        }
      });
    }
    function getSetOptions(fields, uniqueId) {
      _.each(fields, function(value, id) {
        if (!setOptions) {
          if (id === uniqueId) {
            setOptions = value;
          } else if (value instanceof Object) {
            if (value.fields && value.fields.item && value.fields.item.fields) {
              getSetOptions(value.fields.item.fields, uniqueId);
            } else {
              getSetOptions(value, uniqueId);
            }
          }
        }
      });
    }
    function removeWraps(isWriteOnlyMode, allChild) {
      (isWriteOnlyMode ? allChild.parent().parent() : allChild.parent()).find(".csui-show-colout").remove();
      allChild.closest(".cs-form-set-container").find(".binf-popover").remove();
      $(this).parent().parent(".alpaca-field-array").removeClass("csui-set-locked-container");
      $(this).parents(".alpaca-field-array").removeClass("csui-container-lockedcols");
      if ($(this).find(".csui-lockedcols").length > 0) {
        $(setEl).find(".csui-set-scroll-container-parent").remove();
        $(this).find(".csui-lockedcols").children().unwrap();
        $(this).find(".csui-scrollablecols").children().unwrap();
        $(this).find(".csui-shadowright-container").remove();
        $(this).find(".csui-shadowleft-container").remove();
      }
    }
    $(setEl).find(".alpaca-container-item-last .csui-scrollablecols").addClass("csui-normal-scrolling");
    var extraWidth = 0;
    var setElForm = $(setEl).closest(".binf-tab-content .cs-form").length > 0 ? $(setEl).closest(".binf-tab-content .cs-form") : $(setEl).closest(".cs-form.cs-form-update") !== undefined && $(setEl).closest(".cs-form.cs-form-update").length > 0 ? $(setEl).closest(".cs-form.cs-form-update") : $(setEl).closest(".cs-form.cs-form-create");
    if (setElForm !== undefined && setElForm.length > 0) {
      var setElFormParent = setElForm.parent();
      if (setElFormParent !== undefined && setElFormParent.length > 0) {
        var rightPadding = setElFormParent.css("padding-right");
        var rightPaddingWidth = parseInt(rightPadding !== undefined ? rightPadding : 0);
        var leftPadding = setElFormParent.css("padding-left");
        var leftPaddingWidth = parseInt(leftPadding !== undefined ? leftPadding : 0);
        extraWidth = rightPaddingWidth + leftPaddingWidth;
        const scrollContainer = setElForm.closest(".binf-tab-content.csui-normal-scrolling");
        if (scrollContainer.length > 0) {
          extraWidth += scrollContainer[0].offsetWidth - scrollContainer[0].clientWidth;
        } else {
          extraWidth += 30;
        }
        extraWidth += parseInt($(setEl).css("margin-left") || 0);
        extraWidth += parseInt($(setEl).css("margin-right") || 0);
      }
    }
    var shadowRightContainer = $("<div/>", {
      class: "csui-shadowright-container"
    });
    var shadowLeftContainer = $("<div/>", {
      class: "csui-shadowleft-container"
    });
    var setUniqueId = $(setEl).attr("data-alpaca-container-item-name");
    setUniqueId && getSetOptions(self.options.fields, setUniqueId);
    var rows_to_display = setOptions && setOptions.rows_to_display, showExpanded = setOptions && setOptions.showExpanded;
    const $rows = $(setEl).children(":not('.binf-popover'):not('.csui-set-scroll-container-parent'):not('d2-custom-helper')"), currentStruct = $rows.first().find(".alpaca-container-item:not(.cs-form-multi-action-container)").map(function() {
      return $(this.children).hasClass("binf-hidden") ? 0 : 1;
    }).toArray(), prevStruct = $(setEl).data("data-d2-prev-set-structure"), hasStructureChange = !_.isEqual(prevStruct, currentStruct);
    $(setEl).data("data-d2-prev-set-structure", currentStruct);
    let _tabContentWidth = null, _showScrollbar = null, _elementsWidth = null;
    $rows.each(function(index, rowEl) {
      $(this).find(".csui-current-focused").trigger("focus");
      var $rowEl = $(rowEl), lockedColumns = [], scrollableColumns = [], allChildwithoutCalout = $rowEl.find(".alpaca-container-item:not(.cs-form-multi-action-container)"), allChild = allChildwithoutCalout.filter(function() {
        return !$(this.children).hasClass("binf-hidden");
      }), uniqueId = $rowEl.closest(".cs-form-set>.alpaca-container-item").attr("data-alpaca-container-item-name"), isWriteOnlyMode = $rowEl.find(".cs-field-read").hasClass("binf-hidden"), writemodeClass = !isWriteOnlyMode ? "" : " binf-hidden", actualContainerWidth, showScrollbarForElements = false, popoutParent = $("<div/>", {
        class: "csui-show-colout" + writemodeClass
      }), popoutIconContainerFirstRow = $("<div/>", {
        class: "csui-icon-container"
      }), popoutIconContainer = $("<div/>", {
        class: "csui-icon-container"
      }), popoutIcon = $("<span/>", {
        tabindex: 0,
        "data-csui-name": uniqueId,
        "data-csui-row-index": index,
        "data-toggle": "popover",
        role: "link",
        title: lang.titleColoutButton,
        "aria-label": lang.titleColoutButton,
        class: "csui-button-icon icon-toolbar-more csui-colout-icon" + " csui-show-colout-" + uniqueId + "_" + index
      });
      var elementsWidth = 0, numberOfChildren = allChild.length;
      if (_tabContentWidth === null) {
        _tabContentWidth = $rowEl.width() === 0 ? $rowEl.closest(".d2-set-container").length > 0 ? $rowEl.closest(".d2-set-container").width() <= 100 ? $rowEl.closest(".d2-set-container").parents(".cs-dialog").width() : $rowEl.closest(".d2-set-container").width() : $rowEl.closest(".form-metadata").width() : $rowEl.width() <= 100 ? $rowEl.parents(".metadata-inner-wrapper").length > 0 ? $rowEl.parents(".metadata-inner-wrapper").width() : $rowEl.parents(".cs-dialog").width() : $rowEl.width();
      }
      var tabcontentWidth = _tabContentWidth;
      if (numberOfChildren < 3) {
        $rowEl.closest(".alpaca-field-array").addClass("cs-single-field");
      } else {
        $(rowEl).closest(".alpaca-field-array").removeClass("cs-single-field");
      }
      if (numberOfChildren === $rowEl.find(".csui-field-checkbox").length) {
        $rowEl.closest(".alpaca-field-array").addClass("cs-adjust-Checkbox-width");
      } else {
        $rowEl.closest(".alpaca-field-array").removeClass("cs-adjust-Checkbox-width");
      }
      if (_elementsWidth === null) {
        elementsWidth = 0;
        for (var i = 0; i < allChild.length; i++) {
          var elementWidth = parseFloat($($rowEl.find(".alpaca-container-item")[i]).css("width"));
          elementsWidth += elementWidth;
        }
        elementsWidth = Math.floor(elementsWidth);
        _elementsWidth = elementsWidth;
      }
      elementsWidth = _elementsWidth;
      if (elementsWidth < tabcontentWidth / 2 && !$rowEl.closest(".alpaca-field-array").hasClass("cs-adjust-width")) {
        $rowEl.closest(".alpaca-field-array").addClass("cs-adjust-width");
      } else {
        $rowEl.closest(".alpaca-field-array").removeClass("cs-adjust-width");
      }
      self.uniqueId = uniqueId;
      if (allChild && allChild.length > 0) {
        if (_showScrollbar === null) {
          if (!$rowEl.is(":visible")) {
            if ($rowEl.closest(".cs-formview-wrapper").length) {
              var setbacks = 5;
              actualContainerWidth = Math.floor($rowEl.closest(".cs-formview-wrapper").width() - extraWidth + setbacks);
            } else {
              actualContainerWidth = Math.floor(($rowEl.closest(".d2-set-container").length > 0 ? $rowEl.closest(".d2-set-container").width() <= 100 ? $rowEl.closest(".d2-set-container").parents(".cs-dialog").width() : $rowEl.closest(".d2-set-container").width() : $rowEl.closest(".form-metadata").width()) - extraWidth);
            }
            if (actualContainerWidth < elementsWidth) {
              showScrollbarForElements = true;
            }
            _showScrollbar = showScrollbarForElements;
          } else {
            if ($rowEl.closest(".cs-form-set-container").length) {
              let availableWidth = $rowEl.closest(".csui-field-array.d2-resizable-array-field").width(), sc = $rowEl.closest(".cs-form-set-container"), margins = (parseInt(sc.css("margin-left")) || 0) + (parseInt(sc.css("margin-right")) || 0);
              showScrollbarForElements = elementsWidth > availableWidth - margins;
            }
            if (showScrollbarForElements) {
              if ($($rowEl.find(".alpaca-container-item")[0]).hasClass("d2-default-size-col")) {
                let firstColWidth = parseInt($($rowEl.find(".alpaca-container-item")[0]).css("width"));
                if (actualContainerWidth - elementsWidth + firstColWidth > 266) {
                  showScrollbarForElements = false;
                }
              }
            }
            _showScrollbar = showScrollbarForElements;
          }
        }
        showScrollbarForElements = _showScrollbar;
        if (!isWriteOnlyMode && rows_to_display && index > rows_to_display - 1) {
          $rowEl.addClass("set-row-hidden");
          showExpanded ? $rowEl.addClass("set-row-show") : "";
        }
        if (showScrollbarForElements) {
          hasStructureChange && removeWraps.call(this, isWriteOnlyMode, allChild);
          if (allChild.parent().find(".csui-show-colout").length === 0 && allChild.length >= 2) {
            if (index === 0) {
              $(popoutParent).append(popoutIconContainerFirstRow);
              $(popoutIconContainerFirstRow).append(popoutIcon);
            } else {
              $(popoutParent).append(popoutIconContainer);
              $(popoutIconContainer).append(popoutIcon);
            }
            showScrollBar = true;
            if (isWriteOnlyMode) {
              popoutParent.addClass("binf-hidden");
            }
            if (allChild.parent(".csui-lockedcols").length === 0) {
              allChild.parent().prepend(popoutParent);
            }
            $(rowEl).find(".csui-show-colout-" + uniqueId + "_" + index).off("click keydown").on({
              click: _.bind(self.showColout, self),
              keydown: _.bind(self.keyDown, self)
            }, self);
            var allChildwithCalout = allChild.parent().children();
            var ind = _.findIndex(allChildwithoutCalout, function(el) {
              return !$(el.children).hasClass("binf-hidden");
            });
            lockedColumns = isWriteOnlyMode ? allChildwithoutCalout.splice(0, ind + 1) : allChildwithCalout.splice(0, ind + 2);
            scrollableColumns = isWriteOnlyMode ? allChildwithoutCalout : allChildwithCalout;
            if ($(lockedColumns).parent(".csui-lockedcols").length === 0) {
              if (allChild.parent(".csui-lockedcols").length === 0) {
                var lockedColumnsParent = $("<div/>", {
                  id: _.uniqueId("lockedcols"),
                  class: "csui-lockedcols csui-colout-visible"
                });
                $(lockedColumns).wrapAll(lockedColumnsParent);
              }
              $(this).parent().parent(".alpaca-field-array").addClass("csui-set-locked-container");
              if (scrollableColumns.parent(".csui-scrollablecols").length === 0) {
                var scrollableColumnsParent = $("<div/>", {
                  id: _.uniqueId("scrollablecols"),
                  class: "csui-scrollablecols csui-scrollable-" + uniqueId
                });
                $(scrollableColumns).wrapAll(scrollableColumnsParent);
              }
              $(this).parents(".alpaca-field-array").addClass("csui-container-lockedcols");
              if (index > 0) {
                if (!(i18n && i18n.settings.rtl)) {
                  $(setEl).find(".csui-scrollablecols").scrollLeft(0);
                  $(setEl).find(".csui-set-scroll-container-child").scrollLeft(0);
                }
              }
              if (isWriteOnlyMode) {
                $(setEl).find(".csui-scrollablecols").addClass("csui-scrollable-writemode");
                $(setEl).find(".csui-lockedcols").addClass("csui-lockedWriteMode");
                $(this).parents(".cs-form-set-container").children().find(".csui-scrollablecols").prop("scrollLeft", 0);
              }
            }
            var lockedColumnFieldClass;
            if (isWriteOnlyMode) {
              lockedColumnFieldClass = lockedColumns[0].classList[0];
            } else {
              lockedColumnFieldClass = lockedColumns[1].classList[0];
            }
            $(setEl).find(".csui-lockedcols").addClass(lockedColumnFieldClass + "-lockedcolumn");
          } else if (allChild.parent().find(".csui-show-colout.binf-hidden").length > 0) {
            showScrollBar = true;
          }
        } else {
          removeWraps.call(this, isWriteOnlyMode, allChild);
          return;
        }
      }
      if (i18n && i18n.settings.rtl) {
        var scrollChild = $(setEl).find(".csui-set-scroll-container-child");
        scrollChild.scrollLeft(scrollChild.scrollLeft() - 1);
        scrollChild.scrollLeft(scrollChild.scrollLeft() + 1);
      }
      $(setEl).on({
        mouseenter: function() {
          if (!$(this).hasClass("csui-hoveredScrollable")) {
            $(this).addClass("csui-hoveredScrollable");
          }
        },
        mouseleave: function() {
          if ($(this).hasClass("csui-hoveredScrollable")) {
            $(this).removeClass("csui-hoveredScrollable");
          }
        }
      });
      if (index === addItemIndex && $($(setEl).find(".csui-lockedcols")[addItemIndex]).find(".csui-shadowleft-container").length === 0) {
        $($(setEl).find(".csui-lockedcols")[addItemIndex]).append(shadowLeftContainer);
      }
      if (index === addItemIndex && $($(setEl).find(".csui-scrollablecols")[addItemIndex]).closest(".cs-array").find(".csui-shadowright-container").length === 0) {
        $($(setEl).find(".csui-scrollablecols")[addItemIndex]).closest(".cs-array").append(shadowRightContainer);
      }
    }, self, $);
    if (showScrollBar) {
      if (base.isTouchBrowser()) {
        $(setEl).addClass("is-touch");
        $(setEl).find(".csui-scrollable-" + self.uniqueId).scroll(function() {
          if ($(".csui-colout-formitems").is(":visible")) {
            hidePopover();
          }
          $(this).parents(".cs-form-set-container").children().find(".csui-scrollablecols").prop("scrollLeft", $(this).scrollLeft());
          if ($(this).parents(".cs-form-set-container").children().find(".csui-scrollablecols").hasClass("csui-dropdown-open")) {
            $(this).parents(".cs-form-set-container").children().find(".csui-scrollablecols").removeClass("csui-dropdown-open");
          }
        });
      }
      $(setEl).children(":not('.binf-popover')").each(function(index, rowEl) {
        $(this).find(".csui-current-focused").trigger("focus");
        var uniqueId = $(rowEl).closest(".cs-form-set>.alpaca-container-item").attr("data-alpaca-container-item-name");
        $(setEl).find(".csui-scrollable-" + uniqueId).on("scroll", function() {
          if ($(".csui-colout-formitems").is(":visible")) {
            hidePopover();
          }
          $(this).parents(".cs-form-set-container").children().find(".csui-scrollablecols").prop("scrollLeft", $(this).scrollLeft());
          $(this).parents(".cs-form-set-container").find(".csui-set-scroll-container-child").prop("scrollLeft", $(this).scrollLeft());
        });
      });
      var shadowLength = $(setEl).find(".csui-scrollablecols").closest(".cs-array").find(".csui-shadowright-container").length, isScrollPresent = $(setEl).find(".csui-set-scroll-container-parent").length !== 0;
      if (shadowLength === 0) {
        if ($(setEl).find(".csui-scrollablecols").closest(".cs-array").find(".csui-shadowright-container").length === 0) {
          $(setEl).find(".csui-scrollablecols").closest(".cs-array").append(shadowRightContainer);
        }
        if ($(setEl).find(".csui-lockedcols").find(".csui-shadowleft-container").length === 0) {
          $(setEl).find(".csui-lockedcols").append(shadowLeftContainer);
        }
        if (!isScrollPresent) {
          var scrollDiv = $("<div/>", {
            class: "csui-set-scroll-container-parent"
          }), childScrollDiv = $("<div/>", {
            class: "csui-set-scroll-container-child"
          }), scrollableContent = $("<div/>", {
            class: "csui-scrollable-content .csui-scrollable-" + self.uniqueId
          }), isUpdateMode = this.connector.config.formView.mode === "update", scrollDivPadding;
          $(childScrollDiv).append(scrollableContent);
          $(scrollDiv).append(childScrollDiv);
          $(setEl).append(scrollDiv);
          $(setEl).find(".csui-scrollablecols").prop("scrollLeft", 0);
          $(setEl).find(".csui-set-scroll-container-child").prop("scrollLeft", 0);
          var that = this;
          that.setEl = setEl;
          if (self.eventType === "resize") {
            checkPadding(setEl);
          } else {
            var paddingCheckInterval = setInterval(function() {
              checkPadding(setEl);
            }, 100);
          }
        }
      }
    }
    var rowList = $(setEl).closest(".cs-form-set.cs-form-set-container").find(">.cs-array.alpaca-container-item"), fieldMode = _.find(self.options.fields, function(val) {
      return val.mode !== "";
    }).mode;
    if (fieldMode !== "create" && rows_to_display && rows_to_display > 0 && rowList.length > rows_to_display) {
      if ($(setEl).closest(".cs-form-set.cs-form-set-container").parent().find(".csui-show-more").length === 0) {
        var showMoreOrLess = $("<div/>", {
          class: "csui-show-more",
          "aria-label": lang.showMoreAria,
          tabindex: 0,
          id: self.uniqueId
        }), showMoreOrLessLabel, showMoreOrLessButton;
        if (showExpanded) {
          $(setEl).closest(".cs-form-set.cs-form-set-container").addClass("set-row-show");
          showMoreOrLessLabel = $("<label/>", {
            class: "csui-set-show-more-label"
          }).text(lang.showLess);
          showMoreOrLessButton = $("<button/>", {
            class: "csui-set-show-more-icon icon-expandArrowUp",
            "aria-label": lang.showLessAria
          });
        } else {
          $(setEl).closest(".cs-form-set.cs-form-set-container").removeClass("set-row-show");
          showMoreOrLessLabel = $("<label/>", {
            class: "csui-set-show-more-label",
            title: lang.showMore
          }).text(lang.showMore);
          showMoreOrLessButton = $("<button/>", {
            class: "csui-set-show-more-icon icon-expandArrowDown",
            "aria-label": lang.showMoreAria,
            title: lang.showMore
          });
        }
        $(showMoreOrLessLabel).appendTo(showMoreOrLess);
        $(showMoreOrLessButton).appendTo(showMoreOrLess);
        $(setEl).closest(".cs-form-set.cs-form-set-container").parent().append(showMoreOrLess);
        if (showExpanded) {
          $(setEl).closest(".cs-form-set.cs-form-set-container").addClass("set-row-show");
        }
        $(showMoreOrLess).off("click").on("click", self, self.showMoreOrLessColumns);
        $(showMoreOrLess).off("keydown").on("keydown", self, function(event) {
          if (event.keyCode === 13 || event.keyCode === 32) {
            self.showMoreOrLessColumns(event);
          }
        });
      }
    }
  };
  prototype.restructureAllSetContainer = function(ev) {
    if (ev.data?.self) {
      let me = ev.data?.self, formView = me?.connector?.config.formView, isSet = me?.field.find(".csui-form-set-array-wrapper.cs-form-set").length > 0 || me?.field.hasClass("csui-form-set-array-wrapper cs-form-set"), isHidden = me.options.hiddenInit || me.options.hiddenByParent || me.options.hiddenBySelf, isFormDestroyed = formView?.isDestroyed || formView?.options.originatingView?.isDestroyed;
      if (!isSet || isHidden || isFormDestroyed) {
        return;
      } else if (!me.field.is(":visible")) {
        setTimeout(() => me.restructureAllSetContainer(ev), 750);
      } else {
        origRestructureAllSetContainer.apply(me, arguments);
      }
    }
  };
});