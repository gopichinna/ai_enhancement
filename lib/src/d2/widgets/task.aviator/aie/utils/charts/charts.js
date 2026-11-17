/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import require from "require";

import {
  uniqueId
} from "nuc/lib/underscore";

import {
  jsonrepair
} from "d2/widgets/task.aviator/aie/lib/jsonrepair";

import {
  parse as parseJSON
} from "d2/widgets/task.aviator/aie/lib/jsonlint";

import {
  requirePromise
} from "d2/widgets/task.aviator/aie/utils/modules";

import theming from "smart/themes/theming";

function createChart(charts, data, type) {
  const style = 'style="width: 100%"';
  const id = uniqueId("chart");
  charts.push({
    id: id,
    data: data,
    type: type
  });
  return `<div id="${id}"${style}></div>`;
}

function extractChart(text, charts) {
  let raw = text.slice(3, -3);
  let type;
  if (raw.startsWith("json")) {
    raw = raw.slice(4);
  } else if (raw.startsWith("vega") || raw.startsWith("vega-lite")) {
    raw = raw.startsWith("vega-lite") ? raw.slice(9) : raw.slice(4);
    type = "vega";
  } else if (raw.startsWith("echarts")) {
    raw = raw.slice(7);
    type = "echarts";
  } else if (raw.startsWith("chartjs")) {
    raw = raw.slice(7);
    type = "chart";
  }
  try {
    let data;
    try {
      data = parseJSON(raw, {
        mode: "json5"
      });
    } catch {
      raw = jsonrepair(raw);
      data = parseJSON(raw, {
        mode: "json5"
      });
    }
    if (type === "echarts") {
      return createChart(charts, data, "echarts");
    }
    if (data.data && data.encoding && data.mark) {
      const {
        x,
        y
      } = data.encoding;
      data.encoding.x = x;
      data.encoding.y = y;
      return createChart(charts, data, "vega");
    }
    if (data.xAxis || data.yAxis) {
      return createChart(charts, data, "echarts");
    }
    if (data.type && data.data && data.options) {
      return createChart(charts, data, "chart");
    }
  } catch (err) {
    console.debug("Chart detection failed:", err);
  }
  return text;
}

export function extractCharts(text, charts) {
  return text.replace(/```[^`]+```/g, text => extractChart(text, charts));
}

async function renderChart({
  type,
  id,
  data
}, finalizers) {
  try {
    const el = document.getElementById(id);
    const isJATODark = theming.getTheme() === "dark";
    switch (type) {
     case "vega":
      {
        const [ embedVega ] = await requirePromise(require, "aie/lib/vega/embed");
        data.width = "container";
        const opts = {
          theme: isJATODark ? "dark" : "",
          renderer: "svg",
          resize: "fit",
          actions: false
        };
        const view = await embedVega(el, data, opts);
        finalizers.push(view.finalize);
      }
      break;

     case "echarts":
      {
        el.style.height = "400px";
        const [ echarts ] = await requirePromise(require, "aie/lib/echarts");
        echarts.init(el).setOption(data);
      }
      break;

     case "chart":
      {
        const [ Chart ] = await requirePromise(require, "aie/lib/chart");
        const canvas = document.createElement("canvas");
        el.appendChild(canvas);
        const chartInstance = new Chart(canvas, data);
        finalizers.push(chartInstance.finalize);
      }
      break;

     default:
      throw new Error(`Unknown chart type: ${type}`);
    }
  } catch (err) {
    console.error(err);
    const chart = document.getElementById(id);
    chart.innerText = JSON.stringify(data);
  }
}

export async function renderCharts(charts) {
  const finalizers = [];
  for (const chart of charts) {
    await renderChart(chart, finalizers);
  }
  return finalizers;
}