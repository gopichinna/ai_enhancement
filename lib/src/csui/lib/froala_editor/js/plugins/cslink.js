define([
  'csui/lib/jquery',
  'csui/lib/froala_editor/js/froala_editor.pkgd.min',
  'i18n!csui/widgets/html.editor/impl/nls/lang',
], function ($, FroalaEditor, lang) {
  'use strict';

  FroalaEditor.DefineIconTemplate(
    'cslink',
    '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M13,10H11l-1,1L9,10H7a3,3,0,0,0,0,6H9l1-1,1,1h2a3,3,0,0,0,0-6ZM7,15a2,2,0,0,1,0-4H9v1H7a1,1,0,0,0,0,2H9v1Zm5.5-2.5a.5.5,0,0,1,0,1h-5a.5.5,0,0,1,0-1ZM13,15H11V14h2a1,1,0,0,0,0-2H11V11h2a2,2,0,0,1,0,4Z"/><path d="M7,5.435A1.465,1.465,0,1,0,8.465,6.9h0A1.466,1.466,0,0,0,7,5.435Z"/><path d="M10.237,2.09a1.8,1.8,0,0,0,.028-.273,1.816,1.816,0,0,0-3.483-.722,5.83,5.83,0,0,0-5.62,5.392A1.815,1.815,0,0,0,1.817,10a1.783,1.783,0,0,0,.194-.02,5.861,5.861,0,0,0,.835,1.063c.1.1.208.2.317.291a4.251,4.251,0,0,1,.205-.408l.059-.1a4.227,4.227,0,0,1,.3-.431,4.851,4.851,0,0,1-.718-.857,1.8,1.8,0,0,0-.768-3.12A4.685,4.685,0,0,1,6.666,2.171a1.811,1.811,0,0,0,3.1.894,4.766,4.766,0,0,1,1.982,3.851A4.625,4.625,0,0,1,11.335,8.8h1.143a5.786,5.786,0,0,0-2.24-6.709Z"/></svg>'
  );

  FroalaEditor.DefineIcon('cslink', {
    NAME: 'cslink',
    template: 'cslink',
  });

  FroalaEditor.RegisterCommand('cslink', {
    title: lang.insertContentServerLink,
    icon: 'cslink',
    undo: true,
    focus: true,
    showOnMobile: true,
    callback: function () {
      const editor = this;
      editor.toolbar.disable();
      let selectedText;
      if (!editor.selection.isCollapsed()) {
        selectedText = editor.selection.get();
      }
      editor.selection.save();
      editor.$tb.hide();
      $('.froala-save-cancel').hide();
      editor.opts.csLink.nodePicker().show()
        .done(function (args) {
          const node = args.nodes[0],
            url =
              !!editor.opts.csLink.getUrl &&
              typeof editor.opts.csLink.getUrl === 'function'
                ? editor.opts.csLink.getUrl(node)
                : editor.opts.csLink.nodeLink.getUrl(args.nodes[0]);
          if (
            typeof editor.opts.externalParams.enableSaveButton === 'function'
          ) {
            editor.opts.externalParams.enableSaveButton();
          }
          editor.selection.restore();
          if (selectedText) {
            editor.format.apply('a', { href: url }, editor.selection.text());
          } else {
            editor.link.insert(url, node.get('name'));
          }
        })
        .fail(function (args) {
          //TODO handle fail case
        })
        .always(function (args) {
          editor.$tb.show();
          $('.froala-save-cancel').show();
          editor.toolbar.enable();
        });
    },
  });
});
