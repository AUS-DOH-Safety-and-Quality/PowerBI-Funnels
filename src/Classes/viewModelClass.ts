import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import settingsClass from "./settingsClass";
import settingsModel, { defaultSettings, type settingsValueType } from "../settings";
import { groupCategoryRows, indexColumnsByRole, readSettingsRows, readColourPalette, type CategoryGroups, type ColourPalette } from "powerbi-visuals-core/powerbi";
import { chartClass, type limitData } from "../Classes"
import validateDataView from "../Functions/validateDataView";
import extractInputData, { type dataObject } from "../Functions/extractInputData";
import buildTooltip from "../Functions/buildTooltip";
import { clamp } from "powerbi-visuals-core/math";
import { groupBy, checkFlagDirection } from "powerbi-visuals-core/data";
import * as chartObjects from "../Chart Types"
import getTransformation from "../Funnel Calculations/getTransformation";
import two_sigma from "../Outlier Flagging/two_sigma"
import three_sigma from "../Outlier Flagging/three_sigma"
import type { LineName } from "../Functions/getAesthetic";

import type { ErrorKind } from "powerbi-visuals-core/rendering";

export type viewModelValidationT =
  | { status: true; data: dataObject; warning?: string }
  | { status: false; error: string; type?: ErrorKind };

export type lineData = {
  x: number;
  line_value: number | undefined;
  group: LineName;
}

export type plotData = {
  x: number;
  numerator?: number;
  value: number;
  z: number;
  group_text: string;
  aesthetics: settingsValueType["scatter"];
  // ISelectionId allows the visual to report the selection choice to PowerBI
  identity: ISelectionId;
  // Flag for whether dot should be highlighted by selections in other charts
  highlighted: boolean;
  // Tooltip data to print
  tooltip: VisualTooltipDataItem[];
  label: {
    text_value: string,
    aesthetics: settingsValueType["labels"],
    angle: number | undefined,
    distance: number | undefined,
    line_offset: number | undefined,
    marker_offset: number | undefined
  };
  two_sigma?: string;
  three_sigma?: string;
}

export type miscPoint = plotData & { indicator: string; score: number };

export default class viewModelClass {
  inputData: dataObject | undefined;
  inputSettings: settingsClass;
  chartBase: chartClass | undefined;
  calculatedLimits: limitData[];
  plotPoints: plotData[];
  groupedLines: [LineName, lineData[]][];
  firstRun: boolean;
  colourPalette: ColourPalette;
  svgWidth = 0;
  svgHeight = 0;
  headless: boolean;
  miscPoints: miscPoint[] = [];
  miscAnyHighlights = false;

  constructor(host: IVisualHost) {
    this.inputData = undefined;
    this.inputSettings = new settingsClass();
    this.chartBase = undefined;
    this.calculatedLimits = [];
    this.plotPoints = new Array<plotData>();
    this.groupedLines = new Array<[LineName, lineData[]]>();
    this.firstRun = true;
    this.colourPalette = readColourPalette(host);
    this.headless = false;
  }

  update(options: VisualUpdateOptions & { headless?: boolean }, host: IVisualHost): viewModelValidationT {
    // Read before any early return so error rendering is themed
    this.colourPalette = readColourPalette(host);
    const view = options.dataViews?.[0];
    const dataChanged = (options.type & (2 | 16)) !== 0 || this.firstRun;
    const categoryRoles = indexColumnsByRole(view?.categorical?.categories ?? []);
    const indicators = categoryRoles.indicator ?? [];
    const indicatorGroups = groupCategoryRows(indicators, categoryRoles.key?.[0]?.values.length ?? 0);
    if (dataChanged) {
      this.inputSettings.showMisc = indicators.length > 0;
      this.inputSettings.miscGroups = [];
      this.inputSettings.update(view, indicatorGroups.rows);
    }
    const settingsValidation = this.inputSettings.validationStatus;
    if (settingsValidation.status !== 0) return this.invalidate(settingsValidation.error, "settings");
    const checkDV = validateDataView(options.dataViews);
    if (checkDV !== "valid") return this.invalidate(checkDV);
    const categorical = view?.categorical;
    if (categorical === undefined) return this.invalidate("No categorical data present");

    this.svgWidth = options.viewport.width;
    this.svgHeight = options.viewport.height;
    this.headless = options.headless ?? false;

    if (dataChanged) {
      this.miscPoints = [];
      this.miscAnyHighlights = false;
      if (this.inputSettings.showMisc) return this.initialiseMisc(categorical, host, indicatorGroups, indicators);
      const chartType = this.inputSettings.settings.funnel.chart_type;
      if (chartType !== "PR" && chartType !== "SR" && chartType !== "RC") {
        return this.invalidate("Invalid chart type", "settings");
      }
      const result = extractInputData(categorical, this.inputSettings);
      if (result.status === "invalid") return this.invalidate(result.error);
      this.inputData = result.data;
      this.chartBase = new chartObjects[chartType](result.data, this.inputSettings);
      this.calculatedLimits = this.chartBase.getLimits();
      this.scaleAndTruncateLimits();
      this.initialisePlotData(host, result.data, this.chartBase);
      this.initialiseGroupedLines();
      this.firstRun = false;
    }
    if (this.inputData === undefined) return this.invalidate("No validated data present");
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

  private initialiseMisc(categorical: powerbi.DataViewCategorical, host: IVisualHost,
    indicators: CategoryGroups, indicatorColumns: powerbi.DataViewCategoryColumn[]): viewModelValidationT {
    const keyColumn = indexColumnsByRole(categorical.categories ?? []).key?.[0];
    if (keyColumn === undefined) return this.invalidate("No grouping/ID variable passed!");
    for (let i = 0; i < indicatorColumns.length; i++) {
      if (indicatorColumns[i].values.length !== keyColumn.values.length) {
        return this.invalidate("Indicators and groups must have matching row counts.");
      }
    }
    const groups = groupCategoryRows([keyColumn], keyColumn.values.length);
    const items = this.inputSettings.miscGroups;
    const rowsByGroup = new Map<string, number[]>();
    for (let i = 0; i < groups.rows.length; i++) {
      if (keyColumn.values[groups.rows[i][0]] == null) continue;
      items.push({ displayName: groups.names[i][0], value: groups.keys[i] });
      rowsByGroup.set(groups.keys[i], groups.rows[i]);
    }
    const misc = this.inputSettings.settings.misc;
    if (misc.group === "" && items.length > 0) misc.group = items[0].value;
    const targetRows = rowsByGroup.get(misc.group);
    if (targetRows === undefined) return this.invalidate("Select a MISC group present in the data.", "settings");
    if (!(misc.lower < 0 && misc.upper > 0)) {
      return this.invalidate("MISC sigma bounds must span zero.", "settings");
    }
    const selectedRows = new Set(targetRows);
    const warnings: string[] = [];
    this.inputData = undefined;
    for (let i = 0; i < indicators.rows.length; i++) {
      const rows = indicators.rows[i];
      const settings = this.inputSettings.forGroup(i);
      const indicator = indicators.names[i].join(" / ");
      const directions = readSettingsRows(settingsModel.outliers, "outliers", defaultSettings.outliers,
        categorical.categories![0], rows).values;
      const direction = directions[0].improvement_direction;
      for (let j = 0; j < directions.length; j++) {
        if (direction === "neutral" || directions[j].improvement_direction !== direction) {
          return this.invalidate(`Each MISC indicator must have one improvement direction: increase or decrease. Invalid indicator: ${indicator}.`, "settings");
        }
      }
      settings.settings.outliers = { ...settings.settings.outliers, three_sigma: true, two_sigma: false };
      const result = extractInputData(categorical, settings, rows);
      if (result.status === "invalid") return this.invalidate(`${indicator}: ${result.error}`);
      const data = result.data;
      this.inputData ??= data;
      if (data.warningMessage !== "") warnings.push(`${indicator}: ${data.warningMessage}`);
      this.miscAnyHighlights ||= data.anyHighlights;
      const chart = new chartObjects[settings.settings.funnel.chart_type](data, settings);
      this.calculatedLimits = chart.getLimits();
      this.scaleAndTruncateLimits(settings);
      this.initialisePlotData(host, data, chart, settings);
      for (let j = 0; j < data.id.length; j++) {
        const row = data.id[j];
        if (!selectedRows.has(row)) continue;
        const point = this.plotPoints[j];
        const score = point.z * (direction === "decrease" ? -1 : 1);
        const identity = host.createSelectionIdBuilder().withCategory(keyColumn, row);
        for (let k = 0; k < indicatorColumns.length; k++) identity.withCategory(indicatorColumns[k], row);
        this.miscPoints.push({ ...point, indicator, score, identity: identity.createSelectionId(), tooltip: [
          { displayName: "Indicator", value: indicator }, { displayName: "Z-score", value: score.toFixed(3) }, ...point.tooltip
        ] });
      }
    }
    this.chartBase = undefined;
    this.calculatedLimits = [];
    this.plotPoints = [];
    this.groupedLines = [];
    if (this.inputData === undefined || this.miscPoints.length === 0) {
      return this.invalidate("The selected MISC group has no valid indicator results.");
    }
    this.inputData.warningMessage = warnings.join("\n");
    this.firstRun = false;
    return { status: true, data: this.inputData, warning: this.inputData.warningMessage || undefined };
  }

  initialisePlotData(host: IVisualHost, inputData: dataObject, chart: chartClass, inputSettings = this.inputSettings): void {
    this.plotPoints = new Array<plotData>();
    const transform_text: string = inputSettings.settings.funnel.transformation;
    const transform: (x: number) => number = getTransformation(transform_text);
    const multiplier: number = inputSettings.derivedSettings.multiplier;
    const flag_two_sigma: boolean = inputSettings.settings.outliers.two_sigma;
    const flag_three_sigma: boolean = inputSettings.settings.outliers.three_sigma;
    const zScores: number[] = chart.getZ();

    for (let i: number = 0; i < inputData.id.length; i++) {
      const original_index: number = inputData.id[i];
      const numerator: number = inputData.numerators[i];
      const denominator: number = inputData.denominators[i];
      const value: number = transform((numerator / denominator) * multiplier);
      const limits = this.calculatedLimits.find(d => d.denominators === denominator);
      if (limits === undefined) throw new Error("Missing limits for an observed denominator.");
      const aesthetics: settingsValueType["scatter"] = inputData.scatter_formatting[i]
      if (this.colourPalette.isHighContrast) {
        aesthetics.colour = this.colourPalette.foregroundColour;
      }
      const flagSettings = {
        process_flag_type: inputSettings.settings.outliers.process_flag_type,
        improvement_direction: inputSettings.settings.outliers.improvement_direction
      }
      const two_sigma_outlier = checkFlagDirection(flag_two_sigma ? two_sigma(value, limits) : "none", flagSettings);
      const three_sigma_outlier = checkFlagDirection(flag_three_sigma ? three_sigma(value, limits) : "none", flagSettings);
      const category = inputData.keys[i].label;
      if (two_sigma_outlier !== "none") {
        aesthetics.colour = inputSettings.settings.outliers[`two_sigma_colour_${two_sigma_outlier}`];
        aesthetics.colour_outline = inputSettings.settings.outliers[`two_sigma_colour_${two_sigma_outlier}`];
        aesthetics.scatter_text_colour = aesthetics.colour;
      }

      if (three_sigma_outlier !== "none") {
        aesthetics.colour = inputSettings.settings.outliers[`three_sigma_colour_${three_sigma_outlier}`];
        aesthetics.colour_outline = inputSettings.settings.outliers[`three_sigma_colour_${three_sigma_outlier}`];
        aesthetics.scatter_text_colour = aesthetics.colour;
      }

      this.plotPoints.push({
        x: denominator,
        numerator: numerator,
        value: value,
        z: zScores[i],
        group_text: category,
        aesthetics: aesthetics,
        identity: host.createSelectionIdBuilder()
                      .withCategory(inputData.categories, original_index)
                      .createSelectionId(),
        highlighted: inputData.highlights?.[i] != null,
        tooltip: buildTooltip(
          i,
          this.calculatedLimits,
          { two_sigma: two_sigma_outlier !== "none", three_sigma: three_sigma_outlier !== "none" },
          inputData,
          inputSettings.settings,
          inputSettings.derivedSettings
        ),
        label: {
          text_value: inputData.labels?.[i] ?? "",
          aesthetics: inputData.label_formatting[i],
          angle: undefined,
          distance: undefined,
          line_offset: undefined,
          marker_offset: undefined
        },
        two_sigma: two_sigma_outlier,
        three_sigma: three_sigma_outlier
      })
    }
  }

  initialiseGroupedLines(): void {
    const labels: LineName[] = [];
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

  scaleAndTruncateLimits(inputSettings = this.inputSettings): void {
    // Scale limits using provided multiplier
    const multiplier: number = inputSettings.derivedSettings.multiplier;
    const transform: (x: number) => number = getTransformation(inputSettings.settings.funnel.transformation);

    const lower: number | undefined = inputSettings.settings.funnel.ll_truncate;
    const upper: number | undefined = inputSettings.settings.funnel.ul_truncate;
    const names = ["target", "ll99", "ll95", "ll68", "ul68", "ul95", "ul99"] as const;
    for (let i = 0; i < this.calculatedLimits.length; i++) {
      const limit = this.calculatedLimits[i];
      for (let j = 0; j < names.length; j++) {
        const name = names[j];
        const value = limit[name];
        if (value !== undefined) limit[name] = clamp(transform(value * multiplier), lower, upper);
      }
    }
  }
}
