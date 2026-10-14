import { limitValue, type FrontendChart } from "powerbi-visuals-core/frontends";
import { Visual } from "./visual";
import settingsModel, { type settingsValueType } from "./settings";
import type { limitData } from "./Classes";
import type { miscPoint, plotData } from "./Classes/viewModelClass";

type LimitRow = Record<string, string | number | null>;

/** The fields, then the limits other than the denominator they were calculated at */
function limitRow(fields: Readonly<Record<string, string | number | undefined>>, limits: Readonly<limitData>,
                  includeAltTarget: boolean): LimitRow {
  const row: LimitRow = {};
  const fieldNames = Object.keys(fields);
  for (let i = 0; i < fieldNames.length; i++) {
    row[fieldNames[i]] = limitValue(fields[fieldNames[i]]);
  }
  const limitValues: Readonly<Record<string, number | undefined>> = limits;
  const limitNames = Object.keys(limitValues);
  for (let i = 0; i < limitNames.length; i++) {
    const name = limitNames[i];
    if (name !== "denominators" && (includeAltTarget || name !== "alt_target")) {
      row[name] = limitValue(limitValues[name]);
    }
  }
  return row;
}

function funnelLimits(plotPoints: readonly plotData[], outlierSettings: settingsValueType["outliers"], showAltTarget: boolean): LimitRow[] {
  const points = plotPoints.slice().sort((a, b) => a.x - b.x);
  const rows = new Array<LimitRow>(points.length);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const fields: Record<string, string | number> = {
      denominator: point.x,
      group: point.group_text,
      numerator: point.numerator,
      value: point.value,
      z: point.z
    };
    if (outlierSettings.two_sigma) {
      fields.two_sigma = point.two_sigma;
    }
    if (outlierSettings.three_sigma) {
      fields.three_sigma = point.three_sigma;
    }
    rows[i] = limitRow(fields, point.limits, showAltTarget);
  }
  return rows;
}

function miscLimits(miscPoints: readonly miscPoint[]): LimitRow[] {
  const rows = new Array<LimitRow>(miscPoints.length);
  for (let i = 0; i < miscPoints.length; i++) {
    const point = miscPoints[i];
    rows[i] = limitRow({
      indicator: point.indicator,
      group: point.group_text,
      z: point.z,
      score: point.score,
      three_sigma: point.three_sigma,
      numerator: point.numerator,
      denominator: point.x,
      value: point.value
    }, point.limits, false);
  }
  return rows;
}

export const frontend: FrontendChart<Visual> = {
  Visual,
  settingsModel,
  /** Multi-indicator charts return a row per indicator; funnels also return the limit lines they were drawn from */
  limits: visual => {
    const viewModel = visual.viewModel;
    if (viewModel.showMisc) {
      return { limits: miscLimits(viewModel.miscPoints) };
    }
    const settings = viewModel.inputSettings.settings[0];
    const showAltTarget = settings.lines.alt_target != null;
    const limitLines = new Array<LimitRow>(viewModel.calculatedLimits.length);
    for (let i = 0; i < limitLines.length; i++) {
      const limits = viewModel.calculatedLimits[i];
      limitLines[i] = limitRow({ denominator: limits.denominators }, limits, showAltTarget);
    }
    return { limits: funnelLimits(viewModel.plotPoints, settings.outliers, showAltTarget), limitLines };
  }
};
