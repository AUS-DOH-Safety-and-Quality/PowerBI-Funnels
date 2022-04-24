import prFunnelObject from "./proportion";
import smrFunnelObject from "./indirectlyStandardisedRatio";
import rcFunnelObject from "./ratioCounts";
import { dataArray } from "../Classes/Interfaces";
import chartObject from "../Classes/chartObject";

class allCharts {
  SR = smrFunnelObject;
  PR = prFunnelObject;
  RC = rcFunnelObject;
}

function initialiseChartObject(inputData: dataArray): chartObject {
  let rtnObject: chartObject = allCharts[inputData.data_type];
  rtnObject.inputData = inputData;

  return rtnObject;
}

export default initialiseChartObject;
