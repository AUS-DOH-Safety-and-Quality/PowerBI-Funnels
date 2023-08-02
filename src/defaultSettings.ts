const defaultSettings = {
  canvas: {
    lower_padding: 10,
    upper_padding: 10,
    left_padding: 10,
    right_padding: 10
  },
  funnel: {
    chart_type: "PR",
    od_adjust: "no",
    multiplier: 1,
    sig_figs: 2,
    transformation: "none",
    alt_target: <number>null
  },
  scatter: {
    size: 3,
    colour: "#000000",
    opacity: 1,
    opacity_unselected: 0.2
  },
  lines: {
    width_99: 2,
    width_95: 2,
    width_target: 1.5,
    width_alt_target: 1.5,
    type_99: "10 10",
    type_95: "2 5",
    type_target: "10 10",
    type_alt_target: "10 10",
    colour_99: "#6495ED",
    colour_95: "#6495ED",
    colour_target: "#000000",
    colour_alt_target: "#000000"
  },
  x_axis: {
    xlimit_colour: "#000000",
    xlimit_ticks: true,
    xlimit_tick_font: "'Arial', sans-serif",
    xlimit_tick_size: 10,
    xlimit_tick_colour: "#000000",
    xlimit_tick_rotation: 0,
    xlimit_tick_count: <number>null,
    xlimit_label: <string>null,
    xlimit_label_font: "'Arial', sans-serif",
    xlimit_label_size: 10,
    xlimit_label_colour: "#000000",
    xlimit_l: <number>null,
    xlimit_u: <number>null
  },
  y_axis: {
    ylimit_colour: "#000000",
    ylimit_ticks: true,
    ylimit_sig_figs: <number>(null),
    ylimit_tick_font: "'Arial', sans-serif",
    ylimit_tick_size: 10,
    ylimit_tick_colour: "#000000",
    ylimit_tick_rotation: 0,
    ylimit_tick_count: <number>null,
    ylimit_label: <string>null,
    ylimit_label_font: "'Arial', sans-serif",
    ylimit_label_size: 10,
    ylimit_label_colour: "#000000",
    ylimit_l: <number>null,
    ylimit_u: <number>null
  },
  outliers: {
    flag_direction: "both",
    three_sigma: false,
    three_sigma_colour: "#E1C233",
    two_sigma: false,
    two_sigma_colour: "#E1C233"
  }
}

export const settingsPaneGroupings = {
  lines: {
    "Target(s)": ["width_target", "type_target", "colour_target", "width_alt_target", "type_alt_target", "colour_alt_target"],
    "95% Limits": ["width_95", "type_95", "colour_95"],
    "99% Limits": ["width_99", "type_99", "colour_99"]
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
  }
}

export default defaultSettings;
