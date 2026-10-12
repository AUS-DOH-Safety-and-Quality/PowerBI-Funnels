import type { dataObject } from "../Functions/extractInputData";
import type { groupSettings } from "../Classes";
import { chisqQuantile, max } from "powerbi-visuals-core/math";
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

type chartObjectConstructorT = {
  readonly seFunction: (x: dataObject, plottingDenominators?: readonly number[]) => number[];
  readonly seFunctionOD: (x: dataObject, plottingDenominators?: readonly number[]) => number[];
  readonly targetFunction: (x: dataObject) => number;
  readonly targetFunctionTransformed: (x: dataObject) => number;
  readonly yFunction: (x: dataObject) => number[];
  readonly zFunction: (x: dataObject, args: zArgs) => readonly number[];
  readonly zFunctionOD: (x: dataObject, args: zArgs) => readonly number[];
  readonly limitFunction: (x: limitArgs) => number;
  readonly limitFunctionOD: (x: limitArgs) => number;
  readonly inputData: dataObject;
  readonly inputSettings: groupSettings;
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
    const candidates: number[] = this.inputData.denominators.slice();
    if (plotDenomUpper > plotDenomLower) {
      const plotDenomStep: number = (plotDenomUpper - plotDenomLower) / plotDenomSteps;
      for (let i = 0; i < plotDenomSteps; i++) {
        candidates.push(plotDenomLower + i * plotDenomStep);
      }
      candidates.push(plotDenomUpper);
    }
    const unique: number[] = [];
    for (let i = 0; i < candidates.length; i++) {
      if (candidates.indexOf(candidates[i]) === i) {
        unique.push(candidates[i]);
      }
    }
    return unique.sort((a, b) => a - b);
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
    const N: number = this.variance.zScores.length;
    switch (this.inputSettings.settings.funnel.od_adjust) {
      case "yes":
        return this.variance.tau2 > 0;
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
    const probs: number[] = [0.001, 0.025, 0.16, 0.84, 0.975, 0.999];
    // Normal quantiles at probs: the 99.8%, 95% and 68% limits
    const qs: number[] = [
      -3.09023230616781319213,
      -1.95996398454005382739,
      -0.99445788320975281316,
      0.99445788320975281316,
      1.95996398454005360534,
      3.09023230616781319213
    ];
    const result = new Array<intervalData>(qs.length);
    for (let i = 0; i < qs.length; i++) {
      result[i] = { prob: probs[i], quantile: qs[i], label: limitLineNames[i] };
    }
    return result;
  }

  getLimits(): limitData[] {
    const tau2 = this.getTau2();
    this.odAdjust = this.getODAdjust();
    const curr_tau2: number = this.odAdjust ? tau2 : 0;

    const target: number = this.getTarget({ transformed: false });
    const alt_target = this.inputSettings.settings.lines.alt_target;
    const target_transformed: number = this.getTarget({ transformed: true });

    const intervals: intervalData[] = this.getIntervals();

    const plottingDenominators: number[] = this.getPlottingDenominators();
    const plottingSE: number[] = this.getSE({
      odAdjust: this.odAdjust,
      plottingDenominators: plottingDenominators
    });

    const calcLimits = new Array<limitData>(plottingDenominators.length);
    for (let idx = 0; idx < plottingDenominators.length; idx++) {
      const denom = plottingDenominators[idx];
      const row: limitData = { denominators: denom, target, alt_target,
        ll99: undefined, ll95: undefined, ll68: undefined, ul68: undefined, ul95: undefined, ul99: undefined };
      for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const functionArgs: limitArgs = {
          p: interval.prob,
          q: interval.quantile,
          target_transformed: target_transformed,
          SE: plottingSE[idx],
          tau2: curr_tau2,
          denominators: denom
        };

        const limit: number = this.getSingleLimit({
          odAdjust: this.odAdjust,
          inputArgs: functionArgs
        });

        row[interval.label] = limit;
      }
      calcLimits[idx] = row;
    }

    const levels = ["99", "95", "68"] as const;
    for (let idx = 0; idx < calcLimits.length - 1; idx++) {
      const inner = calcLimits[idx];
      const next = calcLimits[idx + 1];
      for (let i = 0; i < levels.length; i++) {
        const lower = `ll${levels[i]}` as const;
        const upper = `ul${levels[i]}` as const;
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
    return calcLimits;
  }

  constructor(args: chartObjectConstructorT) {
    this.seFunction = args.seFunction;
    this.seFunctionOD = args.seFunctionOD;
    this.targetFunction = args.targetFunction;
    this.targetFunctionTransformed = args.targetFunctionTransformed;
    this.yFunction = args.yFunction;
    this.zFunction = args.zFunction;
    this.zFunctionOD = args.zFunctionOD;
    this.limitFunction = args.limitFunction;
    this.limitFunctionOD = args.limitFunctionOD;
    this.inputData = args.inputData;
    this.inputSettings = args.inputSettings;
  }
}
