define(['csui/lib/froala_editor/js/froala_editor.pkgd.min'], function (
  FroalaEditor
) {
  'use strict';

  FroalaEditor.PLUGINS.customAttachmentsPlugin = function (editor) {
    // The start point for your plugin.
    function _init() {
      editor.events.on('image.beforeUpload', function (files, img) {
        const { getImageId, connectionUrl } = editor.opts.externalParams;
        const fileObj = files[0];
        //const connector = JSON.parse(context);
        var reader = new FileReader();
        var randomString = Math.random().toString(36).substring(2, 15);
        var filename = randomString + '_' + files[0].name;
        editor.opts.imageUploadParams.name = filename;

        // Set the reader to insert images when they are loaded.
        reader.onload = async function (e) {
          //const result = e.target.result;
          const imageId = await getImageId(fileObj);

          const imgURL = `${connectionUrl}?func=doc.fetch&nodeId=${imageId}&viewType=1`;
          editor.image.insert(imgURL, false, {}, img);
          editor.events.trigger('contentChanged'); // Trigger content change event
        };

        // Read image as base64.
        reader.readAsDataURL(files[0]);
        return false;
      });

      editor.events.on('popups.show.image.edit', function () {
        const image = editor.image.get()[0],
              popup = editor.popups.get('image.edit')[0],
              scrollContainer = editor.opts.iframe ? 
                editor.$iframe.closest(".csui-normal-scrolling")[0] : 
                  editor.$el[0].closest(".csui-normal-scrolling");
        repositionPopup(image, popup, scrollContainer); //To place the popup above/below the image
      });
 
      // Handle cleanup when popup is closed
      editor.events.on('popups.hide.image.edit', function () {
        editor.toolbar.enable();
        editor.shared.$image_resizer.removeClass('fr-active');
      });
      
      function closeEditPopup(){
        editor.popups.hide('image.edit');
      }

      function repositionPopup(image, popup, scrollContainer){
        let top = 0;
        const imageRect = image.getBoundingClientRect(),
            popupRect = popup.getBoundingClientRect(),
            scrollContRect = scrollContainer?.getBoundingClientRect(),
            iframeTop = editor.opts.iframe ? editor.$iframe[0].getBoundingClientRect().top : 0,
            combinedTop = imageRect.top + iframeTop,            //To get exact top value of the image if it is inside an iframe.
            combinedBottom = combinedTop + imageRect.height,    //To get exact bottom of the image
            containerTop = Math.max(combinedTop, scrollContRect.top),
            containerBottom = Math.min(combinedBottom, scrollContRect.bottom);
       
        if (popupRect.height < containerTop){
          top = containerTop - popupRect.height + window.scrollY; //To place the popup above the image
        } else if (window.innerHeight - containerBottom > popupRect.height){
          top = containerBottom + window.scrollY; //To place the popup below the image
        } else {
          top = containerTop > 0 ? containerTop + window.scrollY : containerBottom - popupRect.height + window.scrollY; //If popup can't be displayed above/below img, display it on the image
        }
        popup.style.top = `${top}px`;
      }
    }
    return {
      _init: _init,
    };
  };
});