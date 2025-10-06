import * as d3 from "../D3 Plotting Functions/D3 Modules";
import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import { chartClass, settingsClass, type limitData, plotPropertiesClass, type defaultSettingsType } from "../Classes"
import { validateDataView, extractInputData, buildTooltip, type dataObject, checkFlagDirection, truncate, truncateInputs, multiply, isNullOrUndefined } from "../Functions";
import * as chartObjects from "../Chart Types"
import getTransformation from "../Funnel Calculations/getTransformation";
import two_sigma from "../Outlier Flagging/two_sigma"
import three_sigma from "../Outlier Flagging/three_sigma"

export type viewModelValidationT = {
  status: boolean,
  error?: string,
  warning?: string,
  type?: string
}

export type lineData = {
  x: number;
  line_value: number;
  group: string;
}

export type plotData = {
  x: number;
  numerator?: number;
  value: number;
  group_text: string;
  aesthetics: defaultSettingsType["scatter"];
  // ISelectionId allows the visual to report the selection choice to PowerBI
  identity: ISelectionId;
  // Flag for whether dot should be highlighted by selections in other charts
  highlighted: boolean;
  // Tooltip data to print
  tooltip: VisualTooltipDataItem[];
  label: {
    text_value: string,
    aesthetics: defaultSettingsType["labels"],
    angle: number,
    distance: number,
    line_offset: number,
    marker_offset: number
  };
}

export type colourPaletteType = {
  isHighContrast: boolean,
  foregroundColour: string,
  backgroundColour: string,
  foregroundSelectedColour: string,
  hyperlinkColour: string
};

export default class viewModelClass {
  inputData: dataObject;
  inputSettings: settingsClass;
  chartBase: chartClass;
  calculatedLimits: limitData[];
  plotPoints: plotData[];
  groupedLines: [string, lineData[]][];
  plotProperties: plotPropertiesClass;
  firstRun: boolean;
  colourPalette: colourPaletteType;
  svgWidth: number;
  svgHeight: number;
  headless: boolean;

  constructor() {
    this.inputData = <dataObject>null;
    this.inputSettings = new settingsClass();
    this.chartBase = null;
    this.calculatedLimits = null;
    this.plotPoints = new Array<plotData>();
    this.groupedLines = new Array<[string, lineData[]]>();
    this.plotProperties = new plotPropertiesClass();
    this.firstRun = true;
    this.colourPalette = null;
    this.headless = false;
  }

  update(options: VisualUpdateOptions, host: IVisualHost): viewModelValidationT {
    const res: viewModelValidationT = { status: true };

    if (options.type === 2 || this.firstRun) {
      this.inputSettings.update(options.dataViews[0]);
    }
    if (this.inputSettings.validationStatus.error !== "") {
      res.status = false;
      res.error = this.inputSettings.validationStatus.error;
      res.type = "settings";
      return res;
    }
    const checkDV: string = validateDataView(options.dataViews);
    if (checkDV !== "valid") {
      res.status = false;
      res.error = checkDV;
      return res;
    }
    if (isNullOrUndefined(this.colourPalette)) {
      this.colourPalette = {
        isHighContrast: host.colorPalette.isHighContrast,
        foregroundColour: host.colorPalette.foreground.value,
        backgroundColour: host.colorPalette.background.value,
        foregroundSelectedColour: host.colorPalette.foregroundSelected.value,
        hyperlinkColour: host.colorPalette.hyperlink.value
      }
    }

    this.svgWidth = options.viewport.width;
    this.svgHeight = options.viewport.height;
    this.headless = options?.["headless"] ?? false;

    // Only re-construct data and re-calculate limits if they have changed
    if (options.type === 2 || this.firstRun) {
      const chart_type: string = this.inputSettings.settings.funnel.chart_type

      this.inputData = extractInputData(options.dataViews[0].categorical, this.inputSettings);
      if (this.inputData.validationStatus.status === 0) {
        this.chartBase = new chartObjects[chart_type](this.inputData, this.inputSettings);
        this.calculatedLimits = this.chartBase.getLimits();
        this.scaleAndTruncateLimits();

        this.initialisePlotData(host);
        this.initialiseGroupedLines();
      }
    }

    this.plotProperties.update(
      options,
      this.plotPoints,
      this.inputData,
      this.inputSettings.settings,
      this.inputSettings.derivedSettings,
      this.colourPalette
    )
    this.firstRun = false;
    if (this.inputData.validationStatus.status !== 0) {
      res.status = false;
      res.error = this.inputData.validationStatus.error;
      return res;
    }
    if (this.inputData.warningMessage !== "") {
      res.warning = this.inputData.warningMessage;
    }
    return res;
  }

  initialisePlotData(host: IVisualHost): void {
    this.plotPoints = new Array<plotData>();
    const transform_text: string = this.inputSettings.settings.funnel.transformation;
    const transform: (x: number) => number = getTransformation(transform_text);
    const multiplier: number = this.inputSettings.derivedSettings.multiplier;
    const flag_two_sigma: boolean = this.inputSettings.settings.outliers.two_sigma;
    const flag_three_sigma: boolean = this.inputSettings.settings.outliers.three_sigma;

    for (let i: number = 0; i < this.inputData.id.length; i++) {
      const original_index: number = this.inputData.id[i];
      const numerator: number = this.inputData.numerators[i];
      const denominator: number = this.inputData.denominators[i];
      const value: number = transform((numerator / denominator) * multiplier);
      const limits: limitData = this.calculatedLimits.filter(d => d.denominators === denominator && d.ll99 !== null && d.ul99 !== null)[0];
      const aesthetics: defaultSettingsType["scatter"] = this.inputData.scatter_formatting[i]
      if (this.colourPalette.isHighContrast) {
        aesthetics.colour = this.colourPalette.foregroundColour;
      }
      const two_sigma_outlier: string = flag_two_sigma ? two_sigma(value, limits) : "none";
      const three_sigma_outlier: string = flag_three_sigma ? three_sigma(value, limits) : "none";
      const category: string = (typeof this.inputData.categories.values[original_index] === "number") ?
                              (this.inputData.categories.values[original_index]).toString() :
                              <string>(this.inputData.categories.values[original_index]);
      const flagSettings = {
        process_flag_type: this.inputSettings.settings.outliers.process_flag_type,
        improvement_direction: this.inputSettings.settings.outliers.improvement_direction
      }
      if (two_sigma_outlier !== "none") {
        const two_sigma_flag: string = checkFlagDirection(two_sigma_outlier, flagSettings)
        aesthetics.colour = this.inputSettings.settings.outliers["two_sigma_colour_" + two_sigma_flag];
        aesthetics.colour_outline = this.inputSettings.settings.outliers["two_sigma_colour_" + two_sigma_flag];
        aesthetics.scatter_text_colour = aesthetics.colour;
      }

      if (three_sigma_outlier !== "none") {
        const three_sigma_flag: string = checkFlagDirection(three_sigma_outlier, flagSettings)
        aesthetics.colour = this.inputSettings.settings.outliers["three_sigma_colour_" + three_sigma_flag];
        aesthetics.colour_outline = this.inputSettings.settings.outliers["three_sigma_colour_" + three_sigma_flag];
        aesthetics.scatter_text_colour = aesthetics.colour;
      }

      this.plotPoints.push({
        x: denominator,
        numerator: numerator,
        value: value,
        group_text: category,
        aesthetics: aesthetics,
        identity: host.createSelectionIdBuilder()
                      .withCategory(this.inputData.categories, original_index)
                      .createSelectionId(),
        highlighted: this.inputData.highlights?.[i] != null,
        tooltip: buildTooltip(
          i,
          this.calculatedLimits,
          { two_sigma: two_sigma_outlier !== "none", three_sigma: three_sigma_outlier !== "none" },
          this.inputData,
          this.inputSettings.settings,
          this.inputSettings.derivedSettings
        ),
        label: {
          text_value: this.inputData.labels?.[i],
          aesthetics: this.inputData.label_formatting[i],
          angle: null,
          distance: null,
          line_offset: null,
          marker_offset: null
        }
      })
    }
  }

  initialiseGroupedLines(): void {
    const labels: string[] = new Array<string>();
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
    this.calculatedLimits.forEach(limits => {
      labels.forEach(label => {
          formattedLines.push({
            x: limits.denominators,
            line_value: limits?.[label],
            group: label
          })
      })
    })
    this.groupedLines = d3.groups(formattedLines, d => d.group);
  }

  scaleAndTruncateLimits(): void {
    // Scale limits using provided multiplier
    const multiplier: number = this.inputSettings.derivedSettings.multiplier;
    const transform: (x: number) => number = getTransformation(this.inputSettings.settings.funnel.transformation);

    const limits: truncateInputs = {
      lower: this.inputSettings.settings.funnel.ll_truncate,
      upper: this.inputSettings.settings.funnel.ul_truncate
    };
    this.calculatedLimits.forEach(limit => {
      ["target", "ll99", "ll95", "ll68", "ul68", "ul95", "ul99"].forEach(type => {
        limit[type] = truncate(transform(multiply(limit[type], multiplier)), limits)
      })
    })
  }
}
