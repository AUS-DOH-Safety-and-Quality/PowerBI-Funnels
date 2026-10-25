import { at } from "powerbi-visuals-core/util";
import { indicatorFields, limitValue, type FrontendChart } from "powerbi-visuals-core/frontends";
import { checkFlagDirection } from "powerbi-visuals-core/data";
import { limitStatus } from "powerbi-visuals-core/spc";
import { Visual } from "./visual";
import settingsModel from "./settings";
import type { limitData } from "./Classes";
import type { funnelResult } from "./Classes/viewModelClass";

type LimitRow = Record<string, string | number | null>;

const limitColumns = [
  "denominator", "group", "numerator", "value", "z", "score", "two_sigma", "three_sigma",
  "target", "alt_target", "ll99", "ll95", "ll68", "ul68", "ul95", "ul99"
] as const;

/** The fields, then the limits other than the denominator they were calculated at */
function limitRow(fields: Readonly<Record<string, string | number | undefined>>, limits: Readonly<limitData>,
                  includeAltTarget: boolean): LimitRow {
  const row: LimitRow = {};
  const fieldEntries = Object.entries(fields);
  for (let i = 0; i < fieldEntries.length; i++) {
    const [name, value] = at(fieldEntries, i);
    row[name] = limitValue(value);
  }
  const limitEntries = Object.entries<number | undefined>(limits);
  for (let i = 0; i < limitEntries.length; i++) {
    const [name, value] = at(limitEntries, i);
    if (name !== "denominators" && (includeAltTarget || name !== "alt_target")) {
      row[name] = limitValue(value);
    }
  }
  return row;
}

function appendResults(rows: LimitRow[], rowIds: number[], limitLines: LimitRow[], result: funnelResult, showScore: boolean): void {
  const settings = result.settings;
  const showAltTarget = settings.lines.alt_target != null;
  const points = result.points.slice().sort((a, b) => a.x - b.x);
  const indicators = indicatorFields(result.indicators, limitColumns);
  for (let i = 0; i < points.length; i++) {
    const point = at(points, i);
    const fields: Record<string, string | number | undefined> = {
      ...indicators,
      denominator: point.x,
      group: point.group_text,
      numerator: point.numerator,
      value: point.value,
      z: point.z
    };
    if (showScore) {
      fields.score = point.z * (settings.outliers.improvement_direction === "decrease" ? -1 : 1);
    }
    if (settings.outliers.two_sigma) {
      fields.two_sigma = showScore
        ? checkFlagDirection(limitStatus(point.value, point.limits.ll95, point.limits.ul95), settings.outliers)
        : point.two_sigma;
    }
    if (settings.outliers.three_sigma || showScore) {
      fields.three_sigma = point.three_sigma;
    }
    rows.push(limitRow(fields, point.limits, showAltTarget));
    rowIds.push(point.id);
  }
  for (let i = 0; i < result.limits.length; i++) {
    const limits = at(result.limits, i);
    limitLines.push(limitRow({ ...indicators, denominator: limits.denominators }, limits, showAltTarget));
  }
}

export const frontend: FrontendChart<Visual> = {
  Visual,
  settingsModel,
  limitColumns,
  limits: visual => {
    const viewModel = visual.viewModel;
    const limits: LimitRow[] = [];
    const rowIds: number[] = [];
    const limitLines: LimitRow[] = [];
    for (let i = 0; i < viewModel.funnelResults.length; i++) {
      appendResults(limits, rowIds, limitLines, at(viewModel.funnelResults, i), viewModel.showMisc);
    }
    return { limits, rowIds, limitLines };
  }
};
