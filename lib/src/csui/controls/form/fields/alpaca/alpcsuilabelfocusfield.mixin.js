/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore" ], function(_) {
  var AlpCsuiLabelFocusField = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        wrapLabelTextNodeinSpan: function(labelEle) {
          const labelEleArr = labelEle && Array.from(labelEle) || [];
          labelEleArr.forEach(labelElement => {
            labelElement.addEventListener("click", function(event) {
              if (event.target === labelElement) {
                event.preventDefault();
              }
            });
            const textNode = Array.from(labelElement.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "");
            if (textNode) {
              const spanElement = document.createElement("span");
              spanElement.textContent = textNode.textContent;
              spanElement.addEventListener("click", this.onClickLabel.bind(this));
              labelElement.replaceChild(spanElement, textNode);
            }
          });
        }
      });
    }
  };
  return AlpCsuiLabelFocusField;
});