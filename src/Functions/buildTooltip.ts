import powerbi from "powerbi-visuals-api";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import type { limitData } from "../Classes/chartObject";

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
  three_sigma_outlier: boolean,
  sig_figs: number
}

export default function buildTooltip(args: tooltipArgs): VisualTooltipDataItem[] {
  const numerator: number = args.numerator;
  const denominator: number = args.denominator;
  const multiplier: number = args.multiplier;
  const ratio: number = args.transform((numerator / denominator) * multiplier);
  const ul99: number = args.transform(args.limits.ul99 * multiplier);
  const ll99: number = args.transform(args.limits.ll99 * multiplier);
  const target: number = args.transform(args.target * multiplier);

  const prop_labels: boolean = (args.data_type === "PR" && args.multiplier === 100);
  const valueLabel: Record<string, string> = {
    "PR" : "Proportion",
    "SR" : "Standardised Ratio",
    "RC" : "Rate"
  }

  const tooltip: VisualTooltipDataItem[] = new Array<VisualTooltipDataItem>();
  tooltip.push({
    displayName: "Group",
    value: args.group
  });
  tooltip.push({
    displayName: valueLabel[args.data_type],
    value: prop_labels ? ratio.toFixed(args.sig_figs) + "%" : ratio.toFixed(args.sig_figs)
  })
  tooltip.push({
    displayName: "Numerator",
    value: (args.numerator).toFixed(args.sig_figs)
  })
  tooltip.push({
    displayName: "Denominator",
    value: (args.denominator).toFixed(args.sig_figs)
  })
  tooltip.push({
    displayName: "Upper 99% Limit",
    value: prop_labels ? ul99.toFixed(args.sig_figs) + "%" : ul99.toFixed(args.sig_figs)
  })
  tooltip.push({
    displayName: "Centerline",
    value: prop_labels ? target.toFixed(args.sig_figs) + "%" : target.toFixed(args.sig_figs)
  })
  tooltip.push({
    displayName: "Lower 99% Limit",
    value: prop_labels ? ll99.toFixed(args.sig_figs) + "%" : ll99.toFixed(args.sig_figs)
  })

  if (args.transform_text !== "none") {
    tooltip.push({
      displayName: "Plot Scaling",
      value: args.transform_text
    })
  }
  if (args.two_sigma_outlier || args.three_sigma_outlier) {
    const patterns: string[] = new Array<string>();
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
