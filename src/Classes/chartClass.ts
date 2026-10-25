import { at } from "powerbi-visuals-core/util";
import type { dataObject } from "../Functions/extractInputData";
import type { groupSettings } from "../Classes";
import { chisqQuantile, max, normalQuantile } from "powerbi-visuals-core/math";
import { limitLineNames, type LimitLineName, type LimitLineValues } from "powerbi-visuals-core/settings";
import getZScores from "../Funnel Calculations/getZScores";
import winsoriseZScores from "../Funnel Calculations/winsoriseZScores";
import getPhi from "../Funnel Calculations/getPhi";
import getTau2 from "../Funnel Calculations/getTau2";

export type limitArgs = {
  readonly p: number;
  readonly q: number;
  readonly target_transformed: number;
  readonly SE: number;
  readonly tau2: number;
  readonly denominators: number;
}

export type zArgs = {
  readonly zScores: readonly number[];
  readonly SE: readonly number[];
  readonly tau2: number;
}

export type limitData = LimitLineValues<number | undefined> & {
  readonly denominators: number;
  target: number;
  alt_target: number | undefined;
}

type intervalData = {
  readonly prob: number;
  readonly quantile: number;
  readonly label: LimitLineName;
}

/** An omitted overdispersion variant is the plain function */
type chartObjectConstructorT = {
  readonly seFunction: (x: dataObject, plottingDenominators?: readonly number[]) => number[];
  readonly seFunctionOD?: (x: dataObject, plottingDenominators?: readonly number[]) => number[];
  readonly targetFunction: (x: dataObject) => number;
  readonly targetFunctionTransformed: (x: dataObject) => number;
  readonly yFunction: (x: dataObject) => number[];
  readonly zFunction: (x: dataObject, args: zArgs) => readonly number[];
  readonly zFunctionOD?: (x: dataObject, args: zArgs) => readonly number[];
  readonly limitFunction: (x: limitArgs) => number;
  readonly limitFunctionOD?: (x: limitArgs) => number;
  readonly inputData: dataObject;
  readonly inputSettings: groupSettings;
}

const levels = ["99", "95", "68"] as const;

/** Limits that widen towards the next denominator's, or meet, are blanked, so a funnel never folds back on itself */
function pruneCrossing(inner: limitData, next: Readonly<limitData>): void {
  for (let i = 0; i < levels.length; i++) {
    const level = at(levels, i);
    const lower = `ll${level}` as const;
    const upper = `ul${level}` as const;
    const nextLower = next[lower];
    const nextUpper = next[upper];
    let low = inner[lower];
    let high = inner[upper];
    if (low !== undefined && nextLower !== undefined && low > nextLower) {
      low = undefined;
    }
    if (high !== undefined && nextUpper !== undefined && high < nextUpper) {
      high = undefined;
    }
    if (low !== undefined && high !== undefined && low >= high) {
      low = undefined;
      high = undefined;
    }
    inner[lower] = low;
    inner[upper] = high;
  }
}

export default class chartClass {
  readonly inputData: dataObject;
  readonly inputSettings: groupSettings;
  readonly seFunction: (x: dataObject, plottingDenominators?: readonly number[]) => number[];
  readonly seFunctionOD: (x: dataObject, plottingDenominators?: readonly number[]) => number[];
  readonly targetFunction: (x: dataObject) => number;
  readonly targetFunctionTransformed: (x: dataObject) => number;
  readonly yFunction: (x: dataObject) => number[];
  readonly zFunction: (x: dataObject, args: zArgs) => readonly number[];
  readonly zFunctionOD: (x: dataObject, args: zArgs) => readonly number[];
  readonly limitFunction: (x: limitArgs) => number;
  readonly limitFunctionOD: (x: limitArgs) => number;
  odAdjust: boolean | undefined;
  private variance: { readonly tau2: number; readonly phi: number; readonly zScores: readonly number[]; readonly seOD: readonly number[] } | undefined;

  getPlottingDenominators(): number[] {
    const plotDenomLower: number = 1;
    // The default x-axis upper limit, or an explicit one beyond it
    const plotDenomUpper: number = Math.max(max(this.inputData.denominators) * 1.1,
                                            this.inputSettings.settings.x_axis.xlimit_u ?? -Infinity);
    const plotDenomSteps: number = 110;
    const candidates = new Set<number>(this.inputData.denominators);
    if (plotDenomUpper > plotDenomLower) {
      const plotDenomStep: number = (plotDenomUpper - plotDenomLower) / plotDenomSteps;
      for (let i = 0; i < plotDenomSteps; i++) {
        candidates.add(plotDenomLower + i * plotDenomStep);
      }
      candidates.add(plotDenomUpper);
    }
    return Array.from(candidates).sort((a, b) => a - b);
  }

  getTarget(par: { readonly transformed: boolean }): number {
    const targetFun = par.transformed ? this.targetFunctionTransformed : this.targetFunction;
    return targetFun(this.inputData)
  }

  getSE(par: { readonly odAdjust: boolean, readonly plottingDenominators?: readonly number[] }): number[] {
    const seFun = par.odAdjust ? this.seFunctionOD : this.seFunction;
    return seFun(this.inputData, par.plottingDenominators);
  }

  getY(): number[] {
    return this.yFunction(this.inputData)
  }

  getZ(): readonly number[] {
    if (this.variance === undefined || this.odAdjust === undefined) {
      throw new Error("Calculate limits before requesting z-scores.");
    }
    const zFun = this.odAdjust ? this.zFunctionOD : this.zFunction;
    return zFun(this.inputData, {
      zScores: this.variance.zScores,
      SE: this.variance.seOD,
      tau2: this.odAdjust ? this.variance.tau2 : 0
    });
  }

  getTau2(): number {
    const targetOD: number = this.getTarget({ transformed: true });
    const seOD = this.getSE({ odAdjust: true });
    const yTransformed: number[] = this.getY();
    const zScores = getZScores(yTransformed, seOD, targetOD);
    const zScoresWinsorized: number[] = winsoriseZScores(zScores);
    const phi: number = getPhi(zScoresWinsorized);

    const tau2 = getTau2(phi, seOD);
    this.variance = { tau2, phi, seOD, zScores };
    return tau2;
  }

  /** "auto" adjusts only when N * phi exceeds chi-squared's 95th percentile on N - 1 df (Spiegelhalter, 2005) */
  getODAdjust(): boolean {
    if (this.variance === undefined) {
      throw new Error("Estimate tau2 before choosing whether to adjust for it.");
    }
    if (this.variance.tau2 === 0) {
      return false;
    }
    const N: number = this.variance.zScores.length;
    switch (this.inputSettings.settings.funnel.od_adjust) {
      case "yes":
        return true;
      case "auto":
        return N * this.variance.phi > chisqQuantile(0.95, N - 1);
      case "no":
        return false;
    }
  }

  getSingleLimit(par: { readonly odAdjust: boolean, readonly inputArgs: limitArgs }): number {
    const limitFun = par.odAdjust ? this.limitFunctionOD : this.limitFunction;
    return limitFun(par.inputArgs);
  }

  getIntervals(): intervalData[] {
    // The 99.8%, 95% and 68% limits
    const probs: number[] = [0.001, 0.025, 0.16, 0.84, 0.975, 0.999];
    const result = new Array<intervalData>(probs.length);
    for (let i = 0; i < probs.length; i++) {
      const prob = at(probs, i);
      result[i] = { prob, quantile: normalQuantile(prob, 0, 1, true, false), label: at(limitLineNames, i) };
    }
    return result;
  }

  getLimits(): limitData[] {
    const tau2 = this.getTau2();
    const odAdjust: boolean = this.getODAdjust();
    this.odAdjust = odAdjust;
    const curr_tau2: number = odAdjust ? tau2 : 0;

    const target: number = this.getTarget({ transformed: false });
    const alt_target = this.inputSettings.settings.lines.alt_target;
    const target_transformed: number = this.getTarget({ transformed: true });

    const intervals: intervalData[] = this.getIntervals();

    const plottingDenominators: number[] = this.getPlottingDenominators();
    // Each denominator is checked against one just beyond it, so pruning is independent of the plotting grid
    const nextDenominators = new Array<number>(plottingDenominators.length);
    for (let idx = 0; idx < plottingDenominators.length; idx++) {
      nextDenominators[idx] = at(plottingDenominators, idx) * (1 + 1e-3);
    }
    const plottingSE: number[] = this.getSE({
      odAdjust: odAdjust,
      plottingDenominators: plottingDenominators
    });
    const nextSE: number[] = this.getSE({
      odAdjust: odAdjust,
      plottingDenominators: nextDenominators
    });

    const limitRow = (denom: number, SE: number): limitData => {
      const row: limitData = { denominators: denom, target, alt_target,
        ll99: undefined, ll95: undefined, ll68: undefined, ul68: undefined, ul95: undefined, ul99: undefined };
      for (let i = 0; i < intervals.length; i++) {
        const interval = at(intervals, i);
        const functionArgs: limitArgs = {
          p: interval.prob,
          q: interval.quantile,
          target_transformed: target_transformed,
          SE: SE,
          tau2: curr_tau2,
          denominators: denom
        };

        const limit: number = this.getSingleLimit({
          odAdjust: odAdjust,
          inputArgs: functionArgs
        });

        row[interval.label] = limit;
      }
      return row;
    };

    const calcLimits = new Array<limitData>(plottingDenominators.length);
    for (let idx = 0; idx < plottingDenominators.length; idx++) {
      const row = limitRow(at(plottingDenominators, idx), at(plottingSE, idx));
      pruneCrossing(row, limitRow(at(nextDenominators, idx), at(nextSE, idx)));
      calcLimits[idx] = row;
    }
    return calcLimits;
  }

  constructor(args: chartObjectConstructorT) {
    this.seFunction = args.seFunction;
    this.seFunctionOD = args.seFunctionOD ?? args.seFunction;
    this.targetFunction = args.targetFunction;
    this.targetFunctionTransformed = args.targetFunctionTransformed;
    this.yFunction = args.yFunction;
    this.zFunction = args.zFunction;
    this.zFunctionOD = args.zFunctionOD ?? args.zFunction;
    this.limitFunction = args.limitFunction;
    this.limitFunctionOD = args.limitFunctionOD ?? args.limitFunction;
    this.inputData = args.inputData;
    this.inputSettings = args.inputSettings;
  }
}
