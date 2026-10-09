import type { limitData } from "../Classes";
import type viewModelClass from "../Classes/viewModelClass";

// Each point joined to the limits at its denominator
export default function downloadRows(viewModel: viewModelClass): Record<string, unknown>[] {
  const points = viewModel.plotPoints;
  const limits = viewModel.calculatedLimits;
  const rows = new Array<Record<string, unknown>>(points.length);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    let limit: limitData | undefined;
    for (let j = 0; j < limits.length; j++) {
      if (limits[j].denominators === point.x) {
        limit = limits[j];
        break;
      }
    }
    rows[i] = {
      group: point.group_text, numerator: point.numerator, denominator: point.x, value: point.value,
      target: limit?.target, alt_target: limit?.alt_target,
      ll99: limit?.ll99, ll95: limit?.ll95, ll68: limit?.ll68, ul68: limit?.ul68, ul95: limit?.ul95, ul99: limit?.ul99,
      two_sigma: point.two_sigma, three_sigma: point.three_sigma
    };
  }
  return rows;
}
