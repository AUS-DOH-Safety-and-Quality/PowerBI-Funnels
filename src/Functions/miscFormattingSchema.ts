import type { FormattingItem } from "powerbi-visuals-core/powerbi";
import type { SettingDefinition } from "powerbi-visuals-core/settings";
import settingsModel from "../settings";

export default function miscFormattingSchema(items: FormattingItem[]) {
  const { canvas, funnel, misc, outliers, scatter, lines, x_axis, y_axis } = settingsModel;
  const lineSettings: Record<string, SettingDefinition> = {};
  const levels = ["target", "95", "99"] as const;
  const properties = ["show", "width", "type", "colour", "opacity", "ttip_show", "ttip_label"] as const;
  for (let i = 0; i < levels.length; i++) {
    for (let j = 0; j < properties.length; j++) {
      const name = `${properties[j]}_${levels[i]}` as const;
      lineSettings[name] = lines[name];
    }
  }
  return {
    canvas, funnel,
    misc: { ...misc, settingsGroups: { all: { ...misc.settingsGroups.all, group: { ...misc.group, items } } } },
    outliers: { ...outliers, settingsGroups: { all: {
      improvement_direction: outliers.improvement_direction, process_flag_type: outliers.process_flag_type,
      three_sigma_colour_improvement: outliers.three_sigma_colour_improvement,
      three_sigma_colour_deterioration: outliers.three_sigma_colour_deterioration
    } } },
    scatter: { ...scatter, displayName: "Bars", settingsGroups: { all: {
      colour: scatter.colour, opacity: scatter.opacity, opacity_selected: scatter.opacity_selected,
      opacity_unselected: scatter.opacity_unselected
    } } },
    lines: { ...lines, settingsGroups: { all: lineSettings } },
    x_axis: { ...x_axis, settingsGroups: {
      Axis: { xlimit_colour: x_axis.xlimit_colour },
      Ticks: {
        xlimit_ticks: x_axis.xlimit_ticks, xlimit_tick_count: x_axis.xlimit_tick_count,
        xlimit_tick_font: x_axis.xlimit_tick_font, xlimit_tick_size: x_axis.xlimit_tick_size,
        xlimit_tick_colour: x_axis.xlimit_tick_colour
      },
      Label: x_axis.settingsGroups.Label
    } },
    y_axis: { ...y_axis, displayName: "Indicator Labels", settingsGroups: { all: {
      ylimit_tick_font: y_axis.ylimit_tick_font, ylimit_tick_size: y_axis.ylimit_tick_size,
      ylimit_tick_colour: y_axis.ylimit_tick_colour
    } } }
  };
}
