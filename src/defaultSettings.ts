import { textOptions, lineOptions, iconOptions, colourOptions, borderOptions, labelOptions } from "./validSettingValues";


const defaultSettings = {
  canvas: {
    show_errors: { default: true },
    lower_padding: { default: 10 },
    upper_padding: { default: 10 },
    left_padding: { default: 10 },
    right_padding: { default: 10 }
  },
  funnel: {
    chart_type: { default: "PR", valid: ["PR", "SR", "RC"] },
    od_adjust: { default: "no", valid: ["no", "yes", "auto"] },
    multiplier: { default: 1, valid: { numberRange: { min: 0 } } },
    sig_figs: { default: 2, valid: { numberRange: { min: 0, max: 20 } } },
    perc_labels: { default: "Automatic", valid: ["Automatic", "Yes", "No"]},
    transformation: { default: "none", valid: ["none", "ln", "log10", "sqrt"]},
    ttip_show_numerator: { default: true },
    ttip_label_numerator: { default: "Numerator"},
    ttip_show_denominator: { default: true },
    ttip_label_denominator: { default: "Denominator"},
    ttip_show_value: { default: true },
    ttip_label_value: { default: "Automatic"},
    ll_truncate: { default: <number>null },
    ul_truncate: { default: <number>null }
  },
  scatter: {
    use_group_text: { default: false },
    scatter_text_font: textOptions.font,
    scatter_text_size: textOptions.size,
    scatter_text_colour: colourOptions.standard,
    scatter_text_opacity: { default: 1, valid: { numberRange: { min: 0, max: 1 } } },
    scatter_text_opacity_selected: { default: 1, valid: { numberRange: { min: 0, max: 1 } } },
    scatter_text_opacity_unselected: { default: 0.2, valid: { numberRange: { min: 0, max: 1 } } },
    shape: { default: "Circle", valid: ["Circle", "Cross", "Diamond", "Square", "Star", "Triangle", "Wye"]},
    size: { default: 3, valid: { numberRange: { min: 0, max: 100 }}},
    colour: colourOptions.common_cause,
    opacity: { default: 1, valid: { numberRange: { min: 0, max: 1 } } },
    opacity_selected: { default: 1, valid: { numberRange: { min: 0, max: 1 } } },
    opacity_unselected: { default: 0.2, valid: { numberRange: { min: 0, max: 1 } } }
  },
  lines: {
    show_99: { default: true },
    show_95: { default: true },
    show_68: { default: false },
    show_target: { default: true },
    show_alt_target: { default: false },
    width_99: { default: 2, valid: lineOptions.width.valid },
    width_95: { default: 2, valid: lineOptions.width.valid },
    width_68: { default: 2, valid: lineOptions.width.valid },
    width_target: { default: 1.5, valid: lineOptions.width.valid },
    width_alt_target: { default: 1.5, valid: lineOptions.width.valid },
    type_99: { default: "10 10", valid: lineOptions.type.valid },
    type_95: { default: "2 5", valid: lineOptions.type.valid },
    type_68: { default: "2 5", valid: lineOptions.type.valid },
    type_target: { default: "10 0", valid: lineOptions.type.valid },
    type_alt_target: { default: "10 0", valid: lineOptions.type.valid },
    colour_99: colourOptions.limits,
    colour_95: colourOptions.limits,
    colour_68: colourOptions.limits,
    colour_target: colourOptions.standard,
    colour_alt_target: colourOptions.standard,
    ttip_show_99: { default: true },
    ttip_show_95: { default: false },
    ttip_show_68: { default: false },
    ttip_show_target: { default: true },
    ttip_show_alt_target: { default: true },
    ttip_label_99: { default: "99% Limit" },
    ttip_label_95: { default: "95% Limit" },
    ttip_label_68: { default: "68% Limit" },
    ttip_label_target: { default: "Centerline" },
    ttip_label_alt_target: { default: "Additional Target" },
    alt_target: { default: <number>null }
  },
  x_axis: {
    xlimit_colour: colourOptions.standard,
    xlimit_ticks: { default: true },
    xlimit_tick_font: textOptions.font,
    xlimit_tick_size: textOptions.size,
    xlimit_tick_colour: colourOptions.standard,
    xlimit_tick_rotation: { default: 0, valid: { numberRange: { min: -360, max: 360 }}},
    xlimit_tick_count: { default: 10, valid: { numberRange: { min: 0, max: 100 }}},
    xlimit_label: { default: <string>null },
    xlimit_label_font: textOptions.font,
    xlimit_label_size: textOptions.size,
    xlimit_label_colour: colourOptions.standard,
    xlimit_l: { default: <number>null },
    xlimit_u: { default: <number>null }
  },
  y_axis: {
    ylimit_colour: colourOptions.standard,
    ylimit_ticks: { default: true },
    ylimit_sig_figs: { default: <number>null },
    ylimit_tick_font: textOptions.font,
    ylimit_tick_size: textOptions.size,
    ylimit_tick_colour: colourOptions.standard,
    ylimit_tick_rotation: { default: 0, valid: { numberRange: { min: -360, max: 360 }}},
    ylimit_tick_count: { default: 10, valid: { numberRange: { min: 0, max: 100 }}},
    ylimit_label: { default: <string>null },
    ylimit_label_font: textOptions.font,
    ylimit_label_size: textOptions.size,
    ylimit_label_colour: colourOptions.standard,
    ylimit_l: { default: <number>null },
    ylimit_u: { default: <number>null }
  },
  outliers: {
    process_flag_type: { default: "both", valid: ["both", "improvement", "deterioration"]},
    improvement_direction: { default: "increase", valid: ["increase", "neutral", "decrease"]},
    three_sigma: { default: false },
    three_sigma_colour_improvement: colourOptions.improvement,
    three_sigma_colour_deterioration: colourOptions.deterioration,
    three_sigma_colour_neutral_low: colourOptions.neutral_low,
    three_sigma_colour_neutral_high: colourOptions.neutral_high,
    two_sigma: { default: false },
    two_sigma_colour_improvement: colourOptions.improvement,
    two_sigma_colour_deterioration: colourOptions.deterioration,
    two_sigma_colour_neutral_low: colourOptions.neutral_low,
    two_sigma_colour_neutral_high: colourOptions.neutral_high
  }
}

type DefaultTypes<T> = T[Extract<keyof T, "default">];
export type NestedKeysOf<T>
  = T extends object
    ? { [K in keyof T]: K extends string ? K : never; }[keyof T]
    : never;

export type defaultSettingsType = {
  [K in keyof typeof defaultSettings]: {
    [L in keyof typeof defaultSettings[K]]: DefaultTypes<typeof defaultSettings[K][L]>
  }
}
export type defaultSettingsKeys = keyof defaultSettingsType;
export type defaultSettingsNestedKeys = NestedKeysOf<defaultSettingsType[defaultSettingsKeys]>;

export const settingsPaneGroupings: Partial<Record<defaultSettingsKeys, Record<string, defaultSettingsNestedKeys[]>>> = {
  lines: {
    "Target": ["show_target", "width_target", "type_target", "colour_target", "ttip_show_target", "ttip_label_target"],
    "Alt. Target": ["show_alt_target", "alt_target", "width_alt_target", "type_alt_target", "colour_alt_target", "ttip_show_alt_target", "ttip_label_alt_target"],
    "68% Limits": ["show_68", "width_68", "type_68", "colour_68", "ttip_show_68", "ttip_label_68"],
    "95% Limits": ["show_95", "width_95", "type_95", "colour_95", "ttip_show_95", "ttip_label_95"],
    "99% Limits": ["show_99", "width_99", "type_99", "colour_99", "ttip_show_99", "ttip_label_99"]
  },
  x_axis: {
    "Axis": ["xlimit_colour", "xlimit_l", "xlimit_u"],
    "Ticks": ["xlimit_ticks", "xlimit_tick_count", "xlimit_tick_font", "xlimit_tick_size", "xlimit_tick_colour", "xlimit_tick_rotation"],
    "Label": ["xlimit_label", "xlimit_label_font", "xlimit_label_size", "xlimit_label_colour"]
  },
  y_axis: {
    "Axis": ["ylimit_colour", "ylimit_sig_figs", "ylimit_l", "ylimit_u"],
    "Ticks": ["ylimit_ticks", "ylimit_tick_count", "ylimit_tick_font", "ylimit_tick_size", "ylimit_tick_colour", "ylimit_tick_rotation"],
    "Label": ["ylimit_label", "ylimit_label_font", "ylimit_label_size", "ylimit_label_colour"]
  },
  scatter: {
    "Dots": ["shape", "size", "colour", "opacity", "opacity_selected", "opacity_unselected"],
    "Text": ["use_group_text", "scatter_text_font", "scatter_text_size", "scatter_text_colour", "scatter_text_opacity", "scatter_text_opacity_selected", "scatter_text_opacity_unselected"]
  }
}

export default defaultSettings;
