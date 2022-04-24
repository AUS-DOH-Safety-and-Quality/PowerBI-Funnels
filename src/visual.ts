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
import settingsObject from "./Classes/settingsObject";
import initTooltipTracking from "./Plotting Functions/initTooltipTracking";
import highlightIfSelected from "./Selection Helpers/highlightIfSelected";
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
  private settings: settingsObject;

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
      highlightIfSelected(this.dotSelection,
                          this.selectionManager.getSelectionIds() as ISelectionId[],
                          this.settings.scatter.opacity.value,
                          this.settings.scatter.opacity_unselected.value);
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
          .range([yAxisPadding,
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

    let prop_labels: boolean = this.viewModel.inputData.prop_labels;

    let yAxis: d3.Axis<d3.NumberValue>
      = d3.axisLeft(yScale)
          .tickFormat(d => {
            // If axis displayed on % scale, then disable axis values > 100%
            return prop_labels ? (<number>d).toFixed(2) + "%" : <string><unknown>d;
          });
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
                              .scatterDots);

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
