import { at } from "powerbi-visuals-core/util";
import type powerbi from "powerbi-visuals-api";
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import settingsClass, { type groupSettings } from "./settingsClass";
import settingsModel from "../settings";
import miscFormattingSchema from "../Functions/miscFormattingSchema";
import type { settingsValueType } from "../settings";
import {
  buildFormattingModel, formatPrimitiveValue, groupCategoryRows, labelledMessage, rowIdentity,
  type CategoryGroups, type FormattingItem, type FormattingModel, type ValidatedDataView
} from "powerbi-visuals-core/powerbi";
import type { chartClass, limitData } from "../Classes";
import extractInputData, { lacksCount, type dataObject } from "../Functions/extractInputData";
import axisRanges from "../Functions/axisRanges";
import buildTooltip from "../Functions/buildTooltip";
import { clamp } from "powerbi-visuals-core/math";
import { checkFlagDirection, applyFlagColours, type DerivedScaling, type FlagDirection, type FlagSettings } from "powerbi-visuals-core/data";
import { limitStatus } from "powerbi-visuals-core/spc";
import { limitColumns, limitLineNames, type StandardLineName } from "powerbi-visuals-core/settings";
import type { TableColumn } from "powerbi-visuals-core/rendering";
import * as chartObjects from "../Chart Types"
import getTransformation from "../Funnel Calculations/getTransformation";

import { PlotViewModelBase, type AxisBounds, type GroupResults } from "powerbi-visuals-core/rendering";

export type lineData = {
  readonly x: number;
  readonly line_value: number | undefined;
  readonly group: StandardLineName;
}

/** The point's limits with its own values and flags */
export type summaryTableRow = Omit<limitData, "denominators"> & {
  readonly group: string;
  readonly numerator: number;
  readonly denominator: number;
  readonly value: number;
  readonly two_sigma: FlagDirection;
  readonly three_sigma: FlagDirection;
};

export type plotData = {
  readonly id: number;
  readonly x: number;
  readonly numerator: number;
  readonly value: number;
  readonly z: number;
  readonly group_text: string;
  /** Limits at this point's denominator */
  readonly limits: Readonly<limitData>;
  readonly table_row: summaryTableRow;
  readonly aesthetics: settingsValueType["scatter"];
  readonly identity: ISelectionId;
  /** Highlighted by selections in other visuals */
  readonly highlighted: boolean;
  readonly tooltip: VisualTooltipDataItem[];
  readonly label: {
    readonly text_value: string | undefined,
    readonly aesthetics: settingsValueType["labels"],
    angle: number | undefined,
    distance: number | undefined
  };
  readonly two_sigma: FlagDirection;
  readonly three_sigma: FlagDirection;
}

export type miscPoint = plotData & { indicator: string; score: number };

export type funnelResult = {
  readonly indicators: Readonly<Record<string, string | undefined>>;
  readonly points: readonly plotData[];
  readonly limits: readonly limitData[];
  readonly settings: settingsValueType;
};

/** The group, value, counts and shown lines, then the flagged patterns */
function tableColumns(settings: settingsValueType): TableColumn[] {
  const columns: TableColumn[] = [{ name: "group", label: settings.funnel.ttip_label_group }, { name: "value", label: "Value" }];
  if (settings.funnel.ttip_show_numerator) {
    columns.push({ name: "numerator", label: "Numerator" });
  }
  if (settings.funnel.ttip_show_denominator) {
    columns.push({ name: "denominator", label: "Denominator" });
  }
  columns.push(...limitColumns(settings.lines, true));
  if (settings.outliers.three_sigma) {
    columns.push({ name: "three_sigma", label: "Three Sigma" });
  }
  if (settings.outliers.two_sigma) {
    columns.push({ name: "two_sigma", label: "Two Sigma" });
  }
  return columns;
}

export default class viewModelClass extends PlotViewModelBase<typeof settingsModel, DerivedScaling, "numerators" | "denominators"> {
  inputData: dataObject | undefined = undefined;
  chartBase: chartClass | undefined = undefined;
  calculatedLimits: limitData[] = [];
  plotPoints: plotData[] = [];
  tableColumns: TableColumn[] = [];
  groupedLines: [StandardLineName, lineData[]][] = [];
  funnelResults: funnelResult[] = [];
  /** Indicators switch the view to the multi-indicator chart */
  showMisc = false;
  /** The groups the MISC pane offers, and the one chosen */
  miscGroups: FormattingItem[] = [];
  miscGroup = "";
  miscPoints: miscPoint[] = [];
  miscAnyHighlights = false;

  constructor(host: IVisualHost) {
    super(host, new settingsClass(), ["numerators", "denominators"]);
  }

  /** The limits form one labelled period */
  get periodEnds(): number[] {
    return [this.calculatedLimits.length - 1];
  }

  get anyLabels(): boolean {
    return this.inputData?.anyLabels ?? false;
  }

  /** The MISC pane with its group choices, or the funnel pane without the MISC card */
  override getFormattingModel(): FormattingModel {
    const settings = this.inputSettings.group(0).settings;
    if (this.showMisc) {
      return buildFormattingModel(miscFormattingSchema(this.miscGroups), { ...settings, misc: { ...settings.misc, group: this.miscGroup } });
    }
    const { misc, ...funnelModel } = settingsModel;
    return buildFormattingModel(funnelModel, settings);
  }

  /** The MISC chart has no axes */
  protected get hasAxes(): boolean {
    return !this.showMisc;
  }

  axisRanges(): { x: AxisBounds; y: AxisBounds } {
    return axisRanges(this);
  }

  protected reset(): void {
    this.inputData = undefined;
    this.chartBase = undefined;
    this.calculatedLimits = [];
    this.plotPoints = [];
    this.groupedLines = [];
    this.funnelResults = [];
    this.miscPoints = [];
    this.miscAnyHighlights = false;
  }

  protected updateData(view: ValidatedDataView<"numerators" | "denominators">, indicatorGroups: CategoryGroups,
                       host: IVisualHost): GroupResults {
    this.showMisc = (view.categories.indicator ?? []).length > 0;
    this.funnelResults = [];
    this.miscGroups = [];
    this.miscPoints = [];
    this.miscAnyHighlights = false;
    if (this.showMisc) {
      return this.initialiseMisc(view, host, indicatorGroups);
    }
    const result = extractInputData(view, this.inputSettings, at(indicatorGroups.rows, 0));
    if (result.status === "invalid") {
      return { errors: [result.error], warnings: [] };
    }
    const group = this.inputSettings.group(0);
    if (lacksCount(result.data, group.settings.funnel.chart_type)) {
      return { errors: ["All numerators are zero, so RC limits cannot be calculated."], warnings: [] };
    }
    this.inputData = result.data;
    this.chartBase = new chartObjects[group.settings.funnel.chart_type](result.data, group);
    this.calculatedLimits = this.chartBase.getLimits();
    this.scaleAndTruncateLimits();
    this.initialisePlotData(host, result.data, this.chartBase);
    this.funnelResults.push({ indicators: {}, points: this.plotPoints, limits: this.calculatedLimits, settings: group.settings });
    this.initialiseGroupedLines();
    return { errors: [], warnings: result.data.warningMessage === "" ? [] : [result.data.warningMessage] };
  }

  private initialiseMisc(view: ValidatedDataView<"numerators" | "denominators">, host: IVisualHost,
    indicators: CategoryGroups): GroupResults {
    const keyColumn = at(view.categories.key, 0);
    const groups = groupCategoryRows([keyColumn], keyColumn.values.length);
    const items = this.miscGroups;
    const rowsByGroup = new Map<string, number[]>();
    for (let i = 0; i < groups.rows.length; i++) {
      const rows = at(groups.rows, i);
      const key = at(groups.keys, i);
      if (keyColumn.values[at(rows, 0)] == null) {
        continue;
      }
      items.push({ displayName: at(at(groups.names, i), 0), value: key });
      rowsByGroup.set(key, rows);
    }
    // One group is shown for the whole chart, so every row must ask for the same one
    const requested = this.inputSettings.group(0).settings.misc.group;
    for (let i = 0; i < this.inputSettings.rowSettings.length; i++) {
      const rows = at(this.inputSettings.rowSettings, i);
      for (let j = 0; j < rows.length; j++) {
        if (at(rows, j).misc.group !== requested) {
          return { errors: ["The MISC group must be the same for every row."], warnings: [] };
        }
      }
    }
    // The pane stores a group's key; conditional formatting gives its name
    this.miscGroup = requested === "" ? items[0]?.value ?? requested : requested;
    for (let i = 0; i < items.length; i++) {
      const item = at(items, i);
      if (item.value === requested || item.displayName === requested) {
        this.miscGroup = item.value;
        break;
      }
    }
    const targetRows = rowsByGroup.get(this.miscGroup);
    if (targetRows === undefined) {
      return { errors: ["Select a MISC group present in the data."], warnings: [] };
    }
    const selectedRows = new Set(targetRows);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.inputData = undefined;
    for (let i = 0; i < indicators.rows.length; i++) {
      const rows = at(indicators.rows, i);
      const group = this.inputSettings.group(i);
      const indicator = at(indicators.labels, i);
      const rowSettings = at(this.inputSettings.rowSettings, i);
      const direction = at(rowSettings, 0).outliers.improvement_direction;
      let oneDirection = direction !== "neutral";
      for (let j = 1; oneDirection && j < rowSettings.length; j++) {
        oneDirection = at(rowSettings, j).outliers.improvement_direction === direction;
      }
      if (!oneDirection) {
        errors.push(labelledMessage(indicator, "Each MISC indicator must have one improvement direction: increase or decrease."));
        continue;
      }
      const result = extractInputData(view, this.inputSettings, rows, i);
      if (result.status === "invalid") {
        errors.push(labelledMessage(indicator, result.error));
        continue;
      }
      const data = result.data;
      if (lacksCount(data, group.settings.funnel.chart_type)) {
        warnings.push(labelledMessage(indicator, "All numerators are zero, so RC limits cannot be calculated and the indicator is not shown."));
        continue;
      }
      this.inputData ??= data;
      if (data.warningMessage !== "") {
        warnings.push(labelledMessage(indicator, data.warningMessage));
      }
      this.miscAnyHighlights ||= data.anyHighlights;
      const chart = new chartObjects[group.settings.funnel.chart_type](data, group);
      this.calculatedLimits = chart.getLimits();
      this.scaleAndTruncateLimits(group);
      // Bars colour by three-sigma status whatever the outlier toggles say
      this.initialisePlotData(host, data, chart, group, { two_sigma: false, three_sigma: true });
      const indicatorValues: Record<string, string | undefined> = {};
      const indicatorColumns = view.categories.indicator ?? [];
      for (let j = 0; j < indicatorColumns.length; j++) {
        const column = at(indicatorColumns, j);
        indicatorValues[column.source.displayName] = formatPrimitiveValue(column.values[at(rows, 0)]);
      }
      this.funnelResults.push({
        indicators: indicatorValues, points: this.plotPoints, limits: this.calculatedLimits, settings: group.settings
      });
      for (let j = 0; j < data.id.length; j++) {
        const row = at(data.id, j);
        if (!selectedRows.has(row)) {
          continue;
        }
        const point = at(this.plotPoints, j);
        const score = point.z * (direction === "decrease" ? -1 : 1);
        this.miscPoints.push({
          ...point,
          indicator,
          score,
          tooltip: [
            { displayName: "Indicator", value: indicator },
            { displayName: "Z-score", value: score.toFixed(3) },
            ...point.tooltip
          ]
        });
      }
    }
    this.chartBase = undefined;
    this.calculatedLimits = [];
    this.plotPoints = [];
    this.groupedLines = [];
    if (errors.length === 0 && (this.inputData === undefined || this.miscPoints.length === 0)) {
      errors.push("The selected MISC group has no valid indicator results.");
    }
    return { errors, warnings };
  }

  /** Points are flagged against the limits the flags name; by default those the outlier settings turn on */
  initialisePlotData(host: IVisualHost, inputData: dataObject, chart: chartClass, inputSettings: groupSettings = this.inputSettings.group(0),
                     flags: { readonly two_sigma: boolean; readonly three_sigma: boolean } = inputSettings.settings.outliers): void {
    this.plotPoints = new Array<plotData>();
    this.tableColumns = tableColumns(inputSettings.settings);
    const transform: (x: number) => number = getTransformation(inputSettings.settings.funnel.transformation);
    const multiplier: number = inputSettings.derivedSettings.multiplier;
    const flag_two_sigma: boolean = flags.two_sigma;
    const flag_three_sigma: boolean = flags.three_sigma;
    const zScores = chart.getZ();
    const flagSettings: FlagSettings = {
      process_flag_type: inputSettings.settings.outliers.process_flag_type,
      improvement_direction: inputSettings.settings.outliers.improvement_direction
    };
    const limitsByDenominator = new Map<number, limitData>();
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      const limit = at(this.calculatedLimits, i);
      limitsByDenominator.set(limit.denominators, limit);
    }

    for (let i: number = 0; i < inputData.id.length; i++) {
      const original_index: number = at(inputData.id, i);
      const numerator: number = at(inputData.numerators, i);
      const denominator: number = at(inputData.denominators, i);
      const value: number = transform((numerator / denominator) * multiplier);
      const limits = limitsByDenominator.get(denominator);
      if (limits === undefined) {
        throw new Error("Missing limits for an observed denominator.");
      }
      // Rows may share the store's default settings, so colour a copy
      const aesthetics = { ...at(inputData.scatter_formatting, i) };
      if (this.colourPalette.isHighContrast) {
        aesthetics.colour = this.colourPalette.foregroundColour;
      }
      const two_sigma_outlier = checkFlagDirection(flag_two_sigma ? limitStatus(value, limits.ll95, limits.ul95) : "none", flagSettings);
      const three_sigma_outlier = checkFlagDirection(flag_three_sigma ? limitStatus(value, limits.ll99, limits.ul99) : "none", flagSettings);
      const category = at(inputData.keys, i).label;
      // A three-sigma flag outranks a two-sigma one
      applyFlagColours(aesthetics, inputSettings.settings.outliers, [
        [two_sigma_outlier, "two_sigma_colour"], [three_sigma_outlier, "three_sigma_colour"]
      ] as const);

      this.plotPoints.push({
        id: original_index,
        x: denominator,
        numerator: numerator,
        value: value,
        z: at(zScores, i),
        group_text: category,
        limits,
        table_row: {
          group: category, numerator, denominator, value,
          target: limits.target, alt_target: limits.alt_target,
          ll99: limits.ll99, ll95: limits.ll95, ll68: limits.ll68, ul68: limits.ul68, ul95: limits.ul95, ul99: limits.ul99,
          two_sigma: two_sigma_outlier, three_sigma: three_sigma_outlier
        },
        aesthetics: aesthetics,
        identity: rowIdentity(host, inputData.identityColumns, original_index),
        highlighted: inputData.highlights[i] !== undefined,
        tooltip: buildTooltip(
          i,
          limits,
          { two_sigma: two_sigma_outlier !== "none", three_sigma: three_sigma_outlier !== "none" },
          inputData,
          inputSettings.settings,
          inputSettings.derivedSettings
        ),
        label: {
          text_value: inputData.labels[i],
          aesthetics: at(inputData.label_formatting, i),
          angle: undefined,
          distance: undefined
        },
        two_sigma: two_sigma_outlier,
        three_sigma: three_sigma_outlier
      })
    }
  }

  initialiseGroupedLines(): void {
    const lineSettings = this.inputSettings.group(0).settings.lines;
    const lines: [StandardLineName, lineData[]][] = [];
    if (lineSettings.show_target) {
      lines.push(["target", []]);
    }
    if (lineSettings.show_alt_target) {
      lines.push(["alt_target", []]);
    }
    if (lineSettings.show_99) {
      lines.push(["ll99", []], ["ul99", []]);
    }
    if (lineSettings.show_95) {
      lines.push(["ll95", []], ["ul95", []]);
    }
    if (lineSettings.show_68) {
      lines.push(["ll68", []], ["ul68", []]);
    }
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      const limits = at(this.calculatedLimits, i);
      for (let j = 0; j < lines.length; j++) {
        const [label, points] = at(lines, j);
        points.push({ x: limits.denominators, line_value: limits[label], group: label });
      }
    }
    this.groupedLines = lines;
  }

  /** Flags follow the truncated limits; the alt. target is entered in display units, so is not multiplied */
  scaleAndTruncateLimits(inputSettings: groupSettings = this.inputSettings.group(0)): void {
    const multiplier: number = inputSettings.derivedSettings.multiplier;
    const transform: (x: number) => number = getTransformation(inputSettings.settings.funnel.transformation);
    const lower: number | undefined = inputSettings.settings.funnel.ll_truncate;
    const upper: number | undefined = inputSettings.settings.funnel.ul_truncate;
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      const limit = at(this.calculatedLimits, i);
      limit.target = transform(limit.target * multiplier);
      for (let j = 0; j < limitLineNames.length; j++) {
        const name = at(limitLineNames, j);
        const value = limit[name];
        if (value !== undefined) {
          limit[name] = clamp(transform(value * multiplier), lower, upper);
        }
      }
      if (limit.alt_target !== undefined) {
        limit.alt_target = transform(limit.alt_target);
      }
    }
  }
}
