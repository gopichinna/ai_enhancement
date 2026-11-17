/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  const imagePlugin = {
    _init: function() {
      this.imageInserted = false;
    },
    imageInsertedHandler: function(e, editor, img) {
      this.imageInserted = true;
      editor.dialog.show("imageOptions", {
        height: img.height(),
        width: img.width(),
        alignment: img.align()
      });
    },
    buttons: {
      image: {
        title: "Insert Image",
        icon: "Image",
        callback: function() {
          const editor = this;
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = function() {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
              const result = event.target.result;
              const img = new Image();
              img.onload = function() {
                editor.image.insert(result, null, null, function(insertedImg) {
                  editor.imageInsertedHandler(null, editor, insertedImg);
                });
              };
              img.src = result;
            };
            reader.readAsDataURL(file);
          };
          input.click();
        }
      }
    },
    dialogs: {
      imageOptions: {
        title: "Image Options",
        width: 400,
        height: 300,
        content: `
            <div class="fr-dialog-fieldset">
              <label for="fr-image-width">Width:</label>
              <input type="text" class="fr-input" id="fr-image-width" name="width">
            </div>
            <div class="fr-dialog-fieldset">
              <label for="fr-image-height">Height:</label>
              <input type="text" class="fr-input" id="fr-image-height" name="height">
            </div>
            <div class="fr-dialog-fieldset">
              <label for="fr-image-alignment">Alignment:</label>
              <select class="fr-input" id="fr-image-alignment" name="alignment">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          `,
        buttons: [ "ok", "cancel" ],
        onOk: function() {
          const editor = this;
          const width = editor.dialog.val("width");
          const height = editor.dialog.val("height");
          const alignment = editor.dialog.val("alignment");
          editor.imageInserted = false;
          editor.undo.saveStep();
          editor.image.width(width);
          editor.image.height(height);
          editor.image.align(alignment);
        }
      }
    },
    events: {
      "image.inserted": "imageInsertedHandler"
    }
  };
  return imagePlugin;
});