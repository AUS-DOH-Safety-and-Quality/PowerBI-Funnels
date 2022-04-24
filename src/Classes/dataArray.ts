import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import getTransformation from "../Funnel Calculations/getTransformation";
import invertTransformation from "../Funnel Calculations/invertTransformation";
import { divide } from "../Function Broadcasting/BinaryFunctions"

type dataArrayConstructorT = {
  id?: number[],
  numerator?: number[],
  denominator?: number[],
  highlights?: powerbi.PrimitiveValue[],
  data_type?: string,
  multiplier?: number,
  categories?: powerbi.DataViewCategoryColumn,
  transform_text?: string,
  dot_colour?: string[],
  odAdjust?: string
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
  prop_labels: boolean;
  odAdjust: string;

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
    this.maxDenominator = pars.denominator ? d3.max(this.denominator) : null;
    this.maxRatio = (pars.denominator && pars.numerator) ? d3.max(divide(this.numerator, this.denominator)) : null;
    this.prop_labels = (pars.data_type && pars.multiplier && pars.transform_text)
      ? this.data_type === "PR" &&
          this.multiplier === 1 &&
          this.transform_text === "none"
      : null;
    this.multiplier = this.prop_labels ? 100 : this.multiplier;
    this.odAdjust = pars.odAdjust ? pars.odAdjust : null
  }
}

export default dataArray;
