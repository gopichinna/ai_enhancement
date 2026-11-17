/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import style from "txt!d2/widgets/task.aviator/aie/utils/clipboard/impl/clipboard.css";

function removeCitations(str) {
  const citationRegex = /\[(\d*?)\]/g;
  return str.replace(citationRegex, "");
}

function replaceChart(messageEl, newChartEl, oldChartTag) {
  const elClone = messageEl.cloneNode(true);
  const chartClone = elClone.querySelector(oldChartTag);
  chartClone.parentElement.replaceChild(newChartEl, chartClone);
  return elClone;
}

function canvasToImg(el, canvas, oldChartTag = "canvas") {
  const dataUrl = canvas.toDataURL();
  const image = document.createElement("img");
  image.src = dataUrl;
  const elClone = replaceChart(el, image, oldChartTag);
  return elClone;
}

function svgToImg(el, svg) {
  const svgContent = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([ svgContent ], {
    type: "image/svg+xml"
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  return new Promise((resolve, _reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const elClone = canvasToImg(el, canvas, "svg");
      URL.revokeObjectURL(svgUrl);
      resolve(elClone);
    });
    image.src = svgUrl;
  });
}

function chartToImg(el) {
  const svg = el.querySelector("svg");
  if (svg) return svgToImg(el, svg);
  const canvas = el.querySelector("canvas");
  if (canvas) return canvasToImg(el, canvas);
  return el;
}

async function copyNew(el, textContent) {
  if (textContent === undefined) {
    textContent = el.textContent;
  }
  el = await chartToImg(el);
  const htmlContent = `<style>${style}</style>${removeCitations(el.innerHTML)}`;
  const text = new Blob([ removeCitations(textContent) ], {
    type: "text/plain"
  });
  const html = new Blob([ htmlContent ], {
    type: "text/html"
  });
  const data = [ new ClipboardItem({
    "text/plain": text,
    "text/html": html
  }) ];
  const written = await navigator.clipboard.write(data);
  return written;
}

function copyOld(el) {
  const range = document.createRange();
  range.selectNode(el);
  getSelection().removeAllRanges();
  getSelection().addRange(range);
  document.execCommand("copy");
  getSelection().removeAllRanges();
}

export function copyElementContent(el, content) {
  return typeof ClipboardItem !== "undefined" ? copyNew(el, content) : copyOld(el);
}