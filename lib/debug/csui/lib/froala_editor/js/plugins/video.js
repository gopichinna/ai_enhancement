define(['csui/lib/froala_editor/js/froala_editor.pkgd.min'], function (
    FroalaEditor
  ) {
    'use strict';
  
    FroalaEditor.PLUGINS.customVideoPlugin = function (editor) {
      function isValidVideoUrl(url) {
        return !!url.match(/\.(mp4|mkv|ogg|webm|m4v|ogv|mov).*/ig);
      }

      function insertVideoByUrl(url, editor) {
        const videoTag = `<video width="640" controls>
                            <source src="${url}" type="video/mp4">
                            Your browser does not support the video tag.
                          </video>`;

        editor.video.insert(videoTag);
      }
      function _init() {
        editor.events.on('commands.after', function (cmd) {
            if (cmd === 'videoInsertByURL') {
              const inputField = document.querySelector('.fr-video-by-url-layer input[type="text"]');
              if (inputField) {
                const url = inputField.value;
                if (isValidVideoUrl(url)) {
                  insertVideoByUrl(url, this);
                  this.popups.hide('video.insert');
                }
              }
            }
          })
      }
      return {
        _init: _init,
      };
    };
  });
  