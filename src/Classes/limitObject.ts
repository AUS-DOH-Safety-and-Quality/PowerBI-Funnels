import { dataArray, limitData, lineData } from "./Interfaces";
import settingsObject from "./settingsObject";
import { scatterDotsConstructorT, scatterDotsObject } from "./scatterDotsObject";

class limitObject {
  inputData: dataArray;
  inputSettings: settingsObject;
  calculatedLimits: limitData[];
  target: number;

  getScatterData(): scatterDotsObject[] {
    return this.inputData.id.map((i, idx) => {
      let limits: limitData = this.calculatedLimits.filter(d => d.denominator == this.inputData.denominator[idx])[0];
      let colour: string = this.inputData.dot_colour.length == 1 ?
        this.inputData.dot_colour[0] :
        this.inputData.dot_colour[idx];

      let conArgs: scatterDotsConstructorT = {
        category: (typeof this.inputData.categories.values[i] === "number") ?
                    (this.inputData.categories.values[i]).toString() :
                    <string>(this.inputData.categories.values[i]),
        numerator: this.inputData.numerator[idx],
        denominator: this.inputData.denominator[idx],
        limits: this.calculatedLimits[idx],
        colour: colour,
        highlighted: this.inputData.highlights ? (this.inputData.highlights[i] ? true : false) : false,
        data_type: this.inputData.data_type,
        multiplier: this.inputData.multiplier,
        target: this.target,
        transform_text: this.inputData.transform_text,
        transform: this.inputData.transform
      };

      return new scatterDotsObject(conArgs);
    });
  };

  getFormattedLines(): lineData[] {
    let formattedLines: lineData[];
    this.calculatedLimits.forEach(limits => {
      formattedLines.push({
        x: limits.denominator,
        group: "ll99",
        line_value: limits.ll99,
        colour: this.inputSettings.lines.colour_99.value,
        width: this.inputSettings.lines.width_99.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "ll95",
        line_value: limits.ll95,
        colour: this.inputSettings.lines.colour_95.value,
        width: this.inputSettings.lines.width_95.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "ul95",
        line_value: limits.ul95,
        colour: this.inputSettings.lines.colour_95.value,
        width: this.inputSettings.lines.width_95.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "ul99",
        line_value: limits.ul99,
        colour: this.inputSettings.lines.colour_99.value,
        width: this.inputSettings.lines.width_99.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "target",
        line_value: this.target,
        colour: this.inputSettings.lines.colour_target.value,
        width: this.inputSettings.lines.width_target.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "alt_target",
        line_value: this.inputSettings.funnel.alt_target.value,
        colour: this.inputSettings.lines.colour_alt_target.value,
        width: this.inputSettings.lines.width_alt_target.value
      });
    })

    return formattedLines;
  };

  constructor(args: { inputData: dataArray,
                      calculatedLimits: limitData[],
                      target: number }) {
    this.inputData = args.inputData;
    this.calculatedLimits = args.calculatedLimits;
    this.target = args.target;
  }
}

export default limitObject;
