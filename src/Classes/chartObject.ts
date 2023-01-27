import * as d3 from "d3";
import * as stats from '@stdlib/stats/base/dists';
import seq from "../Functions/seq"
import limitData from "./limitData";
import intervalData from "./intervalData";
import dataObject from "./dataObject";
import limitArguments from "./limitArgs";
import getZScores from "../Funnel Calculations/getZScores";
import winsoriseZScores from "../Funnel Calculations/winsoriseZScores";
import getPhi from "../Funnel Calculations/getPhi";
import getTau2 from "../Funnel Calculations/getTau2";
import settingsObject from "./settingsObject";

type chartObjectConstructorT = {
  seFunction: (x: dataObject) => number[];
  seFunctionOD: (x: dataObject) => number[];
  targetFunction: (x: dataObject) => number;
  targetFunctionTransformed: (x: dataObject) => number;
  yFunction: (x: dataObject) => number[];
  limitFunction: (x: limitArguments) => number;
  limitFunctionOD: (x: limitArguments) => number;
  inputData: dataObject;
  inputSettings: settingsObject;
}

class chartObject {
  inputData: dataObject;
  inputSettings: settingsObject;
  seFunction: (x: dataObject) => number[];
  seFunctionOD: (x: dataObject) => number[];
  targetFunction: (x: dataObject) => number;
  targetFunctionTransformed: (x: dataObject) => number;
  yFunction: (x: dataObject) => number[];
  limitFunction: (x: limitArguments) => number;
  limitFunctionOD: (x: limitArguments) => number;

  getPlottingDenominators(): number[] {
    let maxDenominator: number = d3.max(this.inputData.denominator);
    let plotDenomLower: number = 1;
    let plotDenomUpper: number = maxDenominator + maxDenominator * 0.1;
    let plotDenomStep: number = maxDenominator * 0.01;
    return seq(plotDenomLower, plotDenomUpper, plotDenomStep)
            .concat(this.inputData.denominator)
            .sort((a, b) => a - b);
  };

  getTarget(par: { transformed: boolean }): number {
    let targetFun = par.transformed ? this.targetFunctionTransformed : this.targetFunction;
    return targetFun(this.inputData)
  };

  getSE(par: { odAdjust: boolean, plottingDenominators?: number[] }): number[] {
    let seFun = par.odAdjust ? this.seFunctionOD : this.seFunction;
    if (par.plottingDenominators) {
      let dummyArray: dataObject = JSON.parse(JSON.stringify(this.inputData))
      dummyArray.numerator = null
      dummyArray.denominator = par.plottingDenominators;
      return seFun(dummyArray);
    } else {
      return seFun(this.inputData);
    }
  };

  getY(): number[] {
    return this.yFunction(this.inputData)
  };

  getTau2(): number {
    let targetOD: number = this.getTarget({ transformed: true });
    let seOD: number[] = this.getSE({ odAdjust: true });
    let yTransformed: number[] = this.getY();
    let zScores: number[] = getZScores(yTransformed, seOD, targetOD);
    let zScoresWinsorized: number[] = winsoriseZScores(zScores);
    let phi: number = getPhi(zScoresWinsorized);

    return getTau2(phi, seOD);
  };

  getTau2Bool(): boolean {
    if (this.inputSettings.funnel.od_adjust.value === "yes") {
      return true;
    } else if (this.inputSettings.funnel.od_adjust.value === "no") {
      return false;
    } else if (this.inputSettings.funnel.od_adjust.value === "auto") {
      return true;
    }
  };

  getSingleLimit(par: { odAdjust: boolean, inputArgs: limitArguments }): number {
    let limitFun = par.odAdjust ? this.limitFunctionOD : this.limitFunction;
    return limitFun(par.inputArgs);
  }

  getIntervals(): intervalData[] {
    // Specify the intervals for the limits: 95% and 99.8%
    let qs: number[] = [0.001, 0.025, 0.975, 0.999]
                         .map(p => stats.normal.quantile(p, 0, 1));
    let q_labels: string[] = ["ll99", "ll95", "ul95", "ul99"];

    return qs.map((d, idx) => new intervalData({
      quantile: d,
      label: q_labels[idx]
    }));
  }

  getLimits(): limitData[] {
    let calculateTau2: boolean = this.getTau2Bool();
    let odAdjust: boolean;
    let tau2: number;
    if (calculateTau2) {
      tau2 = this.getTau2();
      odAdjust = tau2 > 0;
    } else {
      tau2 = 0;
      odAdjust = false;
    }

    let target: number = this.getTarget({ transformed: false });
    let alt_target: number = this.inputSettings.funnel.alt_target.value;
    let target_transformed: number = this.getTarget({ transformed: true });

    let intervals: intervalData[] = this.getIntervals();

    let plottingDenominators: number[] = this.getPlottingDenominators();
    let plottingSE: number[] = this.getSE({
      odAdjust: odAdjust,
      plottingDenominators: plottingDenominators
    });

    let calcLimits: limitData[] = plottingDenominators.map((denom, idx) => {
      let calcLimit: limitData = new limitData(denom);
      intervals.forEach(interval => {
        let functionArgs: limitArguments = new limitArguments({
          q: interval.quantile,
          target: target,
          target_transformed: target_transformed,
          SE: plottingSE[idx],
          tau2: tau2,
          denominator: denom
        });

        let limit: number = this.getSingleLimit({
          odAdjust: odAdjust,
          inputArgs: functionArgs
        });

        calcLimit[interval.label] = limit
      });
      calcLimit.target = target;
      calcLimit.alt_target = alt_target;
      return calcLimit;
    });

    return calcLimits.map((d, idx) => {
      let inner = d;
      if (idx < (calcLimits.length - 1)) {
        inner.ll99 = d.ll99 < calcLimits[idx + 1].ll99 ? d.ll99 : null;
        inner.ll95 = d.ll95 < calcLimits[idx + 1].ll95 ? d.ll95 : null;
        inner.ul95 = d.ul95 > calcLimits[idx + 1].ul95 ? d.ul95 : null;
        inner.ul99 = d.ul99 > calcLimits[idx + 1].ul99 ? d.ul99 : null;
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
    this.limitFunction = args.limitFunction;
    this.limitFunctionOD = args.limitFunctionOD;
    this.inputData = args.inputData;
    this.inputSettings = args.inputSettings;
  }
}

export default chartObject;
