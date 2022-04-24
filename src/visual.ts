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
import makeDots from "./Plotting Functions/makeDots";
import makeLines from "./Plotting Functions/makeLines";
import updateSettings from "./Plot Settings/updateSettings";
import settingsObject from "./Classes/settingsObject";
import initTooltipTracking from "./Plotting Functions/initTooltipTracking";
import highlightIfSelected from "./Selection Helpers/highlightIfSelected";
import getTransformation from "./Funnel Calculations/getTransformation";
import viewModelObject from "./Classes/viewModel"
import { scatterDotsObject } from "./Classes/scatterDotsObject"

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

  // Method for notifying PowerBI of changes in the visual to propagate to the
  //   rest of the report
  private selectionManager: ISelectionManager;

  // Settings for plot aesthetics
  private settings = new settingsObject();

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

    // Update dot highlighting on initialisation
    this.selectionManager.registerOnSelectCallback(() => {
      highlightIfSelected(this.dotSelection,
                          this.selectionManager.getSelectionIds() as ISelectionId[],
                          this.settings.scatter.opacity.value,
                          this.settings.scatter.opacity_unselected.value);
    })
  }

  public update(options: VisualUpdateOptions) {
    // Update settings object with user-specified values (if present)
    updateSettings(this.settings, options.dataViews[0].metadata.objects);

    // Insert the viewModel object containing the user-input data
    //   This function contains the construction of the funnel
    //   control limits
    this.viewModel = new viewModelObject({ options: options,
                                           inputSettings: this.settings,
                                           host: this.host });

    // Get the width and height of plotting space
    let width: number = options.viewport.width;
    let height: number = options.viewport.height;

    // Dynamically scale chart to use all available space
    this.svg.attr("width", width)
            .attr("height", height);

    let yAxisMin: number = this.viewModel.axisLimits.y.lower;
    let yAxisMax: number = this.viewModel.axisLimits.y.upper;
    let xAxisMin: number = this.viewModel.axisLimits.x.lower;
    let xAxisMax: number = this.viewModel.axisLimits.x.upper;

    let yAxisPadding: number = this.settings.axispad.y.padding.value;
    let xAxisPadding: number = this.settings.axispad.x.padding.value;

    // Define axes for chart.
    //   Takes a given plot axis value and returns the appropriate screen height
    //     to plot at.
    let yScale: d3.ScaleLinear<number, number, never>
        = d3.scaleLinear()
            .domain([yAxisMin, yAxisMax])
            .range([height - this.settings.axispad.x.padding.value,
              this.settings.axispad.x.end_padding.value]);
    let xScale: d3.ScaleLinear<number, number, never>
        = d3.scaleLinear()
            .domain([xAxisMin, xAxisMax])
            .range([this.settings.axispad.y.padding.value,
                    width - this.settings.axispad.y.end_padding.value]);



    this.listeningRectSelection = this.listeningRect
                                      .selectAll(".obs-sel")
                                      .data(this.viewModel.scatterDots);

    this.tooltipLineSelection = this.tooltipLineGroup
                                      .selectAll(".ttip-line")
                                      .data(this.viewModel.scatterDots);

    let displayPlot: boolean = this.viewModel.scatterDots.length > 1;
    if (displayPlot) {
        initTooltipTracking(
          this.svg,
          this.listeningRectSelection,
          this.tooltipLineSelection,
          width,
          height - this.settings.axispad.x.padding.value,
          xScale,
          yScale,
          this.host.tooltipService,
          this.viewModel
        );
    }

    let prop_limits: boolean = this.viewModel.inputData.data_type === "PR" &&
                                this.viewModel.inputData.multiplier === 1 &&
                                this.viewModel.inputData.transform_text === "none";

    let yAxis: d3.Axis<d3.NumberValue>
        = d3.axisLeft(yScale)
            .tickFormat(
                d => {
                  // If axis displayed on % scale, then disable axis values > 100%
                  return prop_limits ? (<number>d * 100).toFixed(2) + "%" : <string><unknown>d;
                }
            );
    let xAxis: d3.Axis<d3.NumberValue> = d3.axisBottom(xScale);

    // Draw axes on plot
    this.yAxisGroup
        .call(yAxis)
        .attr("color", displayPlot ? "#000000" : "#FFFFFF")
        .attr("transform", "translate(" +  yAxisPadding + ",0)");

    this.xAxisGroup
        .call(xAxis)
        .attr("color", displayPlot ? "#000000" : "#FFFFFF")
        // Plots the axis at the correct height
        .attr("transform", "translate(0, " + (height - xAxisPadding) + ")")
        .selectAll("text")
        // Rotate tick labels
        .attr("transform","rotate(-35)")
        // Right-align
        .style("text-anchor", "end")
        // Scale font
        .style("font-size","x-small");

    this.xAxisLabels.attr("x",width/2)
        .attr("y",height - xAxisPadding/10)
        .style("text-anchor", "middle")
        .text(this.settings.axis.xlimit_label.value);
    this.yAxisLabels
        .attr("x",yAxisPadding)
        .attr("y",height/2)
        .attr("transform","rotate(-90," + yAxisPadding/3 +"," + height/2 +")")
        .text(this.settings.axis.ylimit_label.value)
        .style("text-anchor", "end");

    // Bind input data to dotGroup reference
    this.dotSelection = this.dotGroup
                    // List all child elements of dotGroup that have CSS class '.dot'
                    .selectAll(".dot")
                    .data(this.viewModel
                              .scatterDots
                              .filter(d => (d.ratio >= yAxisMin
                                            && d.ratio <= yAxisMax
                                            && d.denominator >= xAxisMin
                                            && d.denominator <= xAxisMax)));

    // Plotting of scatter points
    makeDots(this.dotSelection, this.settings,
              this.viewModel.anyHighlights, this.selectionManager,
              this.host.tooltipService, xScale, yScale,
              this.svg);

    this.lineSelection = this.lineGroup
                              .selectAll(".line")
                              .data(this.viewModel.groupedLines);

    makeLines(this.lineSelection, this.settings,
              xScale, yScale, this.viewModel,
              this.viewModel.anyHighlights);
    this.lineSelection.exit().remove()

    this.svg.on('contextmenu', () => {
      const eventTarget: EventTarget = (<any>d3).event.target;
      let dataPoint: scatterDotsObject = <scatterDotsObject>(d3.select(<d3.BaseType>eventTarget).datum());
      this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {}, {
        x: (<any>d3).event.clientX,
        y: (<any>d3).event.clientY
      });
      (<any>d3).event.preventDefault();
    });
    this.listeningRectSelection.exit().remove()
    console.log("fin")
  }

  // Function to render the properties specified in capabilities.json to the properties pane
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions):
    VisualObjectInstanceEnumeration {
      let propertyGroupName: string = options.objectName;
      // Object that holds the specified settings/options to be rendered
      let properties: VisualObjectInstance[] = [];

      // Call a different function for each specified property group
      switch (propertyGroupName) {
        // Specify behaviour for x-axis settings
        case "funnel":
          // Add y-axis settings to object to be rendered
          properties.push({
            objectName: propertyGroupName,
            properties: {
              data_type: this.settings.funnel.data_type.value,
              od_adjust: this.settings.funnel.od_adjust.value,
              multiplier: this.settings.funnel.multiplier.value,
              transformation: this.settings.funnel.transformation.value,
              alt_target: this.settings.funnel.alt_target.value
            },
            selector: null
          });
        break;
        case "scatter":
          properties.push({
            objectName: propertyGroupName,
            properties: {
              size: this.settings.scatter.size.value,
              colour: this.settings.scatter.colour.value,
              opacity: this.settings.scatter.opacity.value,
              opacity_unselected: this.settings.scatter.opacity_unselected.value
            },
            selector: null
          });
        break;
        case "lines":
          properties.push({
            objectName: propertyGroupName,
            properties: {
              width_99: this.settings.lines.width_99.value,
              width_95: this.settings.lines.width_95.value,
              width_target: this.settings.lines.width_target.value,
              width_alt_target: this.settings.lines.width_alt_target.value,
              colour_99: this.settings.lines.colour_99.value,
              colour_95: this.settings.lines.colour_95.value,
              colour_target: this.settings.lines.colour_target.value,
              colour_alt_target: this.settings.lines.colour_alt_target.value
            },
            selector: null
          });
        break;
        case "axis":
          properties.push({
            objectName: propertyGroupName,
            properties: {
              xlimit_label: this.settings.axis.xlimit_label.value,
              ylimit_label: this.settings.axis.ylimit_label.value,
              ylimit_l: this.settings.axis.ylimit_l.value,
              ylimit_u: this.settings.axis.ylimit_u.value,
              xlimit_l: this.settings.axis.xlimit_l.value,
              xlimit_u: this.settings.axis.xlimit_u.value
            },
            selector: null
          });
        break;
      };
      return properties;
    }
}
