import powerbi from "powerbi-visuals-api";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import limitData from "../Classes/limitData"

type tooltipArgs = {
  group: string,
  numerator: number,
  denominator: number,
  target: number,
  transform_text: string,
  transform: (x: number) => number,
  limits: limitData,
  data_type: string,
  multiplier: number,
  two_sigma_outlier: boolean,
  three_sigma_outlier: boolean
}

function buildTooltip(args: tooltipArgs): VisualTooltipDataItem[] {
  let numerator: number = args.numerator;
  let denominator: number = args.denominator;
  let multiplier: number = args.multiplier;
  let ratio: number = args.transform((numerator / denominator) * multiplier);
  let ul99: number = args.transform(args.limits.ul99 * multiplier);
  let ll99: number = args.transform(args.limits.ll99 * multiplier);
  let target: number = args.transform(args.target * multiplier);

  let prop_labels: boolean = (args.data_type === "PR" && args.multiplier === 100);

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
    value: prop_labels ? ratio.toFixed(2) + "%" : ratio.toFixed(4)
  })
  tooltip.push({
    displayName: "Upper 99% Limit",
    value: prop_labels ? ul99.toFixed(2) + "%" : ul99.toFixed(4)
  })
  tooltip.push({
    displayName: "Centerline",
    value: prop_labels ? target.toFixed(2) + "%" : target.toFixed(4)
  })
  tooltip.push({
    displayName: "Lower 99% Limit",
    value: prop_labels ? ll99.toFixed(2) + "%" : ll99.toFixed(4)
  })

  if (args.transform_text !== "none") {
    tooltip.push({
      displayName: "Plot Scaling",
      value: args.transform_text
    })
  }
  if (args.two_sigma_outlier || args.three_sigma_outlier) {
    let patterns: string[] = new Array<string>();
    if (args.three_sigma_outlier) {
      patterns.push("Three Sigma Outlier")
    }
    if (args.two_sigma_outlier) {
      patterns.push("Two Sigma Outlier")
    }
    tooltip.push({
      displayName: "Pattern(s)",
      value: patterns.join("\n")
    })
  }
  return tooltip;
}

export default buildTooltip;
