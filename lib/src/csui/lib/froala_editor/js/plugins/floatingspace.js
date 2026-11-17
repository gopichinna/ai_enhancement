define(['csui/lib/jquery', 'csui/lib/froala_editor/js/froala_editor.pkgd.min','csui/themes/csui.jato.action.icons', 'smart/themes/theming', 'hbs!csui/widgets/html.editor/impl/html.editor.action.buttons',
  'i18n!csui/widgets/html.editor/impl/nls/lang', 'csui/lib/underscore', 'i18n'], function ($, FroalaEditor, jatoActionIcons, theming, htmlEditorButtonsTemplate, lang, _, i18n) {
    "use strict";

    FroalaEditor.PLUGINS.customFloatingspace = function (editor) {
      let editorElement;
      let cachedToolbarWidth;

      function appendActionButtons() {
        const body = $("body"),
          data = {
            'isJATO': theming.isJATOTheme(),
            'saveIconSVG': jatoActionIcons.actionSave,
            'cancelIconSVG': jatoActionIcons.actionEditCancel,
            'saveLabel': lang.saveTitle,
            'cancelLabel': lang.cancelTitle,
            'cancelAria': lang.cancelAria,
            'saveAria': lang.saveAria,
            'isFroala': true
          };
        body.append(htmlEditorButtonsTemplate(data));
        body.find(".csui-html-edit-save, .csui-html-edit-save-jato").on("click", _.bind(function () {
          editor.opts.externalParams.disableSaveButton();
          this.events.trigger('onSave');
        }, editor));

        body.find(".csui-html-edit-cancel, .csui-html-edit-cancel-jato").on("click", _.bind(function () {
          this.events.trigger('cancel');
        }, editor));
      }

      function calculateToolbarWidth(actionButtonsWidth) {
        const viewportWidth = window.innerWidth;
        const editorBox = editor.$box[0].getBoundingClientRect();
        const spaceRight = viewportWidth - editorBox.right;
        const spaceLeft = editorBox.left;
        let maxToolbarWidth = editorBox.width + Math.max(spaceRight, spaceLeft);

        let widthFactor = (maxToolbarWidth - actionButtonsWidth) / maxToolbarWidth;
        if (editorBox.width / viewportWidth > 0.8) {
          widthFactor = 1;
          maxToolbarWidth = Math.min(editorBox.width, maxToolbarWidth);
        }
        return maxToolbarWidth * widthFactor;
      }

      function positionToolbar() {
        const isModalOpen = $('body.binf-modal-open').length !== 0;
        if (isModalOpen) return;

        const toolbar = editor.$tb;
        const actionButtons = $(".csui-html-editor-action-buttons");
        const buttonsWidth = actionButtons.outerWidth();
        const buttonsHeight = actionButtons.outerHeight();
        let toolbarCSS = {};

        if (!editorElement) {
          editorElement = editor.$box.parents().closest(editor.opts.externalParams.widgetSelector)[0];
        }
        let toolbarWidth = cachedToolbarWidth || calculateToolbarWidth(buttonsWidth);

        const editorBox = editorElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const scrollY = document.documentElement.scrollTop;
        let toolbarHeight = toolbar.outerHeight();
        let top;
        let isTopPositioned = false;

        if (editorBox.top > toolbarHeight + buttonsHeight) {
          top = editorBox.top + scrollY - toolbarHeight;
          isTopPositioned = true;
        } else {
          top = editorBox.top + scrollY + editorBox.height;
        }

        const computedStyle = window.getComputedStyle(editorElement);
        const paddingRight = parseFloat(computedStyle.paddingRight);
        let left = editorBox.left;
        let right = viewportWidth - editorBox.right;
        const rtl = i18n.settings.rtl;
        const popupActive = editor.$sc[0].querySelector(".fr-popup.fr-active");

        toolbarCSS.position = 'absolute';
        toolbarCSS.zIndex = popupActive ? 1070 : 1069;
        toolbarCSS.top = `${top}px`;
        toolbarCSS.borderRadius = '1px';
        toolbarCSS.display = 'none';
        toolbarCSS['max-width'] = `${toolbarWidth}px`;
        toolbarCSS.width = 'max-content';
        toolbar.css(toolbarCSS);

        if(!cachedToolbarWidth) {
          toolbarWidth = toolbar.outerWidth();
          cachedToolbarWidth = toolbarWidth;
        }

        if (right < left) {
          left = editorBox.right - toolbarWidth - paddingRight;
        } else if (left === right) {
          left = editorBox.left + (editorBox.width - toolbarWidth) / 2;
        }
        left = Math.max(left, 0);

        if (rtl) {
          toolbarCSS.right = `${Math.max(viewportWidth - left - toolbarWidth, 0)}px`;
          toolbarCSS.left = 'auto';
        } else {
          toolbarCSS.left = `${left}px`;
          toolbarCSS.right = 'auto';
        }
        toolbarCSS.display = 'block';
        toolbar.css(toolbarCSS);

        toolbarHeight = toolbar.outerHeight();

        //Re-calculate the top with updated toolbar height
        if (editorBox.top > toolbarHeight + buttonsHeight) {
          top = editorBox.top + scrollY - toolbarHeight;
          isTopPositioned = true;
        } else {
          top = editorBox.top + scrollY + editorBox.height;
        }

        toolbar.css('top', `${top}px`);

        let actionButtonsTop, actionButtonsLeft;

        function calculateCenteredTopPosition() {
          return top + (toolbarHeight - buttonsHeight) / 2;
        }

        function setActionButtonsPosition(top, left, right) {
          actionButtons.css({
            position: 'absolute',
            'margin-top': '0px',
            width: 'max-content',
            top: `${top}px`,
            left: left !== null ? `${left}px` : 'auto',
            right: right !== null ? `${right}px` : 'auto',
            zIndex: 1069
          });
        }

        if (rtl) {
          if (left - buttonsWidth >= 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = left-buttonsWidth -5;
            if (actionButtonsLeft < 0) {
              actionButtonsLeft = 5;
            }
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else if (viewportWidth - (left + toolbarWidth + buttonsWidth) >= 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = viewportWidth - (left + toolbarWidth + buttonsWidth + 5);
            setActionButtonsPosition(actionButtonsTop, null, actionButtonsLeft);
          } else if (isTopPositioned) {
            actionButtonsTop = top + toolbarHeight - 20;
            toolbar.css('top', `${top - buttonsHeight}px`);
            actionButtonsLeft = viewportWidth - (left + toolbarWidth);
            setActionButtonsPosition(actionButtonsTop, null, actionButtonsLeft);
          } else {
            actionButtonsTop = top + toolbarHeight + 5;
            actionButtonsLeft = viewportWidth - (left + toolbarWidth);
            setActionButtonsPosition(actionButtonsTop, null, actionButtonsLeft);
          }
        } else {
          if (viewportWidth - left >= toolbarWidth + buttonsWidth + 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = left + toolbarWidth + 5;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else if (left >= buttonsWidth + 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = left - buttonsWidth - 5;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else if (!isTopPositioned) {
            actionButtonsTop = top + toolbarHeight + 5;
            actionButtonsLeft = 0;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else {
            toolbar.css('top', `${top - buttonsHeight}px`);
            actionButtonsTop = top + toolbarHeight - 20;
            actionButtonsLeft = left;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          }
        }
      }

      function resetToolbarZIndex() {
        const newZIndex = editor.$tb[0].querySelector(".fr-dropdown.fr-active") || editor.$sc[0].querySelector(".fr-popup.fr-active") && 1070; //increase z-index of toolbar if popup/dropdown is active     
        editor.$tb.css('zIndex', newZIndex || 1069);
      }

      function setToolTipCSS() {
        const toolTip = $('.fr-tooltip');
        if (toolTip.length) {
          toolTip.css({
              right: 'auto'
          });
          editor.$tb.off('mouseenter', '.fr-command');
        }
      }

      function initialize() {
        $('body').append(editor.$tb);
        appendActionButtons();
        positionToolbar();
        const debouncedPositionToolbar = _.debounce(() => {
          cachedToolbarWidth = null;
          positionToolbar();
        }, 110);
        editor.$box.closest('.csui-normal-scrolling').on('scroll wheel', function () {
          editor.popups.hideAll();
        });
        $(window).on('resize.customFloatingspace', debouncedPositionToolbar);
        $(window).on('scroll.customFloatingspace', positionToolbar);
        $('.fr-toolbar').on('mouseenter', '.fr-command', setToolTipCSS);
        $('.fr-dropdown').on('blur click', editor.button.bulkRefresh);
        editor.events.on('buttons.refresh', resetToolbarZIndex);
        editor.events.on('destroy', destroy);
        window.addEventListener('popstate', destroy);
      }

      function destroy() {
        $(window).off('resize.customFloatingspace');
        $(window).off('scroll.customFloatingspace');
        $('.fr-toolbar').remove();
        $(".csui-html-editor-action-buttons").remove();
        $('.csui-rich-text-mask').remove();
        editor.popups.hideAll();
        window.removeEventListener('popstate', destroy);
      }

      return {
        _init: initialize
      };
    };
  });