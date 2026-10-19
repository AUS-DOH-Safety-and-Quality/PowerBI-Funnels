import type { settingsValueType } from "../../src/settings";

type Flag = "lower" | "upper" | "none";
type Limit = (number | null)[];

/** One funnel and its expected results, as written by funnelPlotR.R */
export type FunnelPlotRCase = {
  name: string;
  chart_type: settingsValueType["funnel"]["chart_type"];
  od_adjust: settingsValueType["funnel"]["od_adjust"];
  keys: string[];
  numerators: number[];
  denominators: number[];
  expected: {
    target: number;
    tau2: number;
    od_adjusted: boolean;
    values: number[];
    z: number[];
    two_sigma: Flag[];
    three_sigma: Flag[];
    ll99: Limit;
    ll95: Limit;
    ll68: Limit;
    ul68: Limit;
    ul95: Limit;
    ul99: Limit;
  };
  /** FunnelPlotR's own outputs where it has an equivalent; null where it has none (see funnelPlotR.R) */
  funnelPlotR: {
    /** null for a single unit, where FunnelPlotR's estimator divides by zero */
    tau2: number | null;
    /** Unadjusted z-scores of the transformed values (Uzscore) */
    uz: number[];
    /** Per-unit limits as drawn, adjusted when `od_adjusted`; null for RC, whose FunnelPlotR limits use the proportion SE */
    limits: { ll99: number[]; ll95: number[]; ul95: number[]; ul99: number[] } | null;
    /** Flags at the drawn 95% and 99.8% limits; null for RC, and for adjusted SR where FunnelPlotR flags on the wrong scale */
    outliers: { two_sigma: boolean[]; three_sigma: boolean[] } | null;
  };
};
