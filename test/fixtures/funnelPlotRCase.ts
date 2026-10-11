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
};
