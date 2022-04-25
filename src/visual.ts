"use strict";

import "core-js/stable";
import "regenerator-runtime/runtime";
import "../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import * as d3 from "d3";
import checkIDSelected from "./Selection Helpers/checkIDSelected";
import settingsObject from "./Classes/settingsObject";
import viewModelObject from "./Classes/viewModel"
import scatterDotsObject from "./Classes/scatterDotsObject"
import lineData from "./Classes/lineData"
import axisLimits from "./Classes/axisLimits";
import getGroupKeys from "./Data Preparation/getGroupKeys"
import { groupKeysT } from "./Data Preparation/getGroupKeys"

type SelectionSVG = d3.Selection<SVGElement, any, any, any>;
type SelectionSVGG = d3.Selection<SVGGElement, any, any, any>;
type SelectionAny = d3.Selection<any, any, any, any>;

export class Visual implements IVisual {
  private host: IVisualHost;
  private svg: SelectionSVG;
  private dotGroup: SelectionSVG;
  private dotSelection: SelectionAny;
  private lineGroup: SelectionSVG;
  private lineSelection: SelectionAny;
  private listeningRect: SelectionSVG;
  private listeningRectSelection: SelectionAny;
  private tooltipLineGroup: SelectionSVG;
  private tooltipLineSelection: SelectionAny;
  private xAxisGroup: SelectionSVGG;
  private xAxisLabels: SelectionSVGG;
  private yAxisGroup: SelectionSVGG;
  private yAxisLabels: SelectionSVGG;
  private viewModel: viewModelObject;
  private selectionManager: ISelectionManager;
  private settings: settingsObject;
  private xScale: d3.ScaleLinear<number, number, never>;
  private yScale: d3.ScaleLinear<number, number, never>;
  private width: number;
  private height: number;
  private axisLimits: axisLimits;
  private displayPlot: boolean;

  constructor(options: VisualConstructorOptions) {
    // Add reference to host object, for accessing environment (e.g. colour)
    this.host = options.host;

                // Get reference to element object for manipulation
                //   (reference to html container for visual)
    this.svg = d3.select(options.element)
                // Create new svg element inside container
                  .append("svg")
                  .classed("funnelchart", true);
    this.listeningRect = this.svg.append("g")
                            .classed("listen-group", true);
    this.tooltipLineGroup = this.svg.append("g")
                            .classed("tooltip-group", true);
    this.lineGroup = this.svg.append("g")
                              .classed("line-group", true);
    this.dotGroup = this.svg.append("g")
                            .classed("dotGroup", true);

    // Add a grouping ('g') element to the canvas that will later become the x-axis
    this.xAxisGroup = this.svg.append("g")
                              .classed("x-axis", true);
    this.xAxisLabels = this.svg.append("text");

    // Add a grouping ('g') element to the canvas that will later become the y-axis
    this.yAxisGroup = this.svg.append("g")
                              .classed("y-axis", true);
    this.yAxisLabels = this.svg.append("text");

    // Request a new selectionManager tied to the visual
    this.selectionManager = this.host.createSelectionManager();

    this.settings = new settingsObject();

    // Update dot highlighting on initialisation
    this.selectionManager.registerOnSelectCallback(() => {
      this.highlightIfSelected();
    })
  }

  public update(options: VisualUpdateOptions) {
    // Update settings object with user-specified values (if present)
    this.settings.updateSettings(options.dataViews[0].metadata.objects);

    // Insert the viewModel object containing the user-input data
    //   This function contains the construction of the funnel
    //   control limits
    this.viewModel = new viewModelObject({ options: options,
                                           inputSettings: this.settings,
                                           host: this.host });
    // Get the width and height of plotting space
    this.width = options.viewport.width;
    this.height = options.viewport.height;

    // Dynamically scale chart to use all available space
    this.svg.attr("width", this.width)
            .attr("height", this.height);

    this.displayPlot = this.viewModel.scatterDots
      ? this.viewModel.scatterDots.length > 1
      : null;

    this.extractLimitsSettings();

    if (this.displayPlot) {
      this.initTooltipTracking();
    }

    this.drawXAxis();
    this.drawYAxis();

    // Plotting of scatter points
    this.drawDots();
    this.drawLines();

    this.addContextMenu();
  }

  highlightIfSelected(): void {
    if (!this.dotSelection || !this.selectionManager.getSelectionIds()) {
      return;
    }
    let opacitySelected: number = this.settings.scatter.opacity.value;
    let opacityUnselected: number = this.settings.scatter.opacity_unselected.value;

    if (!this.selectionManager.getSelectionIds().length) {
      this.dotSelection.style("fill-opacity", opacitySelected);
      return;
    }

    this.dotSelection.each(d => {
      const opacity: number
        = checkIDSelected(this.selectionManager.getSelectionIds() as ISelectionId[],
                          d.identity)
            ? opacitySelected
            : opacityUnselected;

      (<any>d3).select(this.dotSelection)
                .style("fill-opacity", opacity);
    });
  }

  extractLimitsSettings(): void {
    let yAxisMin: number = this.viewModel.axisLimits
      ? this.viewModel.axisLimits.y.lower
      : null;
    let yAxisMax: number = this.viewModel.axisLimits
      ? this.viewModel.axisLimits.y.upper
      : null;
    let xAxisMin: number = this.viewModel.axisLimits
      ? this.viewModel.axisLimits.x.lower
      : null;
    let xAxisMax: number = this.viewModel.axisLimits
      ? this.viewModel.axisLimits.x.upper
      : null;

    let xAxisPadding: number = this.settings.axispad.x.padding.value;
    let yAxisPadding: number = this.settings.axispad.y.padding.value;

    this.axisLimits = {
      x: {
        lower: xAxisMin,
        upper: xAxisMax,
        padding: xAxisPadding
      },
      y: {
        lower: yAxisMin,
        upper: yAxisMax,
        padding: yAxisPadding
      }
    }
  }

  drawXAxis(): void {
    let xAxisMin: number = this.axisLimits.x.lower;
    let xAxisMax: number = this.axisLimits.x.upper;
    let yAxisPadding: number = this.axisLimits.y.padding;
    let xAxisPadding: number = this.axisLimits.x.padding;
    this.xScale = d3.scaleLinear()
                    .domain([xAxisMin, xAxisMax])
                    .range([yAxisPadding,
                            this.width - this.settings.axispad.y.end_padding.value]);

    let xAxis: d3.Axis<d3.NumberValue> = d3.axisBottom(this.xScale);
    this.xAxisGroup
        .call(xAxis)
        .attr("color", this.displayPlot ? "#000000" : "#FFFFFF")
        // Plots the axis at the correct height
        .attr("transform", "translate(0, " + (this.height - xAxisPadding) + ")")
        .selectAll("text")
        // Rotate tick labels
        .attr("transform","rotate(-35)")
        // Right-align
        .style("text-anchor", "end")
        // Scale font
        .style("font-size","x-small");

    this.xAxisLabels
        .attr("x",this.width/2)
        .attr("y",this.height - xAxisPadding/10)
        .style("text-anchor", "middle")
        .text(this.settings.axis.xlimit_label.value);
  }

  drawYAxis(): void {
    let yAxisMin: number = this.axisLimits.y.lower;
    let yAxisMax: number = this.axisLimits.y.upper;
    let yAxisPadding: number = this.axisLimits.y.padding;
    let prop_labels: boolean = this.viewModel.inputData
      ? this.viewModel.inputData.prop_labels
      : null;

    this.yScale = d3.scaleLinear()
                    .domain([yAxisMin, yAxisMax])
                    .range([this.height - this.settings.axispad.x.padding.value,
                            this.settings.axispad.x.end_padding.value]);
    let yAxis: d3.Axis<d3.NumberValue>
      = d3.axisLeft(this.yScale)
          .tickFormat(d => {
            // If axis displayed on % scale, then disable axis values > 100%
            return prop_labels ? (<number>d).toFixed(2) + "%" : <string><unknown>d;
          });

    // Draw axes on plot
    this.yAxisGroup
        .call(yAxis)
        .attr("color", this.displayPlot ? "#000000" : "#FFFFFF")
        .attr("transform", "translate(" +  yAxisPadding + ",0)");

    this.yAxisLabels
        .attr("x",yAxisPadding)
        .attr("y",this.height/2)
        .attr("transform","rotate(-90," + yAxisPadding/3 +"," + this.height/2 +")")
        .text(this.settings.axis.ylimit_label.value)
        .style("text-anchor", "end");
  }

  addContextMenu(): void {
    this.svg.on('contextmenu', () => {
      const eventTarget: EventTarget = (<any>d3).event.target;
      let dataPoint: scatterDotsObject = <scatterDotsObject>(d3.select(<d3.BaseType>eventTarget).datum());
      this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {}, {
        x: (<any>d3).event.clientX,
        y: (<any>d3).event.clientY
      });
      (<any>d3).event.preventDefault();
    });
  }

  initTooltipTracking(): void {
    let height: number = this.height - this.settings.axispad.x.padding.value;
    this.tooltipLineSelection = this.tooltipLineGroup
                                      .selectAll(".ttip-line")
                                      .data(this.viewModel.scatterDots);
    let xAxisLine = this.tooltipLineSelection
                        .enter()
                        .append("rect")
                        .merge(<any>this.tooltipLineSelection);
    xAxisLine.classed("ttip-line", true);
    xAxisLine.attr("stroke-width", "1px")
              .attr("width", ".5px")
              .attr("height", height)
              .style("fill-opacity", 0);

    this.listeningRectSelection = this.listeningRect
                                      .selectAll(".obs-sel")
                                      .data(this.viewModel.scatterDots);

    let listenMerged = this.listeningRectSelection
                            .enter()
                            .append("rect")
                            .merge(<any>this.listeningRectSelection)
    listenMerged.classed("obs-sel", true);

    listenMerged.style("fill","transparent")
                .attr("width", this.width)
                .attr("height", height);

    listenMerged.on("mousemove", () => {
      let xval: number = this.xScale.invert((<any>d3).event.pageX);

      let x_dist: number[] = this.viewModel
                                  .scatterDots
                                  .map(d => d.denominator)
                                  .map(d => Math.abs(d - xval));
      let minInd: number = d3.scan(x_dist,(a,b) => a-b);

      let scaled_x: number = this.xScale(this.viewModel.scatterDots[minInd].denominator)
      let scaled_y: number = this.yScale(this.viewModel.scatterDots[minInd].ratio)

      this.host.tooltipService.show({
        dataItems: this.viewModel.scatterDots[minInd].tooltip,
        identities: [this.viewModel.scatterDots[minInd].identity],
        coordinates: [scaled_x, scaled_y],
        isTouchEvent: false
      });
      xAxisLine.style("fill-opacity", 1)
                .attr("transform", "translate(" + scaled_x + ",0)");
    });

    listenMerged.on("mouseleave", () => {
      this.host.tooltipService.hide({
        immediately: true,
        isTouchEvent: false
      });
      xAxisLine.style("fill-opacity", 0);
    });

    this.listeningRectSelection.exit().remove()
    listenMerged.exit().remove()
    xAxisLine.exit().remove()
  }

  drawDots(): void {
    let dot_size: number = this.settings.scatter.size.value;
    let dot_colour: string = this.settings.scatter.colour.value;
    let dot_opacity: number = this.settings.scatter.opacity.value;
    let dot_opacity_unsel: number = this.settings.scatter.opacity_unselected.value;

    // Bind input data to dotGroup reference
    this.dotSelection = this.dotGroup
                            // List all child elements of dotGroup that have CSS class '.dot'
                            .selectAll(".dot")
                            .data(this.viewModel.scatterDots);

    // Update the datapoints if data is refreshed
    const MergedDotObject: d3.Selection<SVGCircleElement, any, any, any>
      = this.dotSelection.enter()
      .append("circle")
      .merge(<any>this.dotSelection);

    MergedDotObject.classed("dot", true);

    MergedDotObject.attr("cy", d => this.yScale(d.ratio))
                    .attr("cx", d => this.xScale(d.denominator))
                    .attr("r", dot_size)
                    // Fill each dot with the colour in each DataPoint
                    .style("fill", d => dot_colour);

    this.highlightIfSelected();

    // Change opacity (highlighting) with selections in other plots
    // Specify actions to take when clicking on dots
    MergedDotObject.style("fill-opacity", d => {
      return this.viewModel.anyHighlights
        ? (d.highlighted ? dot_opacity : dot_opacity_unsel)
        : dot_opacity
    })
    .on("click", d => {
      // Propagate identities of selected data back to
      //   PowerBI based on all selected dots
      this.selectionManager
          .select(d.identity, (<any>d3).event.ctrlKey)
          .then(ids => {
            MergedDotObject.style("fill-opacity", d => {
              return ids.length > 0
                ? (ids.indexOf(d.identity) >= 0 ? dot_opacity : dot_opacity_unsel)
                : dot_opacity
            });
          });
      (<any>d3).event.stopPropagation();
    })
    // Display tooltip content on mouseover
    .on("mouseover", d => {
      // Get screen coordinates of mouse pointer, tooltip will
      //   be displayed at these coordinates
      //    Needs the '<any>' prefix, otherwise PowerBI doesn't defer
      //      to d3 properly
      let x: any = (<any>d3).event.pageX;
      let y: any = (<any>d3).event.pageY;

      this.host.tooltipService.show({
        dataItems: d.tooltip,
        identities: [d.identity],
        coordinates: [x, y],
        isTouchEvent: false
      });
    })
    // Specify that tooltips should move with the mouse
    .on("mousemove", d => {
      // Get screen coordinates of mouse pointer, tooltip will
      //   be displayed at these coordinates
      //    Needs the '<any>' prefix, otherwise PowerBI doesn't defer
      //      to d3 properly
      let x: any = (<any>d3).event.pageX;
      let y: any = (<any>d3).event.pageY;

      // Use the 'move' service for more responsive display
      this.host.tooltipService.move({
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

    MergedDotObject.exit().remove();
    this.dotSelection.exit().remove();

    this.svg.on('click', () => {
      this.selectionManager.clear();
      this.highlightIfSelected();
    });
  }

  drawLines(): void {
    let inputKeys: string[] = this.viewModel
                                    .groupedLines
                                    .map(d => d.key);
    let keyAesthetics: groupKeysT = getGroupKeys(this.settings);

    let line_color = d3.scaleOrdinal()
                        .domain(inputKeys)
                        .range(keyAesthetics.colours);

    let line_width = d3.scaleOrdinal()
                        .domain(inputKeys)
                        .range(keyAesthetics.widths);

    this.lineSelection = this.lineGroup
                              .selectAll(".line")
                              .data(this.viewModel.groupedLines);

    let lineMerged = this.lineSelection
                          .enter()
                          .append("path")
                          .merge(<any>this.lineSelection);
    lineMerged.classed('line', true);
    lineMerged.attr("d", d => {
      return d3.line<lineData>()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.line_value))
                .defined(function(d) { return d.line_value !== null; })
                (d.values)
    })
    lineMerged.attr("fill", "none")
              .attr("stroke", d => <string>line_color(d.key))
              .attr("stroke-width", d => <number>line_width(d.key));

    lineMerged.exit().remove();
    this.lineSelection.exit().remove();
  }

  // Function to render the properties specified in capabilities.json to the properties pane
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions):
    VisualObjectInstanceEnumeration {
      let propertyGroupName: string = options.objectName;
      // Object that holds the specified settings/options to be rendered
      let properties: VisualObjectInstance[] = [];
      properties.push({
        objectName: propertyGroupName,
        properties: this.settings.returnValues(propertyGroupName),
        selector: null
      });
      return properties;
  }
}
