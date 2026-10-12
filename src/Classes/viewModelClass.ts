import type powerbi from "powerbi-visuals-api";
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import settingsClass from "./settingsClass";
import type { settingsValueType } from "../settings";
import {
  groupCategoryRows, labelledMessage, readColourPalette, rowIdentity, validateDataView,
  type CategoryGroups, type ColourPalette, type FormattingItem, type FormattingModel, type UpdateOptions, type ValidatedDataView
} from "powerbi-visuals-core/powerbi";
import { chartClass, type limitData } from "../Classes"
import extractInputData, { type dataObject } from "../Functions/extractInputData";
import axisRanges from "../Functions/axisRanges";
import buildTooltip from "../Functions/buildTooltip";
import { clamp } from "powerbi-visuals-core/math";
import { groupBy, checkFlagDirection, applyFlagColours, type FlagDirection } from "powerbi-visuals-core/data";
import { limitStatus } from "powerbi-visuals-core/spc";
import { limitLineNames, type StandardLineName } from "powerbi-visuals-core/settings";
import type { TableColumn } from "powerbi-visuals-core/rendering";
import * as chartObjects from "../Chart Types"
import getTransformation from "../Funnel Calculations/getTransformation";

import { axisRangeError, type ErrorKind } from "powerbi-visuals-core/rendering";

export type viewModelValidationT =
  | { status: true; data: dataObject; warning?: string }
  | { status: false; error: string; type?: ErrorKind };

export type lineData = {
  x: number;
  line_value: number | undefined;
  group: StandardLineName;
}

export type summaryTableRow = {
  group: string;
  numerator: number;
  denominator: number;
  value: number;
  target: number;
  alt_target: number | undefined;
  ll99: number | undefined;
  ll95: number | undefined;
  ll68: number | undefined;
  ul68: number | undefined;
  ul95: number | undefined;
  ul99: number | undefined;
  two_sigma: FlagDirection;
  three_sigma: FlagDirection;
};

export type plotData = {
  x: number;
  numerator: number;
  value: number;
  z: number;
  group_text: string;
  /** Limits at this point's denominator */
  limits: limitData;
  table_row: summaryTableRow;
  aesthetics: settingsValueType["scatter"];
  identity: ISelectionId;
  /** Highlighted by selections in other visuals */
  highlighted: boolean;
  tooltip: VisualTooltipDataItem[];
  label: {
    text_value: string | undefined,
    aesthetics: settingsValueType["labels"],
    angle: number | undefined,
    distance: number | undefined
  };
  two_sigma: FlagDirection;
  three_sigma: FlagDirection;
}

export type miscPoint = plotData & { indicator: string; score: number };

/** The group, value, counts and shown lines, then the flagged patterns */
function tableColumns(settings: settingsValueType): TableColumn[] {
  const lines = settings.lines;
  const columns: TableColumn[] = [{ name: "group", label: settings.funnel.ttip_label_group }, { name: "value", label: "Value" }];
  if (settings.funnel.ttip_show_numerator) {
    columns.push({ name: "numerator", label: "Numerator" });
  }
  if (settings.funnel.ttip_show_denominator) {
    columns.push({ name: "denominator", label: "Denominator" });
  }
  const levels = ["99", "95", "68"] as const;
  for (let l = 0; l < levels.length; l++) {
    const level = levels[l];
    if (lines[`show_${level}`]) {
      columns.push({ name: `ul${level}`, label: `${lines[`ttip_label_${level}_prefix_upper`]}${lines[`ttip_label_${level}`]}` });
    }
  }
  if (lines.show_target) {
    columns.push({ name: "target", label: lines.ttip_label_target });
  }
  if (lines.show_alt_target) {
    columns.push({ name: "alt_target", label: lines.ttip_label_alt_target });
  }
  for (let l = levels.length - 1; l >= 0; l--) {
    const level = levels[l];
    if (lines[`show_${level}`]) {
      columns.push({ name: `ll${level}`, label: `${lines[`ttip_label_${level}_prefix_lower`]}${lines[`ttip_label_${level}`]}` });
    }
  }
  if (settings.outliers.three_sigma) {
    columns.push({ name: "three_sigma", label: "Three Sigma" });
  }
  if (settings.outliers.two_sigma) {
    columns.push({ name: "two_sigma", label: "Two Sigma" });
  }
  return columns;
}

export default class viewModelClass {
  inputData: dataObject | undefined;
  inputSettings: settingsClass;
  chartBase: chartClass | undefined;
  calculatedLimits: limitData[];
  plotPoints: plotData[];
  tableColumns: TableColumn[] = [];
  groupedLines: [StandardLineName, lineData[]][];
  firstRun: boolean;
  colourPalette: ColourPalette;
  svgWidth = 0;
  svgHeight = 0;
  headless: boolean;
  frontend = false;
  /** Indicators switch the view to the multi-indicator chart */
  showMisc = false;
  /** The groups the MISC pane offers */
  miscGroups: FormattingItem[] = [];
  miscPoints: miscPoint[] = [];
  miscAnyHighlights = false;

  constructor(host: IVisualHost) {
    this.inputData = undefined;
    this.inputSettings = new settingsClass();
    this.chartBase = undefined;
    this.calculatedLimits = [];
    this.plotPoints = new Array<plotData>();
    this.groupedLines = new Array<[StandardLineName, lineData[]]>();
    this.firstRun = true;
    this.colourPalette = readColourPalette(host);
    this.headless = false;
  }

  getFormattingModel(): FormattingModel {
    return this.inputSettings.getFormattingModel(this.showMisc ? this.miscGroups : undefined);
  }

  update(options: UpdateOptions, host: IVisualHost): viewModelValidationT {
    // Read before any early return so error rendering is themed
    this.colourPalette = readColourPalette(host);
    const checkDV = validateDataView(options.dataViews, ["numerators", "denominators"]);
    if (checkDV.status !== "valid") {
      return this.invalidate(checkDV.error);
    }
    const view = checkDV.view;
    const dataChanged = (options.type & (2 | 16)) !== 0 || this.firstRun;
    const indicators = view.categories.indicator ?? [];
    const indicatorGroups = groupCategoryRows(indicators, view.rowCount);
    if (dataChanged) {
      this.showMisc = indicators.length > 0;
      this.miscGroups = [];
      this.inputSettings.update(view.category, indicatorGroups.rows);
    }
    const settingsValidation = this.inputSettings.validationStatus;
    if (settingsValidation.status !== 0) {
      return this.invalidate(settingsValidation.error, "settings");
    }

    this.svgWidth = options.viewport.width;
    this.svgHeight = options.viewport.height;
    this.headless = options.headless ?? false;
    this.frontend = options.frontend ?? false;

    if (dataChanged) {
      this.miscPoints = [];
      this.miscAnyHighlights = false;
      if (this.showMisc) {
        return this.initialiseMisc(view, host, indicatorGroups);
      }
      const result = extractInputData(view, this.inputSettings, indicatorGroups.rows[0]);
      if (result.status === "invalid") {
        return this.invalidate(result.error);
      }
      this.inputData = result.data;
      this.chartBase = new chartObjects[this.inputSettings.settings.funnel.chart_type](result.data, this.inputSettings);
      this.calculatedLimits = this.chartBase.getLimits();
      this.scaleAndTruncateLimits();
      this.initialisePlotData(host, result.data, this.chartBase);
      this.initialiseGroupedLines();
      this.firstRun = false;
    }
    if (this.inputData === undefined) {
      return this.invalidate("No validated data present");
    }
    // The MISC chart has no axes
    if (!this.showMisc) {
      const rangeError = axisRangeError(axisRanges(this));
      if (rangeError !== undefined) {
        return this.invalidate(rangeError, "settings");
      }
    }
    return { status: true, data: this.inputData, warning: this.inputData.warningMessage || undefined };
  }

  private invalidate(error: string, type?: ErrorKind): viewModelValidationT {
    this.inputData = undefined;
    this.chartBase = undefined;
    this.calculatedLimits = [];
    this.plotPoints = [];
    this.groupedLines = [];
    this.miscPoints = [];
    this.miscAnyHighlights = false;
    this.firstRun = true;
    return { status: false, error, type };
  }

  private initialiseMisc(view: ValidatedDataView<"numerators" | "denominators">, host: IVisualHost,
    indicators: CategoryGroups): viewModelValidationT {
    const keyColumn = view.categories.key[0];
    const groups = groupCategoryRows([keyColumn], keyColumn.values.length);
    const items = this.miscGroups;
    const rowsByGroup = new Map<string, number[]>();
    for (let i = 0; i < groups.rows.length; i++) {
      if (keyColumn.values[groups.rows[i][0]] == null) {
        continue;
      }
      items.push({ displayName: groups.names[i][0], value: groups.keys[i] });
      rowsByGroup.set(groups.keys[i], groups.rows[i]);
    }
    // The group is a visual-level choice, so lives in the report's metadata rather than the rows
    const misc = this.inputSettings.settings.misc;
    const selectedGroup = view.dataView.metadata.objects?.misc?.group;
    misc.group = typeof selectedGroup === "string" ? selectedGroup : "";
    if (misc.group === "" && items.length > 0) {
      misc.group = items[0].value;
    }
    const targetRows = rowsByGroup.get(misc.group);
    if (targetRows === undefined) {
      return this.invalidate("Select a MISC group present in the data.");
    }
    const selectedRows = new Set(targetRows);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.inputData = undefined;
    for (let i = 0; i < indicators.rows.length; i++) {
      const rows = indicators.rows[i];
      const settings = this.inputSettings.forGroup(i);
      const indicator = indicators.labels[i];
      const rowSettings = this.inputSettings.rowSettings[i];
      const direction = rowSettings[0].outliers.improvement_direction;
      let oneDirection = direction !== "neutral";
      for (let j = 1; oneDirection && j < rowSettings.length; j++) {
        oneDirection = rowSettings[j].outliers.improvement_direction === direction;
      }
      if (!oneDirection) {
        errors.push(labelledMessage(indicator, "Each MISC indicator must have one improvement direction: increase or decrease."));
        continue;
      }
      settings.settings.outliers = { ...settings.settings.outliers, three_sigma: true, two_sigma: false };
      const result = extractInputData(view, settings, rows);
      if (result.status === "invalid") {
        errors.push(labelledMessage(indicator, result.error));
        continue;
      }
      const data = result.data;
      this.inputData ??= data;
      if (data.warningMessage !== "") {
        warnings.push(labelledMessage(indicator, data.warningMessage));
      }
      this.miscAnyHighlights ||= data.anyHighlights;
      const chart = new chartObjects[settings.settings.funnel.chart_type](data, settings);
      this.calculatedLimits = chart.getLimits();
      this.scaleAndTruncateLimits(settings);
      this.initialisePlotData(host, data, chart, settings);
      for (let j = 0; j < data.id.length; j++) {
        const row = data.id[j];
        if (!selectedRows.has(row)) {
          continue;
        }
        const point = this.plotPoints[j];
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
    if (errors.length > 0) {
      return this.invalidate(errors.join("\n"));
    }
    if (this.inputData === undefined || this.miscPoints.length === 0) {
      return this.invalidate("The selected MISC group has no valid indicator results.");
    }
    this.inputData.warningMessage = warnings.join("\n");
    this.firstRun = false;
    return { status: true, data: this.inputData, warning: this.inputData.warningMessage || undefined };
  }

  initialisePlotData(host: IVisualHost, inputData: dataObject, chart: chartClass, inputSettings = this.inputSettings): void {
    this.plotPoints = new Array<plotData>();
    this.tableColumns = tableColumns(inputSettings.settings);
    const transform: (x: number) => number = getTransformation(inputSettings.settings.funnel.transformation);
    const multiplier: number = inputSettings.derivedSettings.multiplier;
    const flag_two_sigma: boolean = inputSettings.settings.outliers.two_sigma;
    const flag_three_sigma: boolean = inputSettings.settings.outliers.three_sigma;
    const zScores: number[] = chart.getZ();
    const limitsByDenominator = new Map<number, limitData>();
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      limitsByDenominator.set(this.calculatedLimits[i].denominators, this.calculatedLimits[i]);
    }

    for (let i: number = 0; i < inputData.id.length; i++) {
      const original_index: number = inputData.id[i];
      const numerator: number = inputData.numerators[i];
      const denominator: number = inputData.denominators[i];
      const value: number = transform((numerator / denominator) * multiplier);
      const limits = limitsByDenominator.get(denominator);
      if (limits === undefined) {
        throw new Error("Missing limits for an observed denominator.");
      }
      const aesthetics: settingsValueType["scatter"] = inputData.scatter_formatting[i]
      if (this.colourPalette.isHighContrast) {
        aesthetics.colour = this.colourPalette.foregroundColour;
      }
      const flagSettings = {
        process_flag_type: inputSettings.settings.outliers.process_flag_type,
        improvement_direction: inputSettings.settings.outliers.improvement_direction
      }
      const two_sigma_outlier = checkFlagDirection(flag_two_sigma ? limitStatus(value, limits.ll95, limits.ul95) : "none", flagSettings);
      const three_sigma_outlier = checkFlagDirection(flag_three_sigma ? limitStatus(value, limits.ll99, limits.ul99) : "none", flagSettings);
      const category = inputData.keys[i].label;
      // A three-sigma flag outranks a two-sigma one
      applyFlagColours(aesthetics, inputSettings.settings.outliers, [
        [two_sigma_outlier, "two_sigma_colour"], [three_sigma_outlier, "three_sigma_colour"]
      ] as const);

      this.plotPoints.push({
        x: denominator,
        numerator: numerator,
        value: value,
        z: zScores[i],
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
          aesthetics: inputData.label_formatting[i],
          angle: undefined,
          distance: undefined
        },
        two_sigma: two_sigma_outlier,
        three_sigma: three_sigma_outlier
      })
    }
  }

  initialiseGroupedLines(): void {
    const labels: StandardLineName[] = [];
    if (this.inputSettings.settings.lines.show_target) {
      labels.push("target");
    }
    if (this.inputSettings.settings.lines.show_alt_target) {
      labels.push("alt_target");
    }
    if (this.inputSettings.settings.lines.show_99) {
      labels.push("ll99", "ul99");
    }
    if (this.inputSettings.settings.lines.show_95) {
      labels.push("ll95", "ul95");
    }
    if (this.inputSettings.settings.lines.show_68) {
      labels.push("ll68", "ul68");
    }

    const formattedLines: lineData[] = new Array<lineData>();
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      const limits = this.calculatedLimits[i];
      for (let j = 0; j < labels.length; j++) {
        const label = labels[j];
        formattedLines.push({ x: limits.denominators, line_value: limits[label], group: label });
      }
    }
    this.groupedLines = groupBy(formattedLines, "group");
  }

  /** Flags follow the truncated limits; the alt. target is entered in display units, so is not multiplied */
  scaleAndTruncateLimits(inputSettings = this.inputSettings): void {
    const multiplier: number = inputSettings.derivedSettings.multiplier;
    const transform: (x: number) => number = getTransformation(inputSettings.settings.funnel.transformation);
    const lower: number | undefined = inputSettings.settings.funnel.ll_truncate;
    const upper: number | undefined = inputSettings.settings.funnel.ul_truncate;
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      const limit = this.calculatedLimits[i];
      limit.target = transform(limit.target * multiplier);
      for (let j = 0; j < limitLineNames.length; j++) {
        const name = limitLineNames[j];
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
