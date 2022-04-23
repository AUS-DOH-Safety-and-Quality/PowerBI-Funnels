class settingsPairNumber {
  default: number;
  value: number;
}

class settingsPairString {
  default: string;
  value: string;
}

class settingsPairNull {
  default: null;
  value: null;
}

class axispadSettings {
  x: {
    padding: settingsPairNumber,
    end_padding: settingsPairNumber
  };
  y: {
    padding: settingsPairNumber,
    end_padding: settingsPairNumber
  };

  constructor() {
    this.x.padding.default = 50;
    this.x.padding.value = 50;
    this.x.end_padding.default = 10;
    this.x.end_padding.value = 10;
  };
};

class funnelSettings {
  data_type: settingsPairString;
  od_adjust: settingsPairString;
  multiplier: settingsPairNumber;
  transformation: settingsPairString;
  alt_target: settingsPairNull

  constructor() {
    this.data_type.default = "PR";
    this.data_type.value = "PR";
    this.od_adjust.default = "no";
    this.od_adjust.value = "no";
    this.multiplier.default = 1;
    this.multiplier.value = 1;
    this.transformation.default = "none";
    this.transformation.value = "none";
  }
}

class scatterSettings {
  size: settingsPairNumber;
  colour: settingsPairString;
  opacity: settingsPairNumber;
  opacity_unselected: settingsPairNumber;

  constructor() {
    this.size.default = 3;
    this.size.value = 3;
    this.colour.default = "#000000";
    this.colour.value = "#000000";
    this.opacity.default = 1;
    this.opacity.value = 1;
    this.opacity_unselected.default = 0.2;
    this.opacity_unselected.value = 0.2;
  }
}

class lineSettings {
  width_99: settingsPairNumber;
  width_95: settingsPairNumber;
  width_target: settingsPairNumber;
  width_alt_target: settingsPairNumber;
  colour_99: settingsPairString;
  colour_95: settingsPairString;
  colour_target: settingsPairString;
  colour_alt_target: settingsPairString;

  constructor() {
    this.width_99.default = 2;
    this.width_99.value = 2;
    this.width_95.default = 2;
    this.width_95.value = 2;
    this.width_target.default = 1.5;
    this.width_target.value = 1.5;
    this.width_alt_target.default = 1.5;
    this.width_alt_target.value = 1.5;
    this.colour_99.default = "#6495ED";
    this.colour_99.value = "#6495ED";
    this.colour_95.default = "#6495ED";
    this.colour_95.value = "#6495ED";
    this.colour_target.default = "#6495ED";
    this.colour_target.value = "#6495ED";
    this.colour_alt_target.default = "#6495ED";
    this.colour_alt_target.value = "#6495ED";
  }
}

class axisSettings {
  xlimit_label: settingsPairNull;
  ylimit_label: settingsPairNull;
  xlimit_l: settingsPairNull;
  xlimit_u: settingsPairNull;
  ylimit_l: settingsPairNull;
  ylimit_u: settingsPairNull;

  constructor() {
    this.xlimit_label.default = null;
    this.xlimit_label.value = null;
    this.ylimit_label.default = null;
    this.ylimit_label.value = null;
    this.xlimit_l.default = null;
    this.xlimit_l.value = null;
    this.xlimit_u.default = null;
    this.xlimit_u.value = null;
    this.ylimit_l.default = null;
    this.ylimit_l.value = null;
    this.ylimit_u.default = null;
    this.ylimit_u.value = null;
  }
}

class settingsObject {
  axispad: axispadSettings;
  funnel: funnelSettings;
  scatter: scatterSettings;
  lines: lineSettings;
  axis: axisSettings;

  constructor() {
    this.axispad = new axispadSettings();
    this.funnel = new funnelSettings();
    this.scatter = new scatterSettings();
    this.lines = new lineSettings();
    this.axis = new axisSettings();
  }
}

export default settingsObject;
