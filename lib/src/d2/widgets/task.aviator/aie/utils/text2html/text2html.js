/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  parseSafe
} from "d2/widgets/task.aviator/aie/lib/marked";

import {
  extractCharts
} from "d2/widgets/task.aviator/aie/utils/charts/charts";

function escape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fixBullets(text) {
  if (!/^-\s*/.test(text) && !/\r?\n-\s*/g.test(text)) return text;
  return text.replace(/^-\s*/, "* ").replace(/\r?\n-\s*/g, "\n* ");
}

function trimEmptyBullets(text) {
  if (!/\r?\n-\s*$/.test(text) && !/\r?\n-\s*\r?\n/g.test(text)) return text;
  return text.replace(/\r?\n-\s*$/, "").replace(/\r?\n-\s*\r?\n/g, "\n");
}

function slidesToBullets(text) {
  if (!/\r?\nSlide\s*\d+/g.test(text)) return text;
  return text.replace(/\r?\nSlide\s*(\d+)/g, "\n* **Slide $1**");
}

function emphasizeParts(text, {
  anyQuotedBold
}) {
  text = text.replace(/[$£¥][- .,:;"?)0-9]+/g, makePriceBold).replace(/[- .,:;"?)0-9]+(?:€|EUR|GBP|USD)/g, makePriceBold);
  return text.replace(anyQuotedBold ? /["‘“][^"’”]+["’”]/g : /["‘“][^"’”]+\.\w+["’”]/g, makeQuotedTextBold);
}

function makePriceBold(text, prefix, suffix) {
  if (!(prefix || suffix)) {
    return text;
  }
  const [ head, body, trail ] = separateInterpunction(text);
  return `${head}**${body}**${trail}`;
}

function makeQuotedTextBold(text) {
  return `**${text}**`;
}

function separateInterpunction(text) {
  let symbols = /[ .,:;"?)]+$/.exec(text);
  if (!symbols) {
    symbols = /^[ .,:;"?)]+/.exec(text);
    if (!symbols) return [ "", text, "" ];
    const {
      length
    } = symbols[0];
    const head = text.substring(0, length);
    const body = text.substring(length);
    return [ head, body, "" ];
  }
  let {
    length
  } = symbols[0];
  const trail = text.substring(text.length - length);
  let body = text.substring(0, text.length - length);
  symbols = /^[ .,:;"?)]+/.exec(body);
  if (!symbols) return [ "", body, trail ]; else {
    ({
      length
    } = symbols[0]);
    const head = body.substring(0, length);
    body = body.substring(length);
    return [ head, body, trail ];
  }
}

function retargetLinks(text) {
  if (!/<a href="/g.test(text)) return text;
  return text.replace(/<a href="/g, '<a target="_blank" href="');
}

const before = [ trimEmptyBullets, fixBullets, slidesToBullets, emphasizeParts ];

const after = [ retargetLinks ];

export function text2html(text, options = {}) {
  if (!options.richStyle) {
    return `<p class="aie-plain">${escape(text)}</p>`;
  }
  if (!/```/g.test(text)) {
    for (const transform of before) {
      text = transform(text, options);
    }
  }
  let html = parseSafe(text);
  for (const transform of after) {
    html = transform(html, options);
  }
  return html;
}

export function text2html2(text, options = {}) {
  if (!options.richStyle) {
    return `<p class="aie-plain">${escape(text)}</p>`;
  }
  const charts = [];
  if (!/```/g.test(text)) {
    for (const transform of before) {
      text = transform(text, options);
    }
  } else {
    text = extractCharts(text, charts);
  }
  let html = parseSafe(text);
  for (const transform of after) {
    html = transform(html, options);
  }
  return {
    html: html,
    charts: charts
  };
}

export function safeHtmlSliceIndex(html, len) {
  const part = html.substring(0, len);
  const openTag = part.lastIndexOf("<");
  let closeTag = part.lastIndexOf(">");
  if (openTag < 0) return len;
  if (closeTag > openTag) return len;
  closeTag = html.indexOf(">", len);
  return closeTag < 0 ? len : closeTag + 1;
}