import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

type dataArrayConstructorT = {
  data_type?: string,
  od_adjust?: string,
  id?: number[],
  numerator?: number[],
  denominator?: number[]
};

class dataArray {
  data_type: string;
  od_adjust: string;
  id: number[];
  numerator: number[];
  denominator: number[];

  constructor(pars: dataArrayConstructorT) {
    this.data_type = pars.data_type;
    this.od_adjust = pars.od_adjust;
    this.id = pars.id;
    this.numerator = pars.numerator;
    this.denominator = pars.denominator;
  }
}

type limitArgsConstructorT = {
  q?: number;
  target?: number;
  SE?: number;
  tau2?: number;
  denominator?: number;
}

class limitArguments {
  q: number;
  target: number;
  SE: number;
  tau2: number;
  denominator: number;

  constructor(args: limitArgsConstructorT) {
    this.q = args.q;
    this.target = args.target;
    this.SE = args.SE;
    this.tau2 = args.tau2;
    this.denominator = args.denominator;
  }
}

type intervalDataConstructorT = {
  quantile: number;
  label: string;
}

class intervalData {
  quantile: number;
  label: string;

  constructor(args: intervalDataConstructorT) {
    this.quantile = args.quantile;
    this.label = args.label;
  }
}

type groupedDataConstructorT = {
  x: number;
  line_value: number;
  group: string;
  colour: string;
  width: number;
}

class groupedData {
  x: number;
  line_value: number;
  group: string;
  colour: string;
  width: number;

  constructor(args: groupedDataConstructorT) {
    this.x = args.x;
    this.line_value = args.line_value;
    this.group = args.group;
    this.colour = args.colour;
    this.width = args.width;
  }
};

class limitData {
  denominator: number;
  ll99: number;
  ll95: number;
  ul95: number;
  ul99: number;

  constructor(denominator: number) {
    this.denominator = denominator;
  }
}














interface measureIndex {
  numerator: number,
  denominator: number,
  chart_type: number,
  chart_multiplier: number
}

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

export {
  ScatterDots,
  LimitLines,
  ViewModel,
  measureIndex,
  groupedData,
  nestArray,
  dataArray,
  limitArguments,
  intervalData,
  limitData
}
