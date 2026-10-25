import { at } from "powerbi-visuals-core/util";
import { max } from "powerbi-visuals-core/math";
import type { AxisBounds } from "powerbi-visuals-core/rendering";
import type viewModelClass from "../Classes/viewModelClass";

/** Explicit axis limits win; otherwise x spans the denominators with headroom and y the plotted values */
export default function axisRanges(viewModel: viewModelClass): { x: AxisBounds; y: AxisBounds } {
  const inputData = viewModel.inputData;
  if (inputData === undefined) {
    throw new Error("Axis ranges require validated data.");
  }
  const settings = viewModel.inputSettings.group(0).settings;
  let yUpperLimit = settings.y_axis.ylimit_u;
  if (yUpperLimit === undefined) {
    // Automatic bound follows the plotted (transformed and scaled) values
    yUpperLimit = -Infinity;
    for (let i = 0; i < viewModel.plotPoints.length; i++) {
      yUpperLimit = Math.max(yUpperLimit, at(viewModel.plotPoints, i).value);
    }
  }
  return {
    x: { lower: settings.x_axis.xlimit_l ?? 0, upper: settings.x_axis.xlimit_u ?? max(inputData.denominators) * 1.1 },
    y: { lower: settings.y_axis.ylimit_l ?? 0, upper: yUpperLimit }
  };
}
