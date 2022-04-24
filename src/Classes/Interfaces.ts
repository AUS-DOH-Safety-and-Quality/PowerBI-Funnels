import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import getTransformation from "../Funnel Calculations/getTransformation";
import invertTransformation from "../Funnel Calculations/invertTransformation";
import { divide } from "../Helper Functions/BinaryBroadcasting"
import settingsObject from "./settingsObject";

type dataArrayConstructorT = {
  id?: number[],
  numerator?: number[],
  denominator?: number[],
  highlights?: powerbi.PrimitiveValue[],
  data_type?: string,
  multiplier?: number,
  categories?: powerbi.DataViewCategoryColumn,
  transform_text?: string,
  dot_colour?: string[]
};

class dataArray {
  id: number[];
  numerator: number[];
  denominator: number[];
  highlights: powerbi.PrimitiveValue[];
  data_type: string;
  multiplier: number;
  categories: powerbi.DataViewCategoryColumn;
  transform_text: string;
  transform: (x: number) => number;
  inverse_transform: (x: number) => number;
  dot_colour: string[];
  maxDenominator: number;
  maxRatio: number;

  constructor(pars: dataArrayConstructorT) {
    this.id = pars.id;
    this.numerator = pars.numerator;
    this.denominator = pars.denominator;
    this.highlights = pars.highlights;
    this.data_type = pars.data_type;
    this.multiplier = pars.multiplier;
    this.categories = pars.categories;
    this.transform_text = pars.transform_text;
    this.transform = getTransformation(pars.transform_text);
    this.inverse_transform = invertTransformation(pars.transform_text);
    this.dot_colour = pars.dot_colour;
    this.maxDenominator = d3.max(pars.denominator);
    this.maxRatio = d3.max(divide(this.numerator, this.denominator));
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

class lineData {
  x: number;
  line_value: number;
  group: string;
  colour: string;
  width: number;
};

class axisLimits {
  x: {
    lower: number,
    upper: number
  };
  y: {
    lower: number,
    upper: number
  }

  constructor(args: { inputData: dataArray,
                      inputSettings: settingsObject,
                      calculatedLimits: limitData[] }) {
    let maxRatio: number = d3.max(divide(args.inputData.numerator,
                                         args.inputData.denominator));

    this.x.lower = args.inputSettings.axis.xlimit_l.value ? args.inputSettings.axis.xlimit_l.value : 0;
    this.x.upper = args.inputSettings.axis.xlimit_u.value ? args.inputSettings.axis.xlimit_u.value : d3.max(args.inputData.denominator) * 1.1;
    this.y.lower = args.inputSettings.axis.ylimit_l.value ? args.inputSettings.axis.ylimit_l.value : args.inputData.transform(0);
    this.y.upper = args.inputSettings.axis.ylimit_u.value ? args.inputSettings.axis.ylimit_u.value : args.inputData.transform(maxRatio);
  }
}

type nestReturnT = {
  key: string;
  values: any;
  value: undefined;
}










interface groupedLine {
  key: string;
  values: number;
  line_value: number;
}


interface LimitLines {
  limit: number;
  denominator: number;
};

export {
  LimitLines,
  lineData,
  groupedLine,
  dataArray,
  limitArguments,
  intervalData,
  limitData,
  axisLimits,
  nestReturnT
}
