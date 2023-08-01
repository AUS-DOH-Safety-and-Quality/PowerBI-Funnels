"use strict";

import type powerbi from "powerbi-visuals-api";
type IVisual = powerbi.extensibility.IVisual;
type VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
type VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type ISelectionManager = powerbi.extensibility.ISelectionManager;
type ISelectionId = powerbi.visuals.ISelectionId;
type IVisualEventService = powerbi.extensibility.IVisualEventService;
import * as d3 from "./D3 Plotting Functions/D3 Modules";
import viewModelObject from "./Classes/viewModel"
import plotData from "./Classes/plotData"
import lineData from "./Classes/lineData"
import { getAesthetic, between, abs } from "./Functions"
import plotPropertiesClass, { axisProperties } from "./Classes/plotProperties";

export class Visual implements IVisual {
  private host: IVisualHost;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private viewModel: viewModelObject;
  private selectionManager: ISelectionManager;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.svg = d3.select(options.element)
                  .append("svg");

    this.viewModel = new viewModelObject();
    this.viewModel.firstRun = true;

    this.selectionManager = this.host.createSelectionManager();
    this.selectionManager.registerOnSelectCallback(() => {
      this.updateHighlighting();
    })

    this.svg.append('g').classed("linesgroup", true)
    this.svg.append('g').classed("dotsgroup", true)
    this.svg.append('line').classed("ttip-line-x", true)
    this.svg.append('line').classed("ttip-line-y", true)
    this.svg.append('g').classed("xaxisgroup", true)
    this.svg.append('text').classed("xaxislabel", true)
    this.svg.append('g').classed("yaxisgroup", true)
    this.svg.append('text').classed("yaxislabel", true)
  }

  public update(options: VisualUpdateOptions) {
    try {
      this.host.eventService.renderingStarted(options);

      this.viewModel.update({ options: options,
                              host: this.host });

      this.svg.attr("width", this.viewModel.plotProperties.width)
              .attr("height", this.viewModel.plotProperties.height);

      this.drawXAxis();
      this.drawYAxis();
      this.initTooltipTracking();
      this.drawLines();
      this.drawDots();

      this.addContextMenu();
      this.host.eventService.renderingFinished(options);
    } catch (caught_error) {
      console.error(caught_error)
      this.host.eventService.renderingFailed(options);
    }
  }

  // Function to render the properties specified in capabilities.json to the properties pane
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    return this.viewModel.inputSettings.createSettingsEntry(options.objectName);
  }

  initTooltipTracking(): void {
    const xAxisLine = this.svg
    .select(".ttip-line-x")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", this.viewModel.plotProperties.yAxis.end_padding)
    .attr("y2", this.viewModel.plotProperties.height - this.viewModel.plotProperties.yAxis.start_padding)
    .attr("stroke-width", "1px")
    .attr("stroke", "black")
    .style("stroke-opacity", 0);
const yAxisLine = this.svg
    .select(".ttip-line-y")
    .attr("x1", this.viewModel.plotProperties.xAxis.start_padding)
    .attr("x2", this.viewModel.plotProperties.width - this.viewModel.plotProperties.xAxis.end_padding)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke-width", "1px")
    .attr("stroke", "black")
    .style("stroke-opacity", 0);

    this.svg.on("mousemove", (event) => {
      if (!this.viewModel.plotProperties.displayPlot) {
        return;
      }
      const plotProperties: plotPropertiesClass = this.viewModel.plotProperties;
      const plotPoints: plotData[] = this.viewModel.plotPoints

      const xValue: number = plotProperties.xScale.invert(event.pageX);
      const xRange: number[] = plotPoints.map(d => d.x).map(d => Math.abs(d - xValue));
      const nearestDenominator: number = d3.leastIndex(xRange,(a,b) => a-b);
      const x_coord: number = plotProperties.xScale(plotPoints[nearestDenominator].x)
      const y_coord: number = plotProperties.yScale(plotPoints[nearestDenominator].value)

      this.host.tooltipService.show({
        dataItems: plotPoints[nearestDenominator].tooltip,
        identities: [plotPoints[nearestDenominator].identity],
        coordinates: [x_coord, y_coord],
        isTouchEvent: false
      });
      xAxisLine.style("stroke-opacity", 0.4)
                .attr("x1", x_coord)
                .attr("x2", x_coord);
      yAxisLine.style("stroke-opacity", 0.4)
                .attr("y1", y_coord)
                .attr("y2", y_coord);
    })
    .on("mouseleave", () => {
      if (!this.viewModel.plotProperties.displayPlot) {
        return;
      }
      this.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
      xAxisLine.style("stroke-opacity", 0);
      yAxisLine.style("stroke-opacity", 0);
    });
  }

  drawXAxis(refresh = false): void {
    const xAxisProperties: axisProperties = this.viewModel.plotProperties.xAxis;
    const xAxis: d3.Axis<d3.NumberValue> = d3.axisBottom(this.viewModel.plotProperties.xScale);

      if (xAxisProperties.ticks) {
        if (xAxisProperties.tick_count) {
          xAxis.ticks(xAxisProperties.tick_count)
        }
      } else {
        xAxis.tickValues([]);
      }

      const plotHeight: number = this.viewModel.plotProperties.height;
      const xAxisHeight: number = plotHeight - this.viewModel.plotProperties.yAxis.start_padding;
      const displayPlot: boolean = this.viewModel.plotProperties.displayPlot;
      const xAxisGroup = this.svg.select(".xaxisgroup") as d3.Selection<SVGGElement, unknown, null, undefined>;

      xAxisGroup
          .call(xAxis)
          .attr("color", displayPlot ? xAxisProperties.colour : "#FFFFFF")
          // Plots the axis at the correct height
          .attr("transform", `translate(0, ${xAxisHeight})`)
          .selectAll(".tick text")
          // Right-align
          //.style("text-anchor", xAxisProperties.tick_rotation < 0.0 ? "end" : "start")
          // Rotate tick labels
          //.attr("dx", xAxisProperties.tick_rotation < 0.0 ? "-.8em" : ".8em")
          //.attr("dy", xAxisProperties.tick_rotation < 0.0 ? "-.15em" : ".15em")
          //.attr("transform","rotate(" + xAxisProperties.tick_rotation + ")")
          // Scale font
          .style("font-size", xAxisProperties.tick_size)
          .style("font-family", xAxisProperties.tick_font)
          .style("fill", displayPlot ? xAxisProperties.tick_colour : "#FFFFFF");

      const axisNode: SVGGElement = this.svg.selectAll(".xaxisgroup").selectAll(".tick text").node() as SVGGElement;
      const xAxisCoordinates: DOMRect = axisNode.getBoundingClientRect() as DOMRect;

      // Update padding and re-draw axis if large tick values rendered outside of plot
      const tickBelowPadding: number = xAxisCoordinates.bottom - xAxisHeight;
      const tickLeftofPadding: number = xAxisCoordinates.left - xAxisProperties.start_padding;

      if ((tickBelowPadding > 0 || tickLeftofPadding < 0)) {
        if (!refresh) {
          if (tickBelowPadding > 0) {
            this.viewModel.plotProperties.yAxis.start_padding += abs(tickBelowPadding);
          }
          if (tickLeftofPadding < 0) {
            this.viewModel.plotProperties.xAxis.start_padding += abs(tickLeftofPadding)
          }
          this.viewModel.plotProperties.initialiseScale();
          this.drawXAxis(true);
          return;
        }
      }

      const bottomMidpoint: number = plotHeight - ((plotHeight - xAxisCoordinates.bottom) / 2);

      this.svg.select(".xaxislabel")
                .attr("x",this.viewModel.plotProperties.width / 2)
                .attr("y", bottomMidpoint)
                .style("text-anchor", "middle")
                .text(xAxisProperties.label)
                .style("font-size", xAxisProperties.label_size)
                .style("font-family", xAxisProperties.label_font)
                .style("fill", displayPlot ? xAxisProperties.label_colour : "#FFFFFF");
  }

  drawYAxis(refresh = false): void {
    const yAxisProperties: axisProperties = this.viewModel.plotProperties.yAxis;
    const yAxis: d3.Axis<d3.NumberValue> = d3.axisLeft(this.viewModel.plotProperties.yScale);
    const yaxis_sig_figs: number = null;// this.viewModel.inputSettings.y_axis.ylimit_sig_figs;
    const sig_figs: number = yaxis_sig_figs === null ? this.viewModel.inputSettings.funnel.sig_figs.value : yaxis_sig_figs;
    const multiplier: number = this.viewModel.inputSettings.funnel.multiplier.value;
    const displayPlot: boolean = this.viewModel.plotProperties.displayPlot;

    if (yAxisProperties.ticks) {
      if (yAxisProperties.tick_count) {
        yAxis.ticks(yAxisProperties.tick_count)
      }
      if (this.viewModel.inputData) {
        yAxis.tickFormat(
          (d: number) => {
            return this.viewModel.inputData.percentLabels
              ? (d * (multiplier === 100 ? 1 : (multiplier === 1 ? 100 : multiplier))).toFixed(sig_figs) + "%"
              : d.toFixed(sig_figs);
          }
        );
      }
    } else {
      yAxis.tickValues([]);
    }
    const yAxisGroup = this.svg.select(".yaxisgroup") as d3.Selection<SVGGElement, unknown, null, undefined>;

    yAxisGroup
        .call(yAxis)
        .attr("color", displayPlot ? yAxisProperties.colour : "#FFFFFF")
        .attr("transform", `translate(${this.viewModel.plotProperties.xAxis.start_padding}, 0)`)
        .selectAll(".tick text")
        // Right-align
        .style("text-anchor", "right")
        // Rotate tick labels
        //.attr("transform", `rotate(${yAxisProperties.tick_rotation})`)
        // Scale font
        .style("font-size", yAxisProperties.tick_size)
        .style("font-family", yAxisProperties.tick_font)
        .style("fill", displayPlot ? yAxisProperties.tick_colour : "#FFFFFF");

    const currNode: SVGGElement = this.svg.selectAll(".yaxisgroup").selectAll(".tick text").node() as SVGGElement;
    const yAxisCoordinates: DOMRect = currNode.getBoundingClientRect() as DOMRect;

    const settingsPadding: number = this.viewModel.inputSettings.canvas.left_padding.value
    const tickLeftofPadding: number = yAxisCoordinates.left - settingsPadding;

    if (tickLeftofPadding < 0) {
      if (!refresh) {
        this.viewModel.plotProperties.xAxis.start_padding += abs(tickLeftofPadding)
        this.viewModel.plotProperties.initialiseScale();
        this.drawYAxis(true);
        this.drawXAxis(true);
        return;
      }
    }

    const leftMidpoint: number = yAxisCoordinates.x * 0.7;
    const y: number = this.viewModel.plotProperties.height / 2;

    this.svg.select(".yaxislabel")
        .attr("x",leftMidpoint)
        .attr("y", y)
        .attr("transform",`rotate(-90, ${leftMidpoint}, ${y})`)
        .text(yAxisProperties.label)
        .style("text-anchor", "middle")
        .style("font-size", yAxisProperties.label_size)
        .style("font-family", yAxisProperties.label_font)
        .style("fill", displayPlot ? yAxisProperties.label_colour : "#FFFFFF");
  }

  drawLines(): void {
    this.svg
    .select(".linesgroup")
    .selectAll("path")
    .data(this.viewModel.groupedLines)
    .join("path")
    .attr("d", d => {
      const lower: number = this.viewModel.plotProperties.yAxis.lower;
      const upper: number = this.viewModel.plotProperties.yAxis.upper;
      return d3.line<lineData>()
                .x(d => this.viewModel.plotProperties.xScale(d.x))
                .y(d => this.viewModel.plotProperties.yScale(d.line_value))
                .defined(d => d.line_value !== null && between(d.line_value, lower, upper))(d[1])
    })
    .attr("fill", "none")
    .attr("stroke", d => getAesthetic(d[0], "lines", "colour", this.viewModel.inputSettings))
    .attr("stroke-width", d => getAesthetic(d[0], "lines", "width", this.viewModel.inputSettings))
    .attr("stroke-dasharray", d => getAesthetic(d[0], "lines", "type", this.viewModel.inputSettings));
  }

  drawDots(): void {
    this.svg
    .select(".dotsgroup")
    .selectAll("circle")
    .data(this.viewModel.plotPoints)
    .join("circle")
    .filter((d: plotData) => d.value !== null)
    .attr("cy", (d: plotData) => this.viewModel.plotProperties.yScale(d.value))
    .attr("cx", (d: plotData) => this.viewModel.plotProperties.xScale(d.x))
    .attr("r", (d: plotData) => d.aesthetics.size)
    .style("fill", (d: plotData) => {
      const lower: number = this.viewModel.plotProperties.yAxis.lower;
      const upper: number = this.viewModel.plotProperties.yAxis.upper;
      return between(d.value, lower, upper) ? d.aesthetics.colour : "#FFFFFF";
    })
    .on("click", (event, d: plotData) => {
          // Pass identities of selected data back to PowerBI
          this.selectionManager
              // Propagate identities of selected data back to
              //   PowerBI based on all selected dots
              .select(d.identity, (event.ctrlKey || event.metaKey))
              // Change opacity of non-selected dots
              .then(() => { this.updateHighlighting(); });

        event.stopPropagation();
      })
      // Display tooltip content on mouseover
      .on("mouseover", (event, d: plotData) => {
        // Get screen coordinates of mouse pointer, tooltip will
        //   be displayed at these coordinates
        const x = event.pageX;
        const y = event.pageY;

        this.host.tooltipService.show({
          dataItems: d.tooltip,
          identities: [d.identity],
          coordinates: [x, y],
          isTouchEvent: false
        });
      })
      // Hide tooltip when mouse moves out of dot
      .on("mouseout", () => {
        this.host.tooltipService.hide({
          immediately: true,
          isTouchEvent: false
        })
      });

      this.svg.on('click', () => {
        this.selectionManager.clear();
        this.updateHighlighting();
  });
  }

  addContextMenu(): void {
    this.svg.on('contextmenu', (event) => {
      const eventTarget: EventTarget = event.target;
      const dataPoint: plotData = <plotData>(d3.select(<d3.BaseType>eventTarget).datum());
      this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {}, {
        x: event.clientX,
        y: event.clientY
      });
      event.preventDefault();
    });
  }

  updateHighlighting(): void {
    const anyHighlights: boolean = this.viewModel.inputData ? this.viewModel.inputData.anyHighlights : false;
    const allSelectionIDs: ISelectionId[] = this.selectionManager.getSelectionIds() as ISelectionId[];

    const opacityFull: number = this.viewModel.inputSettings.settings.scatter.opacity;
    const opacityReduced: number = this.viewModel.inputSettings.settings.scatter.opacity_unselected;

    const defaultOpacity: number = (anyHighlights || (allSelectionIDs.length > 0))
                                      ? opacityReduced
                                      : opacityFull;
    this.svg.selectAll(".dotsgroup").selectChildren().style("fill-opacity", defaultOpacity);
    this.svg.selectAll(".linesgroup").style("stroke-opacity", defaultOpacity);
    if (anyHighlights || (allSelectionIDs.length > 0)) {
      this.svg.selectAll(".dotsgroup").selectChildren().style("fill-opacity", (dot: plotData) => {
        const currentPointSelected: boolean = allSelectionIDs.some((currentSelectionId: ISelectionId) => {
          return currentSelectionId.includes(dot.identity);
        });
        const currentPointHighlighted: boolean = dot.highlighted;
        return (currentPointSelected || currentPointHighlighted) ? dot.aesthetics.opacity : dot.aesthetics.opacity_unselected;
      })
    }
  }
}
