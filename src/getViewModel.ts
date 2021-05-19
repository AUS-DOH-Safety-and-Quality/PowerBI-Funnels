import * as d3 from "d3";
import getLimitsArray from "../src/getLimitsArray";
import getTransformation from "./Funnel Calculations/getTransformation";

function checkValid(value, is_denom:boolean = false) {
    return value !== null && value !== undefined && is_denom ? value > 0 : true;
}

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
function getViewModel(options, settings, host) {
    let dv = options.dataViews;

    let viewModel = {
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

    let data_type = settings.funnel.data_type.value;
    let od_adjust = settings.funnel.od_adjust.value;
    let multiplier = settings.funnel.multiplier.value;
    let transformation = getTransformation(settings.funnel.transformation.value);
    
    // Filter zero-denominator observations from proportion data
    let valid_ids = <number[]>denominator.values.map(
        (d,idx) => {
            var is_valid: boolean =
                checkValid(d, true) &&
                checkValid(<number[]>numerator.values[idx]);

            if(is_valid) {
                return idx;
            }
        }
    );

    let numerator_in = (<number[]>numerator.values).filter((d,idx) => valid_ids.indexOf(idx) != -1);
    let denominator_in = (<number[]>denominator.values).filter((d,idx) => valid_ids.indexOf(idx) != -1);

    let maxDenominator = d3.max(<number[]>denominator.values);

    let limitsArray = getLimitsArray(<number[]>numerator.values, <number[]>denominator.values, maxDenominator,
                                        data_type, od_adjust);

    // Loop over all input Category/Value pairs and push into ViewModel for plotting
    for (let i = 0; i < categories.values.length;  i++) {
        let num_value: number = <number>numerator.values[i];
        let den_value: number = <number>denominator.values[i];
        let grp_value: string = isNaN(categories.values[i]) ? <string>(categories.values[i]) : (categories.values[i]).toString();

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
                value: (num_value == null ||
                        den_value == null) ? "" : ((num_value/den_value) * multiplier).toFixed(2)
            }]
        });
    }
    console.log(viewModel.scatterDots);

    for (let i = 0; i < (<number[][]>limitsArray).length-1;  i++) {
        viewModel.lowerLimit99.push({
            limit: transformation(limitsArray[i][1] * multiplier),
            denominator: limitsArray[i][0],
            tooltips: [{
                displayName: "Lower 99.8%",
                value: transformation(limitsArray[i][1] * multiplier)
            }, {
                displayName: "Denominator",
                value: limitsArray[i][0]
            }]
        });
        viewModel.lowerLimit95.push({
            limit: transformation(limitsArray[i][2] * multiplier),
            denominator: limitsArray[i][0],
            tooltips: [{
                displayName: "Lower 95%",
                value: transformation(limitsArray[i][2] * multiplier)
            }, {
                displayName: "Denominator",
                value: limitsArray[i][0]
            }]
        });
        viewModel.upperLimit95.push({
            limit: transformation(limitsArray[i][3] * multiplier),
            denominator: limitsArray[i][0],
            tooltips: [{
                displayName: "Upper 95%",
                value: transformation(limitsArray[i][3] * multiplier)
            }, {
                displayName: "Denominator",
                value: limitsArray[i][0]
            }]
        });
        viewModel.upperLimit99.push({
            limit: transformation(limitsArray[i][4] * multiplier),
            denominator: limitsArray[i][0],
            tooltips: [{
                displayName: "Upper 99.8%",
                value: transformation(limitsArray[i][4] * multiplier)
            }, {
                displayName: "Denominator",
                value: limitsArray[i][0]
            }]
        });
    }

    let maxRatio = transformation(d3.max(numerator_in.map(
        (d,idx) => d / denominator_in[idx]
    )) * multiplier);

    let maxLimit = d3.max(viewModel.upperLimit95.map((d,idx) => Math.max(d.limit, viewModel.upperLimit99[idx].limit)));

    maxRatio = maxLimit > maxRatio ? maxLimit : maxRatio;

    // Extract maximum value of input data and add to viewModel
    viewModel.maxRatio = maxRatio + maxRatio*0.1;
    // Extract maximum value of input data and add to viewModel
    viewModel.maxDenominator = maxDenominator + maxDenominator*0.1;

    viewModel.target = transformation(+limitsArray[limitsArray.length-1] * multiplier);

    viewModel.alt_target = transformation(settings.funnel.alt_target.value);

    // Flag whether any dots need to be highlighted
    viewModel.highlights = viewModel.scatterDots.filter(d => d.highlighted).length > 0;

    return viewModel;
}

export default getViewModel;