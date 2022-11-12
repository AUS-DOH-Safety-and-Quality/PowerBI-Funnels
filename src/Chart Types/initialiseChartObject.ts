import prFunnelObject from "./proportion";
import smrFunnelObject from "./indirectlyStandardisedRatio";
import rcFunnelObject from "./ratioCounts";
import dataObject from "../Classes/dataObject";
import chartObject from "../Classes/chartObject";
import settingsObject from "../Classes/settingsObject";

const allCharts = {
  SR: smrFunnelObject,
  PR: prFunnelObject,
  RC: rcFunnelObject
}

function initialiseChartObject(args: { inputData: dataObject,
                                       inputSettings: settingsObject}): chartObject {
  let data_type: string = args.inputData.data_type as keyof typeof allCharts;
  return new allCharts[data_type](args);
}

export default initialiseChartObject;
