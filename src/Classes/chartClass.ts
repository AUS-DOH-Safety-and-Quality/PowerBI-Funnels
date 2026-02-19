import { seq, max, type dataObject, isNullOrUndefined } from "../Functions";
import type { settingsClass } from "../Classes";
import getZScores from "../Funnel Calculations/getZScores";
import winsoriseZScores from "../Funnel Calculations/winsoriseZScores";
import getPhi from "../Funnel Calculations/getPhi";
import getTau2 from "../Funnel Calculations/getTau2";

export type limitArgs = {
  p: number;
  q: number;
  target: number;
  target_transformed: number;
  SE: number;
  tau2: number;
  denominators: number;
}

export type limitData = {
  denominators: number;
  ll99: number;
  ll95: number;
  ll68: number;
  ul68: number;
  ul95: number;
  ul99: number;
  target: number;
  alt_target: number;
}

type intervalData = {
  prob: number;
  quantile: number;
  label: string;
}

type chartObjectConstructorT = {
  seFunction: (x: dataObject) => number[];
  seFunctionOD: (x: dataObject) => number[];
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
  seFunction: (x: dataObject) => number[];
  seFunctionOD: (x: dataObject) => number[];
  targetFunction: (x: dataObject) => number;
  targetFunctionTransformed: (x: dataObject) => number;
  yFunction: (x: dataObject) => number[];
  zFunction: (x: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) => number[];
  limitFunction: (x: limitArgs) => number;
  limitFunctionOD: (x: limitArgs) => number;
  odAdjust: boolean;
  tau2: number;
  zScores: number[];
  seOD: number[]

  getPlottingDenominators(): number[] {
    const maxDenominator: number = max(this.inputData.denominators);
    const plotDenomLower: number = 1;
    const plotDenomUpper: number = maxDenominator + maxDenominator * 0.1;
    const plotDenomStep: number = maxDenominator * 0.01;
    return seq(plotDenomLower, plotDenomUpper, plotDenomStep)
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
    if (par.plottingDenominators) {
      const dummyArray: dataObject = JSON.parse(JSON.stringify(this.inputData))
      dummyArray.numerators = null
      dummyArray.denominators = par.plottingDenominators;
      return seFun(dummyArray);
    } else {
      return seFun(this.inputData);
    }
  }

  getY(): number[] {
    return this.yFunction(this.inputData)
  }

  getZ(): number[] {
    return this.zFunction(this.inputData, this.zScores, this.seOD, this.odAdjust, this.tau2);
  }

  getTau2(): number {
    const targetOD: number = this.getTarget({ transformed: true });
    this.seOD = this.getSE({ odAdjust: true });
    const yTransformed: number[] = this.getY();
    this.zScores = getZScores(yTransformed, this.seOD, targetOD);
    const zScoresWinsorized: number[] = winsoriseZScores(this.zScores);
    const phi: number = getPhi(zScoresWinsorized);

    return getTau2(phi, this.seOD);
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
    const q_labels: string[] = ["ll99", "ll95", "ll68", "ul68", "ul95", "ul99"];

    return qs.map((d, idx) => {
      return {
        prob: probs[idx],
        quantile: d,
        label: q_labels[idx]
      }
    });
  }

  getLimits(): limitData[] {
    const calculateTau2: boolean = this.getTau2Bool();
    this.tau2 = this.getTau2();
    let curr_tau2: number;
    if (calculateTau2) {
      curr_tau2 = this.tau2;
      this.odAdjust = this.tau2 > 0;
    } else {
      curr_tau2 = 0;
      this.odAdjust = false;
    }

    const target: number = this.getTarget({ transformed: false });
    const alt_target: number = this.inputSettings.settings.lines.alt_target;
    const target_transformed: number = this.getTarget({ transformed: true });

    const intervals: intervalData[] = this.getIntervals();

    const plottingDenominators: number[] = this.getPlottingDenominators();
    const plottingSE: number[] = this.getSE({
      odAdjust: this.odAdjust,
      plottingDenominators: plottingDenominators
    });

    const calcLimits: limitData[] = plottingDenominators.map((denom, idx) => {
      const calcLimitEntries: [string, number][] = new Array<[string, number]>();
      calcLimitEntries.push(["denominators", denom]);
      intervals.forEach(interval => {
        const functionArgs: limitArgs = {
          p: interval.prob,
          q: interval.quantile,
          target: target,
          target_transformed: target_transformed,
          SE: plottingSE[idx],
          tau2: curr_tau2,
          denominators: denom
        };

        const limit: number = this.getSingleLimit({
          odAdjust: this.odAdjust,
          inputArgs: functionArgs
        });

        calcLimitEntries.push([interval.label, limit])
      });
      calcLimitEntries.push(["target", target]);
      calcLimitEntries.push(["alt_target", alt_target]);
      return Object.fromEntries(calcLimitEntries) as limitData;
    });

    return calcLimits.map((d, idx) => {
      const inner = d;
      if (idx < (calcLimits.length - 1)) {
        ["99", "95", "68"].forEach(type => {
          const lower: string = `ll${type}`;
          const upper: string = `ul${type}`;
          if (inner[lower] > calcLimits[idx + 1][lower]) {
            inner[lower] = undefined;
          }
          if (inner[upper] < calcLimits[idx + 1][upper]) {
            inner[upper] = undefined;
          }
          if (inner[lower] >= inner[upper]) {
            inner[lower] = undefined;
            inner[upper] = undefined;
          }
        })
      }
      return inner;
    });
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
