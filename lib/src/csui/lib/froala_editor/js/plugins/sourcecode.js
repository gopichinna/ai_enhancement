define(["csui/lib/froala_editor/js/froala_editor.pkgd.min",
"csui/controls/source.dialog/source.dialog.view",
'i18n!csui/widgets/html.editor/impl/nls/lang',
'css!csui/lib/froala_editor/css/plugins/source.dialog'
], function (
  FroalaEditor, SourceDialogView, lang
) {
  "use strict";

  FroalaEditor.DefineIcon("codeView", {
    NAME: "codeView",
    SVG_KEY:"codeView"
  });

  FroalaEditor.RegisterCommand("codeCustomView", {
    title: lang.openCodeView,
    icon: "codeView",

    callback: function () {
        let content = this.html.get(false, true);
        content = (this.codeBeautifier && !content.includes("fr-embedly") && this.codeBeautifier.run(content, this.opts.codeBeautifierOptions)) || content;

        //send the appropriate options to the dialogView
        const options = {data: content, largeSize: true};
        var dialogView = new SourceDialogView(options);
        dialogView.show();

        this.$tb.hide();
        this.$sc.find('.csui-html-editor-action-buttons').hide();
        
        dialogView.on("toggle:content", function (params) {
            this.html.set(params.data);
            params.enableSaveButton && this.opts.externalParams.enableSaveButton();
        }.bind(this));

        dialogView.on('show:froala-toolbar', function() {
            this.$tb.show();
            this.$sc.find('.csui-html-editor-action-buttons').show();
            this.el.focus();
        }.bind(this));
    }
  });
});