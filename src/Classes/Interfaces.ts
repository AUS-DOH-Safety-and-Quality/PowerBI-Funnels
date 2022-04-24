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
    this.id = pars.id ? pars.id : null;
    this.numerator = pars.numerator ? pars.numerator : null;
    this.denominator = pars.denominator ? pars.denominator : null;
    this.highlights = pars.highlights ? pars.highlights : null;
    this.data_type = pars.data_type ? pars.data_type : null;
    this.multiplier = pars.multiplier ? pars.multiplier : null;
    this.categories = pars.categories ? pars.categories : null;
    this.transform_text = pars.transform_text ? pars.transform_text : null;
    this.transform = pars.transform_text ? getTransformation(pars.transform_text) : null;
    this.inverse_transform = pars.transform_text ? invertTransformation(pars.transform_text) : null;
    this.dot_colour = pars.dot_colour ? pars.dot_colour : null;
    this.maxDenominator = d3.max(this.denominator);
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
    let xLowerInput: number = args.inputSettings.axis.xlimit_l.value;
    let xUpperInput: number = args.inputSettings.axis.xlimit_u.value;
    let yLowerInput: number = args.inputSettings.axis.ylimit_l.value;
    let yUpperInput: number = args.inputSettings.axis.ylimit_u.value;

    this.x = {
      lower: xLowerInput ? xLowerInput : 0,
      upper: xUpperInput ? xUpperInput : d3.max(args.inputData.denominator) * 1.1
    };

    this.y = {
      lower: yLowerInput ? yLowerInput : args.inputData.transform(0),
      upper: yUpperInput ? yUpperInput : args.inputData.transform(maxRatio)
    };
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
