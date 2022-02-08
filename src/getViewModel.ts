import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import * as d3 from "d3";
import getLimitsArray from "../src/getLimitsArray";
import getTransformation from "./Funnel Calculations/getTransformation";
import invertTransformation from "./Funnel Calculations/invertTransformation";
import { ViewModel, measureIndex, groupedData, nestArray  } from "./Interfaces"

/**
 * Interfacing function between PowerBI data and visual rendering. Reads in
 * user-specified data, calculates the funnel control limits to plot, and
 * packages into a format ready for plotting. This function is called on
 * each plot update (e.g., resizing, filtering).
 *
 * @param options  - VisualUpdateOptions object containing user data
 * @param settings - Object containing user-specified plot settings
 * @param host     - Reference to base IVisualHost object
 * 
 * @returns ViewModel object containing calculated limits and all
 *            data needed for plotting
*/
function getViewModel(options: VisualUpdateOptions, settings: any,
                      host: IVisualHost) {
    let dv: powerbi.DataView[] = options.dataViews;

    let viewModel: ViewModel = {
        scatterDots: [],
        lineData: [],
        groupedLines: [{ key: "null", values: 0, value: 0}],
        maxRatio: 0,
        maxDenominator: 0,
        highlights: false,
        data_type: "",
        multiplier: 1
    };

    let indices: measureIndex = {
        numerator: undefined,
        denominator: undefined,
        sd: undefined,
        chart_multiplier: undefined,
        chart_type: undefined
    }

    if(!dv
        || !dv[0]
        || !dv[0].categorical
        || !dv[0].categorical.categories
        || !dv[0].categorical.categories[0].source
        || !dv[0].categorical.values
        || !dv[0].metadata
        || dv[0].categorical.values.length < 2
        || dv[0].categorical.values.some(d => d.values.length < 1)
        || dv[0].categorical.categories.some(d => d.values.length < 1)) {
            return viewModel;
    }

    // Get  categorical view of the data
    let view: powerbi.DataViewCategorical = dv[0].categorical;

    for (let i = 0; i < view.values.length; i++) {
        if (view.values[i].source.roles.numerator) {
            indices.numerator = i
        } else if (view.values[i].source.roles.denominator) {
            indices.denominator = i
        } else if (view.values[i].source.roles.sd) {
            indices.sd = i
        } else if (view.values[i].source.roles.chart_multiplier) {
            indices.chart_multiplier = i
        } else if (view.values[i].source.roles.chart_type) {
            indices.chart_type = i
        }
    }

    // Get array of category values
    let categories: powerbi.DataViewCategoryColumn = view.categories[0];

    // Get numerator
    let numerator: powerbi.DataViewValueColumn = view.values[indices.numerator];
    // Get numerator
    let denominator: powerbi.DataViewValueColumn = view.values[indices.denominator];
    // Get numerator
    let sd: powerbi.DataViewValueColumn = view.values[indices.sd];

    // Get groups of dots to highlight
    let highlights: powerbi.PrimitiveValue[] = numerator.highlights;

    let data_type: string = indices.chart_type ? view.values[indices.chart_type].values[0] : settings.funnel.data_type.value;
    let od_adjust: string = settings.funnel.od_adjust.value;
    let multiplier: number = indices.chart_multiplier ? view.values[indices.chart_multiplier].values[0] : settings.funnel.multiplier.value;

    let transformation: (x: number) => number
        = getTransformation(settings.funnel.transformation.value);

    let data_in: number[][] = [(<number[]>numerator.values),
                               (<number[]>denominator.values),
                               sd ? (<number[]>sd.values) : [null]]

    let maxDenominator: number = d3.max(<number[]>denominator.values);

    let limitsArray: number[][] = getLimitsArray(data_in, maxDenominator, data_type, od_adjust);

    let l99_width: number = settings.lines.width_99.value;
    let l95_width: number = settings.lines.width_95.value;
    let target_width: number = settings.lines.width_target.value;
    let alt_target_width: number = settings.lines.width_alt_target.value;
    let l99_colour: string = settings.lines.colour_99.value;
    let l95_colour: string = settings.lines.colour_95.value;
    let target_colour: string = settings.lines.colour_target.value;
    let alt_target_colour: string = settings.lines.colour_alt_target.value;

    for (let i = 0; i < (<number[][]>limitsArray).length-1;  i++) {
        let x: number = limitsArray[i][0];
        viewModel.lineData.push({
            x: x,
            group: "ll99",
            value: limitsArray[i][1],
            colour: l99_colour,
            width: l99_width
        });
        viewModel.lineData.push({
            x: x,
            group: "ll95",
            value: limitsArray[i][2] * multiplier,
            colour: l95_colour,
            width: l95_width
        });
        viewModel.lineData.push({
            x: x,
            group: "ul95",
            value: limitsArray[i][3] * multiplier,
            colour: l95_colour,
            width: l95_width
        });
        viewModel.lineData.push({
            x: x,
            group: "ul99",
            value: limitsArray[i][4],
            colour: l99_colour,
            width: l99_width
        });
        viewModel.lineData.push({
            x: x,
            group: "target",
            value: +limitsArray[limitsArray.length-2],
            colour: target_colour,
            width: target_width
        });
        viewModel.lineData.push({
            x: x,
            group: "alt_target",
            value: settings.funnel.alt_target.value,
            colour: alt_target_colour,
            width: alt_target_width
        });
    }

    viewModel.lineData.map(d => d.value = (d.value !== null) ? <number>transformation(d.value * multiplier) : null)

    let inverse_transform: (x: number) => number = invertTransformation(settings.funnel.transformation.value);
    let prop_labels: boolean = data_type == "PR" && multiplier == 1;
    // Loop over all input Category/Value pairs and push into ViewModel for plotting
    for (let i = 0; i < categories.values.length;  i++) {
        let num_value: number = <number>numerator.values[i];
        let den_value: number = <number>denominator.values[i];
        let ul_value: number = viewModel.lineData.filter(d => d.x == den_value && d.group == "ul99")[0].value;
        let ll_value: number = viewModel.lineData.filter(d => d.x == den_value && d.group == "ll99")[0].value;
        let grp_value: string = (typeof categories.values[i] == 'number') ? (categories.values[i]).toString() : <string>(categories.values[i]);

        viewModel.scatterDots.push({
            // The inputs have to explicitly cast to requested types, as PowerBI
            //   stores them as type 'PrimitiveValue[]'
            category: grp_value,
            numerator: num_value,
            denominator: den_value,
            ratio: transformation((num_value/den_value) * multiplier),
            // Check whether objects array exists with user-specified fill colours, apply those colours if so
            //   otherwise use default palette
            colour: settings.scatter.colour.value,
            // Create selection identity for each data point, to control cross-plot highlighting
            identity: host.createSelectionIdBuilder()
                          .withCategory(categories, i)
                          .createSelectionId(),
            // Check if highlights array exists, if it does, check if dot should
            //   be highlighted
            highlighted: highlights ? (highlights[i] ? true : false) : false,

            // Specify content to print in tooltip
            tooltips: [{
                displayName: "Group",
                value: <string>(grp_value)
            }, {
                displayName: "Numerator",
                value: (num_value == null) ? "" : (num_value).toFixed(2)
            }, {
                displayName: "Denominator",
                value: (den_value == null) ? "" : (den_value).toFixed(2)
            }, {
                displayName: "Ratio",
                value: (num_value == null || den_value == null) ? "" :
                        (prop_labels ? ((num_value/den_value) * multiplier * 100).toFixed(2) + "%"
                                     : ((num_value/den_value) * multiplier).toFixed(4))        
            }, {
                displayName: "Upper 99% Limit",
                value: prop_labels ? (inverse_transform(ul_value) * 100).toFixed(2) + "%"
                : inverse_transform(ul_value).toFixed(4)
            }, {
                displayName: "Lower 99% Limit",
                value: prop_labels ? (inverse_transform(ll_value) * 100).toFixed(2) + "%"
                : inverse_transform(ll_value).toFixed(4)
            }, settings.funnel.transformation.value == "none" ?
                {displayName:"",value:""} :
                {
                displayName: "Plot Scaling",
                value: settings.funnel.transformation.value
                }
            ]
        });
    }

    let maxRatio: number = d3.max(viewModel.lineData.map(d => d.value));

    // Extract maximum value of input data and add to viewModel
    viewModel.maxRatio = maxRatio + maxRatio*0.1;
    // Extract maximum value of input data and add to viewModel
    viewModel.maxDenominator = maxDenominator + maxDenominator*0.1;

    // Flag whether any dots need to be highlighted
    viewModel.highlights = viewModel.scatterDots.filter(d => d.highlighted).length > 0;
    viewModel.data_type = data_type;
    viewModel.multiplier = multiplier;
    viewModel.groupedLines = (d3.nest()
                                .key(function(d: groupedData) { return d.group; })
                                .entries(viewModel.lineData));
    return viewModel;
}

export default getViewModel;