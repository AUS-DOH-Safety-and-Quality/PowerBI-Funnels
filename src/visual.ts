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
import * as d3 from "d3";
import makeDots from "../src/dots";

// I don't know why it needs this, and at this point I'm too afraid to ask
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

// Used to represent the different datapoints on the chart
interface DataPoint {
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

// Separator between code that gets data from PBI, and code that renders
//   the data in the visual
interface ViewModel {
    dataPoints: DataPoint[];
    maxRatio: number;
    maxDenominator: number;
    highlights: boolean;
};

export class Visual implements IVisual {
    private host: IVisualHost;
    private svg: d3.Selection<SVGElement, any, any, any>;
    private dotGroup: d3.Selection<SVGElement, any, any, any>;
    private viewModel: ViewModel;

    // Padding between dots
    private xPadding: number = 0.1;

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
        }
    }


    constructor(options: VisualConstructorOptions) {
        // Add reference to host object, for accessing environment (e.g. colour)
        this.host = options.host;

                    // Get reference to element object for manipulation
                    //   (reference to html container for visual)
        this.svg = d3.select(options.element)
                    // Create new svg element inside container
                     .append("svg")
                    // Add a css class property for later styling
                     .classed("testviz", true);

        // Add a grouping ('g') element to the canvas that will later become the dots
        this.dotGroup = this.svg.append("g")
                                .classed("dot-group", true);

        // Add a grouping ('g') element to the canvas that will later become the x-axis
        this.xAxisGroup = this.svg.append("g")
                                  .classed("x-axis", true);

        // Add a grouping ('g') element to the canvas that will later become the x-axis
        this.yAxisGroup = this.svg.append("g")
                                  .classed("y-axis", true);

        // Request a new selectionManager tied to the visual
        this.selectionManager = this.host.createSelectionManager();
    }

    public update(options: VisualUpdateOptions) {
        // Update settings object
        this.updateSettings(options);

        // Insert the viewModel object containing the user-input data
        this.viewModel = this.getViewModel(options);
        console.log(this.viewModel);

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
                       .domain([0, this.viewModel.maxRatio  + this.settings.border.top.value])
                       // Map to screen coordinates of available space
                       //   - Add padding below plot to put axis
                       .range([height - xAxisPadding, 0]);
        
        let yAxis = d3.axisLeft(yScale);

        this.yAxisGroup
            .call(yAxis)
            .attr("transform", "translate(" +  yAxisPadding + ",0)");

        // Define conversion of x-axis scale to dot groupings
        let xScale = d3.scaleLinear()
                       .domain([0, 300])
                       // Specify plotting width as space between y-axis and end of plot
                       .rangeRound([yAxisPadding, width]);

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
                       .data(this.viewModel.dataPoints);

        // If dots do not exist yet, create them
        makeDots(dots.enter()
                          .append("circle")
                          .classed("dot", true),
                 this,xScale,yScale);
        //Update existing dots with new data
        makeDots(dots,this,xScale,yScale);

        // Remove any dots when the data is no longer present (i.e., filtering)
            // Get the HTML elements with no matching datapoint
        dots.exit()
            // Remove them
            .remove();
    }

    // Function to get user-specified settings from properties pane and update
    //   internal objects
    private updateSettings(options: VisualUpdateOptions) {
        this.settings.axis.x.show.value = dataViewObjects.getValue(
            options.dataViews[0].metadata.objects, {
                objectName: "xAxis",
                propertyName: "show"
            },
            this.settings.axis.x.show.default
        )
        this.settings.axis.y.show.value = dataViewObjects.getValue(
            options.dataViews[0].metadata.objects, {
                objectName: "yAxis",
                propertyName: "show"
            },
            this.settings.axis.y.show.default
        )
    }

    // Query PowerBI for data requested by user, then convert to format
    //   to fit with current ViewModel (plotting structure)
    //   - VisualUpdateOptions object made available with every call to
    //       update function
    private getViewModel(options: VisualUpdateOptions): ViewModel {
        let dv = options.dataViews;

        // Initialise empty ViewModel to return if no data is passed by the user
        let viewModel: ViewModel = {
            dataPoints: [],
            maxRatio: 0,
            maxDenominator: 0,
            highlights: false
        };

        // Return empty ViewModel (blank chart) if user hasn't finished passing input data
        if(!dv
            || !dv[0]
            || !dv[0].categorical
            || !dv[0].categorical.categories
            || !dv[0].categorical.categories[0].source
            || !dv[0].categorical.values
            || !dv[0].metadata) {
                return viewModel;
        }

        // Get  categorical view of the data
        let view = dv[0].categorical;

        // Get array of category values
        let categories = view.categories[0];

        // Get numerator
        let numerator = view.values[0];
        // Get numerator
        let denominator = view.values[1];

        // Get groups of dots to highlight
        let highlights = numerator.highlights;

        // Get array containing the settings that have been bound to each datapoint
        let objects = categories.objects;

        // Get metadata view to access datapoint names (for tooltips)
        let metadata = dv[0].metadata;

        // Get name of data column being used for category
        let categoryColumnName = metadata.columns.filter(c => c.roles["group"])[0].displayName;

        // Get name of data column being used for measure/values being plotted
        let valueColumnName = metadata.columns.filter(c => c.roles["numerator"])[0].displayName;

        // Loop over all input Category/Value pairs and push into ViewModel for plotting
        for (let i = 0; i < Math.max(categories.values.length, numerator.values.length);  i++) {
            viewModel.dataPoints.push({
                // The inputs have to explicitly cast to requested types, as PowerBI
                //   stores them as type 'PrimitiveValue[]'
                category: <string>categories.values[i],
                numerator: <number>numerator.values[i],
                denominator: <number>denominator.values[i],
                ratio: <number>numerator.values[i]/<number>denominator.values[i],
                // Check whether objects array exists with user-specified fill colours, apply those colours if so
                //   otherwise use default palette
                colour: "black",
                // Create selection identity for each data point, to control cross-plot highlighting
                identity: this.host.createSelectionIdBuilder()
                                   .withCategory(categories, i)
                                   .createSelectionId(),
                // Check if highlights array exists, if it does, check if dot should
                //   be highlighted
                highlighted: highlights ? (highlights[i] ? true : false) : false,

                // Specify content to print in tooltip
                tooltips: [{
                    displayName: "Group",
                    value: <string>categories.values[i]
                }, {
                    displayName: "Numerator",
                    value: (<number>numerator.values[i]).toFixed(2)
                }, {
                    displayName: "Denominator",
                    value: (<number>denominator.values[i]).toFixed(2)
                }, {
                    displayName: "Ratio",
                    value: (<number>numerator.values[i]/<number>denominator.values[i]).toFixed(2)
                }]
            });
        }

        // Extract maximum value of input data and add to viewModel
        viewModel.maxRatio = d3.max(viewModel.dataPoints, d => (d.numerator / d.denominator));
        // Extract maximum value of input data and add to viewModel
        viewModel.maxDenominator = d3.max(viewModel.dataPoints, d => d.denominator);

        // Flag whether any dots need to be highlighted
        viewModel.highlights = viewModel.dataPoints.filter(d => d.highlighted).length > 0;

        return viewModel;
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
                        for (let dp of this.viewModel.dataPoints) {
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
            };
            return properties;
        }
}