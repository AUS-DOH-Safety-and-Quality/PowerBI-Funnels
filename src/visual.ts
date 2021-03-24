"use strict";

import "core-js/stable";
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
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import makeDots from "../src/dots";
import makeLines from "../src/lines";
import updateSettings from "../src/updateSettings";
import getViewModel from "../src/getViewModel";
import * as d3 from "d3";
import * as mathjs from "mathjs";
import * as rmath from "lib-r-math.js";

// I don't know why it needs this, and at this point I'm too afraid to ask
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

// Used to represent the different datapoints on the chart
interface ScatterDots {
    category: string;
    numerator: number;
    denominator: number;
    ratio: number;
    colour: string;
    // ISelectionId allows the visual to report the selection choice to PowerBI
    identity: powerbi.visuals.ISelectionId;
    // Flag for whether dot should be highlighted by selections in other charts
    highlighted: boolean;
    // Tooltip data to print
    tooltips: VisualTooltipDataItem[];
};

interface LimitLines {
    limit: number;
    denominator: number;
    // Tooltip data to print
    tooltips: VisualTooltipDataItem[];
};

// Separator between code that gets data from PBI, and code that renders
//   the data in the visual
interface ViewModel {
    scatterDots: ScatterDots[];
    lowerLimit99: LimitLines[];
    lowerLimit95: LimitLines[];
    upperLimit95: LimitLines[];
    upperLimit99: LimitLines[];
    maxRatio: number;
    maxDenominator: number;
    target: number;
    highlights: boolean;
};

export class Visual implements IVisual {
    private host: IVisualHost;
    private svg: d3.Selection<SVGElement, any, any, any>;
    private dotGroup: d3.Selection<SVGElement, any, any, any>;
    private UL99Group: d3.Selection<SVGElement, any, any, any>;
    private LL99Group: d3.Selection<SVGElement, any, any, any>;
    private UL95Group: d3.Selection<SVGElement, any, any, any>;
    private LL95Group: d3.Selection<SVGElement, any, any, any>;
    private targetGroup: d3.Selection<SVGElement, any, any, any>;
    private viewModel: ViewModel;

    // Method for notifying PowerBI of changes in the visual to propagate to the
    //   rest of the report
    private selectionManager: ISelectionManager;

    // Group for managing x-axis settings
    private xAxisGroup: d3.Selection<SVGGElement, any, any, any>;
    // Group for managing y-axis settings
    private yAxisGroup: d3.Selection<SVGGElement, any, any, any>;

    // Settings for plot aesthetics
    private settings = {
        axis: {
            x: {
                padding: {
                    default: 50,
                    value: 50
                },
                show: {
                    default: true,
                    value: true
                }
            },
            y: {
                padding: {
                    default: 50,
                    value: 50
                },
                show: {
                    default: true,
                    value: true
                }
            }
        },
        border: {
            top: {
                default: 1,
                value: 1
            }
        },
        funnel: {
            data_type: {
                default: "PR",
                value: "PR"
            },
            od_adjust: {
                default: "auto",
                value: "auto"
            }
        }
    }

    constructor(options: VisualConstructorOptions) {
        // Add reference to host object, for accessing environment (e.g. colour)
        this.host = options.host;

                    // Get reference to element object for manipulation
                    //   (reference to html container for visual)
        this.svg = d3.select(options.element)
                    // Create new svg element inside container
                     .append("svg");

        this.dotGroup = this.svg.append("g")
                                .classed("dot-group", true);
        this.UL99Group = this.svg.append("g")
                                .classed("line-group", true);
        this.LL99Group = this.svg.append("g")
                                .classed("line-group", true);
        this.UL95Group = this.svg.append("g")
                                .classed("line-group", true);
        this.LL95Group = this.svg.append("g")
                                .classed("line-group", true);
        this.targetGroup = this.svg.append("g")
                                .classed("line-group", true);

        // Add a grouping ('g') element to the canvas that will later become the x-axis
        this.xAxisGroup = this.svg.append("g")
                                  .classed("x-axis", true);

        // Add a grouping ('g') element to the canvas that will later become the y-axis
        this.yAxisGroup = this.svg.append("g")
                                  .classed("y-axis", true);

        // Request a new selectionManager tied to the visual
        this.selectionManager = this.host.createSelectionManager();
    }

    public update(options: VisualUpdateOptions) {
        // Update settings object
        updateSettings(this.settings, options, dataViewObjects);

        // Insert the viewModel object containing the user-input data
        this.viewModel = getViewModel(options, this.settings, this);

        // Get the width and height of plotting space
        let width = options.viewport.width;
        let height = options.viewport.height;

        // Check whether the user wants to display the x-axis, and if so add appropriate padding
        let xAxisPadding = this.settings.axis.x.show.value ? this.settings.axis.x.padding.value : 0;

        // Check whether the user wants to display the y-axis, and if so add appropriate padding
        let yAxisPadding = this.settings.axis.y.show.value ? this.settings.axis.y.padding.value : 0;

        // Dynamically scale chart to use all available space
        this.svg.attr("width", width)
                .attr("height", height);

        // Define y-axis scale for chart
        let yScale = d3.scaleLinear()
                       // Specify y-axis range of plot, including extra padding at the top
                       .domain([0, this.viewModel.maxRatio])
                       // Map to screen coordinates of available space
                       //   - Add padding below plot to put axis
                       .range([height - xAxisPadding, 0]);

        let yScale_inv = d3.scaleLinear()
                       .domain([height - xAxisPadding, 0])
                       .range([0, this.viewModel.maxRatio]);

        let yAxis = d3.axisLeft(yScale);

        this.yAxisGroup
            .call(yAxis)
            .attr("transform", "translate(" +  yAxisPadding + ",0)");

        // Define conversion of x-axis scale to dot groupings
        let xScale = d3.scaleLinear()
                       .domain([0, this.viewModel.maxDenominator])
                       // Specify plotting width as space between y-axis and end of plot
                       .range([yAxisPadding, width]);

        // Define conversion of x-axis scale to dot groupings
        let xScale_inv = d3.scaleLinear()
        // Specify plotting width as space between y-axis and end of plot
                            .domain([yAxisPadding, width])
                            .range([0, this.viewModel.maxDenominator]);

        // Define x-axis for plot
        // Type of axis (discrete/continous) and range of values
        //   extracted from the xScale object
        let xAxis = d3.axisBottom(xScale);

        // Draw x-axis on plot
        this.xAxisGroup
            .call(xAxis)
            // Plots the axis at the correct height
            .attr("transform", "translate(0, " + (height - xAxisPadding) + ")")
            // Change colour of axis
            //.style("fill", "#777777")
            .selectAll("text")
            // Rotate tick labels
            .attr("transform","rotate(-35)")
            // Right-align
            .style("text-anchor", "end")
            // Scale font
            .style("font-size","x-small");


        // Bind input data to dotGroup reference
        let dots = this.dotGroup
                       // List all child elements of dotGroup that have CSS class '.dot'
                       .selectAll(".dot")
                       // Matches input array to a list, returns three result sets
                       //   - HTML element for which there are no matching datapoint (if so, creates new elements to be appended)
                       .data(this.viewModel.scatterDots);

        // If dots do not exist yet, create them
            // Gets the list of new elements generated above

        makeDots(dots.enter()
            .append("circle")
            .classed("dot", true), this, xScale, yScale);

            // Calculate the height of each dot, accounting for padding
        makeDots(dots, this, xScale, yScale);


        let linesLL99 = this.LL99Group
            .selectAll(".line")
            .data([this.viewModel.lowerLimit99]);

        let linesUL99 = this.UL99Group
            .selectAll(".line")
            .data([this.viewModel.upperLimit99]);

        let linesUL95 = this.UL95Group
            .selectAll(".line")
            .data([this.viewModel.upperLimit95]);

        let linesLL95 = this.LL95Group
            .selectAll(".line")
            .data([this.viewModel.lowerLimit95]);

        let lineTarget = this.targetGroup
            .selectAll(".line")
            .data([this.viewModel.upperLimit99]);
        
        makeLines(linesLL99.enter()
                            .append("path")
                            .classed("line", true),
                    xScale, yScale, "99.8%", this,
                    xScale_inv, yScale_inv);
        
        makeLines(linesLL95.enter()
                            .append("path")
                            .classed("line", true),
                    xScale, yScale, "95%", this,
                    xScale_inv, yScale_inv);

        makeLines(linesUL95.enter()
                            .append("path")
                            .classed("line", true),
                    xScale, yScale, "95%", this,
                    xScale_inv, yScale_inv);

        makeLines(linesUL99.enter()
                            .append("path")
                            .classed("line", true),
                    xScale, yScale, "99.8%", this,
                    xScale_inv, yScale_inv);

        makeLines(lineTarget.enter()
                            .append("path")
                            .classed("line", true),
                    xScale, yScale, "target", this);

        makeLines(linesLL99, xScale, yScale, "99.8%", this,
                  xScale_inv, yScale_inv);
        makeLines(linesLL95, xScale, yScale, "95%", this,
                  xScale_inv, yScale_inv);
        makeLines(linesUL95, xScale, yScale, "95%", this,
                  xScale_inv, yScale_inv);
        makeLines(linesUL99, xScale, yScale, "99.8%", this,
                  xScale_inv, yScale_inv);
        makeLines(lineTarget, xScale, yScale, "target", this);
    }

    // Function to render the properties specified in capabilities.json to the properties pane
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): 
        VisualObjectInstanceEnumeration {
            let propertyGroupName = options.objectName;
            // Object that holds the specified settings/options to be rendered
            let properties: VisualObjectInstance[] = [];

            // Call a different function for each specified property group
            switch (propertyGroupName) {
                // Specify behaviour for x-axis settings
                case "xAxis":
                    // Add x-axis settings to object to be rendered
                    properties.push({
                        objectName: propertyGroupName,
                        properties: {
                            show: this.settings.axis.x.show.value
                        },
                        selector: null
                    });
                    break; 
                    
                // Specify behaviour for x-axis settings
                case "yAxis":
                    // Add y-axis settings to object to be rendered
                    properties.push({
                        objectName: propertyGroupName,
                        properties: {
                            show: this.settings.axis.y.show.value
                        },
                        selector: null
                    });
                    break; 
                case "dataColors":
                    if (this.viewModel) {
                        // Push a different property object for each datapoint
                        for (let dp of this.viewModel.scatterDots) {
                            properties.push({
                                objectName: propertyGroupName,
                                // Push the property name for each datapoint as the category name
                                displayName: dp.category,
                                properties: {
                                    fill: dp.colour
                                },
                                // Store the property as belonging to a given datapoint
                                selector: dp.identity.getSelector()
                            })
                        }
                    }
                    break;
                    
                // Specify behaviour for x-axis settings
                case "funnel":
                    // Add y-axis settings to object to be rendered
                    properties.push({
                        objectName: propertyGroupName,
                        properties: {
                            data_type: this.settings.funnel.data_type.value,
                            od_adjust: this.settings.funnel.od_adjust.value
                        },
                        selector: null
                    });
                    break; 
            };
            return properties;
        }
}