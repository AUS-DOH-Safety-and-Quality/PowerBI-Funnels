import powerbi from "powerbi-visuals-api";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { limitData } from "../Classes/Interfaces"

type tooltipArgs = {
  group: string,
  numerator: number,
  denominator: number,
  target: number,
  transform_text: string,
  transform: (x: number) => number,
  limits: limitData,
  data_type: string,
  multiplier: number
}

function buildTooltip(args: tooltipArgs): VisualTooltipDataItem[] {
  let numerator: number = args.numerator;
  let denominator: number = args.denominator;
  let ratio: number = args.transform((numerator / denominator) * args.multiplier);
  let ul99: number = args.transform(args.limits.ul99 * args.multiplier);
  let ll99: number = args.transform(args.limits.ll99 * args.multiplier);
  let prop_labels: boolean = args.data_type === "PR" && args.multiplier == 1 && args.transform_text === "none";
  let tooltip: VisualTooltipDataItem[] = new Array<VisualTooltipDataItem>();
  tooltip.push({
    displayName: "Group",
    value: args.group
  });
  tooltip.push({
    displayName: "Numerator",
    value: (args.numerator).toFixed(2)
  })
  tooltip.push({
    displayName: "Denominator",
    value: (args.denominator).toFixed(2)
  })
  tooltip.push({
    displayName: "Ratio",
    value: prop_labels ? (ratio * 100).toFixed(2) + "%" : ratio.toFixed(4)
  })
  tooltip.push({
    displayName: "Upper 99% Limit",
    value: prop_labels ? (ul99 * 100).toFixed(2) + "%" : ul99.toFixed(4)
  })
  tooltip.push({
    displayName: "Lower 99% Limit",
    value: prop_labels ? (ll99 * 100).toFixed(2) + "%" : ll99.toFixed(4)
  })

  if (args.transform_text !== "none") {
    tooltip.push({
      displayName: "Plot Scaling",
      value: args.transform_text
    })
  }
  return tooltip;
}

export default buildTooltip;
