import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import * as d3 from "d3";
import getLimitsArray from "../src/getLimitsArray";
import getTransformation from "./Funnel Calculations/getTransformation";
import invertTransformation from "./Funnel Calculations/invertTransformation";
import { ViewModel } from "./Interfaces"

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
        lowerLimit99: [],
        lowerLimit95: [],
        upperLimit95: [],
        upperLimit99: [],
        maxRatio: 0,
        maxDenominator: 0,
        target: 0,
        alt_target: null,
        highlights: false
    };
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
    let view: powerbi.DataViewCategorical = dv[0].categorical;

    // Get array of category values
    let categories: powerbi.DataViewCategoryColumn = view.categories[0];

    // Get numerator
    let numerator: powerbi.DataViewValueColumn = view.values[0];
    // Get numerator
    let denominator: powerbi.DataViewValueColumn = view.values[1];
    // Get numerator
    let sd: powerbi.DataViewValueColumn = view.values[2];

    // Get groups of dots to highlight
    let highlights: powerbi.PrimitiveValue[] = numerator.highlights;

    let data_type: string = settings.funnel.data_type.value;
    let od_adjust: string = settings.funnel.od_adjust.value;
    let multiplier: number = settings.funnel.multiplier.value;
    let transformation: (x: number) => number
        = getTransformation(settings.funnel.transformation.value);

    let data_in: number[][] = [(<number[]>numerator.values),
                               (<number[]>denominator.values),
                               sd ? (<number[]>sd.values) : [null]]

    let maxDenominator: number = d3.max(<number[]>denominator.values);

    let limitsArray: number[][] = getLimitsArray(data_in, maxDenominator, data_type, od_adjust);

    for (let i = 0; i < (<number[][]>limitsArray).length-1;  i++) {
        viewModel.lowerLimit99.push({
            limit: transformation(limitsArray[i][1] * multiplier),
            denominator: limitsArray[i][0]
        });
        viewModel.lowerLimit95.push({
            limit: transformation(limitsArray[i][2] * multiplier),
            denominator: limitsArray[i][0]
        });
        viewModel.upperLimit95.push({
            limit: transformation(limitsArray[i][3] * multiplier),
            denominator: limitsArray[i][0]
        });
        viewModel.upperLimit99.push({
            limit: transformation(limitsArray[i][4] * multiplier),
            denominator: limitsArray[i][0]
        });
    }
    let inverse_transform: (x: number) => number = invertTransformation(settings.funnel.transformation.value);
    let prop_labels: boolean = data_type == "PR" && multiplier == 1;
    // Loop over all input Category/Value pairs and push into ViewModel for plotting
    for (let i = 0; i < categories.values.length;  i++) {
        let num_value: number = <number>numerator.values[i];
        let den_value: number = <number>denominator.values[i];
        let ll_index: number = viewModel.lowerLimit99.map(d => d.denominator).findIndex(d => d == den_value);
        let ul_index: number = viewModel.upperLimit99.map(d => d.denominator).findIndex(d => d == den_value);
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
                value: prop_labels ? (inverse_transform(viewModel.upperLimit99[ul_index].limit) * 100).toFixed(2) + "%"
                : inverse_transform(viewModel.upperLimit99[ul_index].limit).toFixed(4)
            }, {
                displayName: "Lower 99% Limit",
                value: prop_labels ? (inverse_transform(viewModel.lowerLimit99[ll_index].limit) * 100).toFixed(2) + "%"
                : inverse_transform(viewModel.lowerLimit99[ll_index].limit).toFixed(4)
            }, settings.funnel.transformation.value == "none" ?
                {displayName:"",value:""} :
                {
                displayName: "Plot Scaling",
                value: settings.funnel.transformation.value
                }
            ]
        });
    }



    

    let maxRatio: number = transformation(+limitsArray[limitsArray.length-1] * multiplier);

    let maxLimit: number = d3.max(viewModel.upperLimit95.map((d,idx) => Math.max(d.limit, viewModel.upperLimit99[idx].limit)));

    maxRatio = maxLimit > maxRatio ? maxLimit : maxRatio;

    // Extract maximum value of input data and add to viewModel
    viewModel.maxRatio = maxRatio + maxRatio*0.1;
    // Extract maximum value of input data and add to viewModel
    viewModel.maxDenominator = maxDenominator + maxDenominator*0.1;

    viewModel.target = transformation(+limitsArray[limitsArray.length-2] * multiplier);

    viewModel.alt_target = transformation(settings.funnel.alt_target.value);

    // Flag whether any dots need to be highlighted
    viewModel.highlights = viewModel.scatterDots.filter(d => d.highlighted).length > 0;

    return viewModel;
}

export default getViewModel;