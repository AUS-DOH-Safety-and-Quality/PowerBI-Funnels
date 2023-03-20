class settingsPair<T> {
  default: T;
  value: T;

  constructor(initialValue: T) {
    this.default = initialValue;
    this.value = initialValue;
  }
}

class canvasSettings {
  lower_padding: settingsPair<number>;
  upper_padding: settingsPair<number>;
  left_padding: settingsPair<number>;
  right_padding: settingsPair<number>;

  constructor() {
    this.lower_padding = new settingsPair(50);
    this.upper_padding = new settingsPair(10);
    this.left_padding = new settingsPair(50);
    this.right_padding = new settingsPair(10);
  };
};

class funnelSettings {
  chart_type: settingsPair<string>;
  od_adjust: settingsPair<string>;
  multiplier: settingsPair<number>;
  sig_figs: settingsPair<number>;
  transformation: settingsPair<string>;
  alt_target: settingsPair<number>;

  constructor() {
    this.chart_type = new settingsPair("PR");
    this.od_adjust = new settingsPair("no");
    this.multiplier = new settingsPair(1);
    this.sig_figs = new settingsPair(2);
    this.transformation = new settingsPair("none");
    this.alt_target = new settingsPair(<number>null);
  }
}

class scatterSettings {
  size: settingsPair<number>;
  colour: settingsPair<string>;
  opacity: settingsPair<number>;
  opacity_unselected: settingsPair<number>;

  constructor() {
    this.size = new settingsPair(3);
    this.colour = new settingsPair("#000000");
    this.opacity = new settingsPair(1);
    this.opacity_unselected = new settingsPair(0.2);
  }
}

class lineSettings {
  width_99: settingsPair<number>;
  width_95: settingsPair<number>;
  width_target: settingsPair<number>;
  width_alt_target: settingsPair<number>;
  type_99: settingsPair<string>;
  type_95: settingsPair<string>;
  type_target: settingsPair<string>;
  type_alt_target: settingsPair<string>;
  colour_99: settingsPair<string>;
  colour_95: settingsPair<string>;
  colour_target: settingsPair<string>;
  colour_alt_target: settingsPair<string>;

  constructor() {
    this.width_99 = new settingsPair(2);
    this.width_95 = new settingsPair(2);
    this.width_target = new settingsPair(1.5);
    this.width_alt_target = new settingsPair(1.5);
    this.type_99 = new settingsPair("10 10");
    this.type_95 = new settingsPair("2 5");
    this.type_target = new settingsPair("10 0");
    this.type_alt_target = new settingsPair("10 0");
    this.colour_99 = new settingsPair("#6495ED");
    this.colour_95 = new settingsPair("#6495ED");
    this.colour_target = new settingsPair("#000000");
    this.colour_alt_target = new settingsPair("#000000");
  }
}

class xAxisSettings {
  xlimit_colour: settingsPair<string>;
  xlimit_ticks: settingsPair<boolean>;
  xlimit_tick_font: settingsPair<string>;
  xlimit_tick_size: settingsPair<string>;
  xlimit_tick_colour: settingsPair<string>;
  xlimit_tick_count: settingsPair<number>;
  xlimit_label: settingsPair<string>;
  xlimit_label_font: settingsPair<string>;
  xlimit_label_size: settingsPair<string>;
  xlimit_label_colour: settingsPair<string>;
  xlimit_l: settingsPair<number>;
  xlimit_u: settingsPair<number>;

  constructor() {
    this.xlimit_colour = new settingsPair("#000000");
    this.xlimit_ticks = new settingsPair(true);
    this.xlimit_tick_font = new settingsPair("'Arial', sans-serif");
    this.xlimit_tick_size = new settingsPair("x-small");
    this.xlimit_tick_colour = new settingsPair("#000000");
    this.xlimit_tick_count = new settingsPair<number>(null);
    this.xlimit_label = new settingsPair<string>(null);
    this.xlimit_label_font = new settingsPair("'Arial', sans-serif");
    this.xlimit_label_size = new settingsPair("medium");
    this.xlimit_label_colour = new settingsPair("#000000");
    this.xlimit_l = new settingsPair<number>(null);
    this.xlimit_u = new settingsPair<number>(null);
  };
}

class yAxisSettings {
  ylimit_colour: settingsPair<string>;
  ylimit_ticks: settingsPair<boolean>;
  ylimit_tick_font: settingsPair<string>;
  ylimit_tick_size: settingsPair<string>;
  ylimit_tick_colour: settingsPair<string>;
  ylimit_tick_count: settingsPair<number>;
  ylimit_label: settingsPair<string>;
  ylimit_label_font: settingsPair<string>;
  ylimit_label_size: settingsPair<string>;
  ylimit_label_colour: settingsPair<string>;
  ylimit_l: settingsPair<number>;
  ylimit_u: settingsPair<number>;

  constructor() {
    this.ylimit_colour = new settingsPair("#000000");
    this.ylimit_ticks = new settingsPair(true);
    this.ylimit_tick_font = new settingsPair("'Arial', sans-serif");
    this.ylimit_tick_size = new settingsPair("x-small");
    this.ylimit_tick_colour = new settingsPair("#000000");
    this.ylimit_tick_count = new settingsPair<number>(null);
    this.ylimit_label = new settingsPair<string>(null);
    this.ylimit_label_font = new settingsPair("'Arial', sans-serif");
    this.ylimit_label_size = new settingsPair("medium");
    this.ylimit_label_colour = new settingsPair("#000000");
    this.ylimit_l = new settingsPair<number>(null);
    this.ylimit_u = new settingsPair<number>(null);
  };
}

class outliersSettings {
  flag_direction: settingsPair<string>;
  three_sigma: settingsPair<boolean>;
  three_sigma_colour: settingsPair<string>;
  two_sigma: settingsPair<boolean>;
  two_sigma_colour: settingsPair<string>;

  constructor() {
    this.flag_direction = new settingsPair("both");
    this.three_sigma = new settingsPair(false);
    this.three_sigma_colour = new settingsPair("#E1C233");
    this.two_sigma = new settingsPair(false);
    this.two_sigma_colour = new settingsPair("#E1C233");
  };
}

let settingsInData: Record<string, string> = {
  "chart_type" : "funnel",
  "multiplier" : "funnel",
  "flag_direction" : "outliers",
  "ylimit_l" : "y_axis",
  "ylimit_u" : "y_axis"
}

export {
  canvasSettings,
  funnelSettings,
  scatterSettings,
  lineSettings,
  xAxisSettings,
  yAxisSettings,
  outliersSettings,
  settingsInData
}
