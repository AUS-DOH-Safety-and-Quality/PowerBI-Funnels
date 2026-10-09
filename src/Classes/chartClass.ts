import type { dataObject } from "../Functions/extractInputData";
import type { settingsClass } from "../Classes";
import { max, sequence } from "powerbi-visuals-core/math";
import getZScores from "../Funnel Calculations/getZScores";
import winsoriseZScores from "../Funnel Calculations/winsoriseZScores";
import getPhi from "../Funnel Calculations/getPhi";
import getTau2 from "../Funnel Calculations/getTau2";

export type limitArgs = {
  p: number;
  q: number;
  target_transformed: number;
  SE: number | undefined;
  tau2: number;
  denominators: number;
}

export type limitData = {
  denominators: number;
  ll99: number | undefined;
  ll95: number | undefined;
  ll68: number | undefined;
  ul68: number | undefined;
  ul95: number | undefined;
  ul99: number | undefined;
  target: number;
  alt_target: number | undefined;
}

type intervalData = {
  prob: number;
  quantile: number;
  label: "ll99" | "ll95" | "ll68" | "ul68" | "ul95" | "ul99";
}

type chartObjectConstructorT = {
  seFunction: (x: dataObject, plottingDenominators?: number[]) => number[];
  seFunctionOD: (x: dataObject, plottingDenominators?: number[]) => number[];
  targetFunction: (x: dataObject) => number;
  targetFunctionTransformed: (x: dataObject) => number;
  yFunction: (x: dataObject) => number[];
  zFunction: (x: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) => number[];
  limitFunction: (x: limitArgs) => number;
  limitFunctionOD: (x: limitArgs) => number;
  inputData: dataObject;
  inputSettings: settingsClass;
}

export default class chartClass {
  inputData: dataObject;
  inputSettings: settingsClass;
  seFunction: (x: dataObject, plottingDenominators?: number[]) => number[];
  seFunctionOD: (x: dataObject, plottingDenominators?: number[]) => number[];
  targetFunction: (x: dataObject) => number;
  targetFunctionTransformed: (x: dataObject) => number;
  yFunction: (x: dataObject) => number[];
  zFunction: (x: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) => number[];
  limitFunction: (x: limitArgs) => number;
  limitFunctionOD: (x: limitArgs) => number;
  odAdjust: boolean | undefined;
  private variance: { tau2: number; zScores: number[]; seOD: number[] } | undefined;

  getPlottingDenominators(): number[] {
    const maxDenominator: number = max(this.inputData.denominators);
    const plotDenomLower: number = 1;
    const plotDenomUpper: number = maxDenominator + maxDenominator * 0.1;
    const plotDenomStep: number = maxDenominator * 0.01;
    // Grid points strictly below the upper bound; an empty range adds no grid points.
    const plotDenomCount: number = Math.floor((plotDenomUpper - plotDenomLower) / plotDenomStep);
    return sequence(plotDenomLower, plotDenomCount, plotDenomStep)
            .concat(this.inputData.denominators)
            .filter((d, i, arr) => arr.indexOf(d) === i)
            .sort((a, b) => a - b);
  }

  getTarget(par: { transformed: boolean }): number {
    const targetFun = par.transformed ? this.targetFunctionTransformed : this.targetFunction;
    return targetFun(this.inputData)
  }

  getSE(par: { odAdjust: boolean, plottingDenominators?: number[] }): number[] {
    const seFun = par.odAdjust ? this.seFunctionOD : this.seFunction;
    return seFun(this.inputData, par.plottingDenominators);
  }

  getY(): number[] {
    return this.yFunction(this.inputData)
  }

  getZ(): number[] {
    if (this.variance === undefined || this.odAdjust === undefined) {
      throw new Error("Calculate limits before requesting z-scores.");
    }
    return this.zFunction(this.inputData, this.variance.zScores, this.variance.seOD, this.odAdjust, this.variance.tau2);
  }

  getTau2(): number {
    const targetOD: number = this.getTarget({ transformed: true });
    const seOD = this.getSE({ odAdjust: true });
    const yTransformed: number[] = this.getY();
    const zScores = getZScores(yTransformed, seOD, targetOD);
    const zScoresWinsorized: number[] = winsoriseZScores(zScores);
    const phi: number = getPhi(zScoresWinsorized);

    const tau2 = getTau2(phi, seOD);
    this.variance = { tau2, seOD, zScores };
    return tau2;
  }

  getTau2Bool(): boolean {
    const tauReturn: Record<string, boolean> = {
      "yes" : true,
      "no"  : false,
      "auto": true
    };
    return tauReturn[this.inputSettings.settings.funnel.od_adjust];
  }

  getSingleLimit(par: { odAdjust: boolean, inputArgs: limitArgs }): number {
    const limitFun = par.odAdjust ? this.limitFunctionOD : this.limitFunction;
    return limitFun(par.inputArgs);
  }

  getIntervals(): intervalData[] {
    const probs: number[] = [0.001, 0.025, 0.16, 0.84, 0.975, 0.999];
    // Specify the intervals for the limits: 68%, 95% and 99.8%
    const qs: number[] = [
      -3.09023230616781319213,
      -1.95996398454005382739,
      -0.99445788320975281316,
      0.99445788320975281316,
      1.95996398454005360534,
      3.09023230616781319213
    ];
    const q_labels: intervalData["label"][] = ["ll99", "ll95", "ll68", "ul68", "ul95", "ul99"];

    const result = new Array<intervalData>(qs.length);
    for (let i = 0; i < qs.length; i++) {
      result[i] = { prob: probs[i], quantile: qs[i], label: q_labels[i] };
    }
    return result;
  }

  getLimits(): limitData[] {
    const calculateTau2: boolean = this.getTau2Bool();
    const tau2 = this.getTau2();
    let curr_tau2: number;
    if (calculateTau2) {
      curr_tau2 = tau2;
      this.odAdjust = tau2 > 0;
    } else {
      curr_tau2 = 0;
      this.odAdjust = false;
    }

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
        if (low !== undefined && nextLower !== undefined && low > nextLower) low = undefined;
        if (high !== undefined && nextUpper !== undefined && high < nextUpper) high = undefined;
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
    this.limitFunction = args.limitFunction;
    this.limitFunctionOD = args.limitFunctionOD;
    this.inputData = args.inputData;
    this.inputSettings = args.inputSettings;
  }
}
