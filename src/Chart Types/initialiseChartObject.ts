import prFunnelObject from "./proportion";
import smrFunnelObject from "./indirectlyStandardisedRatio";
import rcFunnelObject from "./ratioCounts";
import dataArray from "../Classes/dataArray";
import chartObject from "../Classes/chartObject";

const allCharts = {
  SR: smrFunnelObject,
  PR: prFunnelObject,
  RC: rcFunnelObject
}

function initialiseChartObject(inputData: dataArray): chartObject {
  let data_type: string = inputData.data_type as keyof typeof allCharts;

  return new allCharts[data_type](inputData);
}

export default initialiseChartObject;
