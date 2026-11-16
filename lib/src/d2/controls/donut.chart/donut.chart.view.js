/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/lib/d3", "d2/utils/format.utils", "i18n!d2/controls/donut.chart/impl/nls/lang", "hbs!d2/controls/donut.chart/impl/donut.chart", "css!d2/controls/donut.chart/impl/donut.chart" ], function(i18n, _, $, Marionette, d3, formatUtils, lang, template) {
  "use strict";
  var instanceCount = 0, elTooltip, categoryName, categoryCount, hiddenContainer;
  function addInstance() {
    instanceCount++;
    if (instanceCount > 0) {
      if (i18n.settings.rtl) {
        elTooltip = d3.select(".binf-widgets").append("div").classed("d2-donut-chart-tooltip move-tooltip-rtl", true);
      } else {
        elTooltip = d3.select(".binf-widgets").append("div").classed("d2-donut-chart-tooltip", true);
      }
      categoryName = elTooltip.append("p").classed("catergory-name", true);
      categoryCount = elTooltip.append("p").classed("catergory-count", true);
    }
  }
  function removeInstance() {
    instanceCount--;
    if (instanceCount < 1) {
      d3.selectAll(".d2-donut-chart-tooltip").remove();
    }
  }
  function createHiddenContainer() {
    hiddenContainer = d3.select(".binf-widgets").append("div").classed("hidden-elem-container", true).append("svg");
  }
  var DonutChartView = Marionette.ItemView.extend({
    className: "d2-donut-chart-view",
    template: template,
    ui: {
      donut: ".d2-donut-chart"
    },
    defaults: {
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      skippedCategoryColor: "#ffffff",
      pieStrokeColor: "#ffffff",
      pieFillColor: "#1e7e40",
      highlightColor: "#333333",
      textColor: "#333333",
      totalCountColor: "#757575",
      innerCircleStrokeColor: "#E7EDF8",
      innerCircleFillColor: "#ffffff",
      innerCircleRadius: "42",
      donutRadius: "72",
      totalLabel: lang.defaultTotalLabel
    },
    constructor: function DonutChartView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      $(window).on("resize.d2-donut-chart-" + this.cid, this.render);
      addInstance();
    },
    onRender: function() {
      createHiddenContainer();
      var me = this;
      var dataset = this.options.dataset || [], totalLabel = this.options.totalLabel || lang.defaultTotalLabel, defaultPieStrokeColor = this.options.pieStokeColor || this.defaults.pieStrokeColor, skippedCategoryColor = this.options.skippedCategoryColor || this.defaults.skippedCategoryColor, textColor = this.options.textColor || this.defaults.textColor, totalCountColor = this.options.totalCountColor || this.defaults.totalCountColor, innerCircleStrokeColor = this.options.innerCircleStrokeColor || this.defaults.innerCircleStrokeColor, innerCircleFillColor = this.options.innerCircleFillColor || this.defaults.innerCircleFillColor, innerCircleRadius = this.options.innerCircleRadius || this.defaults.innerCircleRadius, donutRadius = this.options.donutRadius || this.defaults.donutRadius, getDisplayLabel = function(d) {
        return d.label || d.name;
      }, displayedTotal = function() {
        return _.reduce(dataset, function(m, d) {
          return d.skip !== true ? m + d.value : m;
        }, 0);
      }, getDisplayableChartData = function() {
        return _.filter(dataset, function(d) {
          return d.skip !== true;
        });
      }, dataKey = function(d) {
        return d.name;
      }, calculateLegendHeight = function() {
        var n = dataset.length || 1, minSwatchSize = 10, maxSwatchSize = 14, swatchSize;
        swatchSize = height * 2 / n / 2;
        swatchSize = swatchSize < minSwatchSize ? minSwatchSize : swatchSize;
        swatchSize = swatchSize > maxSwatchSize ? maxSwatchSize : swatchSize;
        return swatchSize;
      };
      dataset = _.map(dataset, function(d) {
        return _.defaults(d, {
          color: this.defaults.pieFillColor
        });
      }.bind(this));
      var skipped = [];
      var nonEmpty = _.filter(dataset, function(d) {
        if (d.skip === true && d.value > 0) {
          skipped.push(d);
        }
        return d.skip !== true && d.value > 0;
      });
      if (nonEmpty.length === 0) {
        if (skipped.length === 0) {
          d3.selectAll("svg#" + this.svgId).remove();
          return;
        } else {
          skipped[0].skip = false;
        }
      }
      this.svgId = _.uniqueId("d2_donut_");
      var width = this.width(), height = this.height();
      var visualContainer = d3.select(this.ui.donut[0]).append("svg").attr("id", this.svgId).attr("focusable", false).attr("width", width + this.marginLeft() + this.marginRight()).attr("height", height + this.marginTopp() + this.marginBottom()).append("g").classed("vis-wrapper", true).attr("fill", this.defaults.pieFillColor);
      var hiddenElemWidth = [];
      var hiddenNumberElementWidth = [];
      var hiddenElement = hiddenContainer.selectAll("text").data(dataset).enter().append("text").text(function(d) {
        return getDisplayLabel(d);
      }).classed("hidden-elem", true).attr("visibility", "hidden");
      hiddenElement.each(function(d, i) {
        hiddenElemWidth[i] = d3.select(this).node().getBBox().width;
      });
      var hiddenNumberElement = hiddenContainer.selectAll("text").data(dataset).text(function(d) {
        return formatUtils.kFormatter(d.value);
      });
      hiddenNumberElement.each(function(d, i) {
        hiddenNumberElementWidth[i] = d3.select(this).node().getBBox().width;
      });
      d3.select(".hidden-elem-container").remove();
      var donutContainer = visualContainer.append("g").classed("donut-container", true).attr("transform", function() {
        return "translate(" + width / 2 + "," + height / 3 + ")";
      }).attr("stroke-width", 0);
      var donutTotalContainer = visualContainer.append("g").classed("donut-total-container", true).attr("fill", totalCountColor).attr("transform", function() {
        return "translate(" + width / 2 + "," + height / 3 + ")";
      }).attr("role", "button").attr("tabindex", "0").attr("aria-label", _.str.sformat(lang.defaultTotalWorkflowsLabel, displayedTotal())).on("click", function(d) {
        me.trigger("show:my:workflows", d);
      }).on("keydown", function(d) {
        if (d3.event.keyCode === 32 || d3.event.keyCode === 13) {
          me.trigger("show:my:workflows", d);
        }
      });
      var minFontSize = 14, valueFontSize = minFontSize, valueOffsetRatio = 14;
      donutTotalContainer.append("circle").classed("inner-circle", true).attr("cx", "0").attr("cy", "0").attr("r", innerCircleRadius).attr("stroke", innerCircleStrokeColor).attr("fill", innerCircleFillColor);
      donutTotalContainer.append("text").classed("total-text", true).attr("transform", function() {
        if (i18n.settings.rtl) {
          return "scale(-1,1) translate(0," + (-(valueFontSize / valueOffsetRatio) - 8) + ")";
        } else {
          return "translate(0," + (-(valueFontSize / valueOffsetRatio) - 8) + ")";
        }
      }).attr("text-anchor", "middle").attr("alignment-baseline", "middle").text(totalLabel);
      donutTotalContainer.append("text").classed("total-count", true).attr("transform", function() {
        if (i18n.settings.rtl) {
          return "scale(-1,1) translate(0," + (valueFontSize / valueOffsetRatio + 8) + ")";
        } else {
          return "translate(0," + (valueFontSize / valueOffsetRatio + 8) + ")";
        }
      }).attr("text-anchor", "middle").attr("alignment-baseline", "middle").text(displayedTotal());
      var legendContainer = visualContainer.append("g").classed("chart-legends", true).attr("transform", function() {
        return "translate(22" + "," + (height / 2 + 3 * calculateLegendHeight() + 14) + ")";
      });
      var color = d3.scaleOrdinal().domain(_.map(dataset, function(d) {
        return d.name;
      })).range(_.map(dataset, function(d) {
        return d.color;
      })), donutWidth = 1.3, radius = donutRadius, colorOpacity = .9;
      var arc = d3.arc().innerRadius(radius / donutWidth).outerRadius(radius);
      var pie = d3.pie().sort(null).value(function(d) {
        return d.value;
      });
      function drawPie() {
        var arcs = donutContainer.selectAll(".arc").data(pie(getDisplayableChartData()), dataKey);
        arcs.enter().append("g").classed("arc", true).attr("stroke", defaultPieStrokeColor).attr("stroke-width", "1").style("cursor", "pointer").append("path").attr("d", arc).attr("tabindex", "-1").attr("focusable", function(d) {
          return d.data.value ? true : false;
        }).attr("fill-opacity", colorOpacity).style("fill", function(d) {
          return color(d.data.name);
        }).on("mouseover", function(d) {
          me.animateChartArcs(donutContainer, d, "arc", 1.05);
          categoryName.text(getDisplayLabel(d.data));
          categoryCount.text(d.data.value);
          elTooltip.style("border", "1px solid" + " " + d.data.color);
          elTooltip.classed(d.data.name, true);
          return elTooltip.style("visibility", "visible");
        }).on("mousemove", function(d) {
          categoryName.text(getDisplayLabel(d.data));
          categoryCount.text(d.data.value);
          var mousePos = d3.mouse(d3.select("body").node());
          elTooltip.style("border", "1px solid" + " " + d.data.color);
          return i18n.settings.rtl ? elTooltip.style("top", mousePos[1] - 25 + "px").style("right", window.innerWidth - mousePos[0] + "px") : elTooltip.style("top", mousePos[1] - 25 + "px").style("left", mousePos[0] + 15 + "px");
        }).on("mouseout", function(d) {
          elTooltip.classed(d.data.name, false);
          me.animateChartArcs(donutContainer, d, "arc", 1);
          categoryName.text(getDisplayLabel(d.data));
          categoryCount.text(d.data.value);
          elTooltip.style("border", "1px solid" + " " + d.data.color);
          return elTooltip.style("visibility", "hidden");
        }).on("click", function(d) {
          me.trigger("show:" + d.data.name + ":workflows", d.data);
        });
        arcs.exit().remove();
        arcs.select("path").attr("d", arc).style("fill", function(d) {
          return color(d.data.name);
        });
        donutTotalContainer.select(".total-count").text(displayedTotal());
      }
      drawPie();
      var legendHeight = calculateLegendHeight() + 10, toggleRad = legendHeight / 4 + 1;
      var legends = legendContainer.selectAll(".legend").data(dataset, dataKey).enter().append("g").classed("legend", true).attr("fill", textColor).style("font-size", legendHeight / 2 + "px").style("cursor", "pointer").attr("tabindex", "0").on("mouseover", function(d) {
        me.animateChartArcs(donutContainer, d, "legend", 1.05);
      }).on("mouseout", function(d) {
        me.animateChartArcs(donutContainer, d, "legend", 1);
      }).on("click", function(d) {
        me.trigger("show:" + d.name + ":workflows", d);
      }).on("keyup", function(d) {
        if (d3.event.keyCode === 9) {
          me.animateChartArcs(donutContainer, d, "legend", 1.05);
        }
      }).on("focusout", function(d) {
        me.animateChartArcs(donutContainer, d, "legend", 1);
      }).on("keydown", function(d) {
        if (d3.event.keyCode === 32 || d3.event.keyCode === 13) {
          me.trigger("show:" + d.name + ":workflows", d);
        }
      });
      legends.append("rect").attr("width", function(d, i) {
        return hiddenElemWidth[i] + hiddenNumberElementWidth[i] + toggleRad * 2 + 34;
      }).attr("height", function() {
        return legendHeight;
      }).attr("x", "-7").attr("y", function(d, i) {
        return i * legendHeight - legendHeight / 2;
      }).attr("rx", "3").attr("fill", "#f7f7f7").classed("legend-rect", true);
      legends.append("circle").classed("legend-toggle", true).attr("r", toggleRad).attr("cx", 0).attr("cy", function(d, i) {
        return i * legendHeight;
      }).attr("transform", "translate(12,0)").attr("fill", function(d) {
        return d.skip !== true ? color(d.name) : skippedCategoryColor;
      });
      legends.append("text").classed("legend-name", true).text(function(d) {
        return getDisplayLabel(d);
      }).attr("transform", function(d, i) {
        if (i18n.settings.rtl) {
          return "scale(-1,1) translate(" + "-" + (2 * toggleRad + 10) + "," + (i * legendHeight + legendHeight / 8 + 1) + ")";
        } else {
          return "translate(" + (toggleRad + 17) + "," + (i * legendHeight + legendHeight / 8 + 1) + ")";
        }
      });
      legends.append("text").classed("legend-value", true).text(function(d) {
        return formatUtils.kFormatter(d.value);
      }).attr("transform", function(d, i) {
        if (i18n.settings.rtl) {
          return "scale(-1,1) translate(" + "-" + (2 * toggleRad + 15 + hiddenElemWidth[i]) + "," + (i * legendHeight + legendHeight / 8 + 1) + ")";
        } else {
          return "translate(" + (toggleRad + 22 + hiddenElemWidth[i]) + "," + (i * legendHeight + legendHeight / 8 + 1) + ")";
        }
      });
    },
    animateChartArcs: function(donutContainer, d, targetElement, scaleValue) {
      donutContainer.selectAll(".arc").filter(function(d2) {
        if (targetElement === "legend") {
          return d2.data.name === d.name;
        } else {
          return d2.data.label === d.data.label;
        }
      }).transition().attr("transform", "scale(" + scaleValue + ")").duration(400);
    },
    marginTop: function() {
      return this.defaults.marginTop;
    },
    marginBottom: function() {
      return this.defaults.marginBottom;
    },
    marginLeft: function() {
      return this.defaults.marginLeft;
    },
    marginRight: function() {
      return this.defaults.marginRight;
    },
    marginTopp: function() {
      return this.defaults.marginTop;
    },
    width: function() {
      return this.getSizeElement().width() - this.marginLeft() - this.marginRight();
    },
    height: function() {
      return this.getSizeElement().height() - this.marginTop() - this.marginBottom();
    },
    getSizeElement: function() {
      return this.options.parent && this.options.parent.$el || this.$el;
    },
    onBeforeDestroy: function() {
      $(window).off("resize.d2-donut-chart-" + this.cid);
      removeInstance();
    }
  });
  return DonutChartView;
});