import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

interface measureIndex {
    numerator: number,
    denominator: number,
    sd: number,
    chart_type: number,
    chart_multiplier: number
}

interface dataArray {
    id: number[];
    numerator: number[];
    denominator: number[];
    sd: number[];
}

interface groupedData {
    x: number,
    value: number,
    group: string,
    colour: string,
    width: number
};

interface nestArray {
    key: string;
    values: number;
    value: number;
}

// Used to represent the different datapoints on the chart
interface ScatterDots {
    category: string;
    numerator: number;
    denominator: number;
    ratio: number;
    colour: string;
    // ISelectionId allows the visual to report the selection choice to PowerBI
    identity: ISelectionId;
    // Flag for whether dot should be highlighted by selections in other charts
    highlighted: boolean;
    // Tooltip data to print
    tooltips: VisualTooltipDataItem[];
};

// Separator between code that gets data from PBI, and code that renders
//   the data in the visual
interface ViewModel {
    scatterDots: ScatterDots[];
    lineData: groupedData[];
    groupedLines: nestArray[];
    maxRatio: number;
    maxDenominator: number;
    highlights: boolean;
    data_type: string;
    multiplier: number;
};

interface LimitLines {
    limit: number;
    denominator: number;
};

export { ScatterDots }
export { LimitLines }
export { ViewModel }
export { measureIndex }
export { groupedData }
export { nestArray }
export { dataArray }
