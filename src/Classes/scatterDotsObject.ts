import powerbi from "powerbi-visuals-api";
import buildTooltip from "../Plotting Functions/buildTooltip";
import { limitData } from "./Interfaces";
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

type scatterDotsConstructorT = {
  category: string;
  numerator: number;
  denominator: number;
  colour: string;
  highlighted: boolean;
  data_type: string;
  multiplier: number;
  target: number;
  transform_text: string;
  transform: (x: number) => number;
  limits: limitData;
}

class scatterDotsObject {
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
  tooltip: VisualTooltipDataItem[];

  constructor(args: scatterDotsConstructorT) {
    this.category = args.category;
    this.numerator = args.numerator;
    this.denominator = args.denominator;
    this.ratio = args.transform((args.numerator / args.denominator) / args.multiplier);
    this.colour = args.colour;
    this.highlighted = args.highlighted;
    this.tooltip = buildTooltip({
      group: args.category,
      numerator: args.numerator,
      denominator: args.denominator,
      target: args.target,
      transform_text: args.transform_text,
      transform: args.transform,
      limits: args.limits,
      data_type: args.data_type,
      multiplier: args.multiplier
    })
  }
};

export {
  scatterDotsConstructorT,
  scatterDotsObject
}
