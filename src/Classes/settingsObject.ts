class settingsPairNumber {
  default: number;
  value: number;

  constructor(initialValue: number) {
    this.default = initialValue;
    this.value = initialValue;
  }
}

class settingsPairString {
  default: string;
  value: string;

  constructor(initialValue: string) {
    this.default = initialValue;
    this.value = initialValue;
  }
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
    this.x = {
      padding: new settingsPairNumber(50),
      end_padding: new settingsPairNumber(10)
    };
    this.y = {
      padding: new settingsPairNumber(50),
      end_padding: new settingsPairNumber(10)
    };
  };
};

class funnelSettings {
  data_type: settingsPairString;
  od_adjust: settingsPairString;
  multiplier: settingsPairNumber;
  transformation: settingsPairString;
  alt_target: settingsPairNumber;

  constructor() {
    this.data_type = new settingsPairString("PR");
    this.od_adjust = new settingsPairString("no");
    this.multiplier = new settingsPairNumber(1);
    this.transformation = new settingsPairString("none");
    this.alt_target = new settingsPairNumber(null);
  }
}

class scatterSettings {
  size: settingsPairNumber;
  colour: settingsPairString;
  opacity: settingsPairNumber;
  opacity_unselected: settingsPairNumber;

  constructor() {
    this.size = new settingsPairNumber(3);
    this.colour = new settingsPairString("#000000");
    this.opacity = new settingsPairNumber(1);
    this.opacity_unselected = new settingsPairNumber(0.2);
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
    this.width_99 = new settingsPairNumber(2);
    this.width_95 = new settingsPairNumber(2);
    this.width_target = new settingsPairNumber(1.5);
    this.width_alt_target = new settingsPairNumber(1.5);
    this.colour_99 = new settingsPairString("#6495ED");
    this.colour_95 = new settingsPairString("#6495ED");
    this.colour_target = new settingsPairString("#6495ED");
    this.colour_alt_target = new settingsPairString("#6495ED");
  }
}

class axisSettings {
  xlimit_label: settingsPairString;
  ylimit_label: settingsPairString;
  xlimit_l: settingsPairNumber;
  xlimit_u: settingsPairNumber;
  ylimit_l: settingsPairNumber;
  ylimit_u: settingsPairNumber;

  constructor() {
    this.xlimit_label = new settingsPairString(null);
    this.ylimit_label = new settingsPairString(null);
    this.xlimit_l = new settingsPairNumber(null);
    this.xlimit_u = new settingsPairNumber(null);
    this.ylimit_l = new settingsPairNumber(null);
    this.ylimit_u = new settingsPairNumber(null);
  };
}

class settingsObject {
  axispad: axispadSettings;
  funnel: funnelSettings;
  scatter: scatterSettings;
  lines: lineSettings;
  axis: axisSettings;

  constructor() {
    console.log("Begin settings constructor")
    this.axispad = new axispadSettings();
    console.log("axispad")
    this.funnel = new funnelSettings();
    console.log("funnel")
    this.scatter = new scatterSettings();
    console.log("scatter")
    this.lines = new lineSettings();
    this.axis = new axisSettings();
    console.log("finished settings")
  }
}

export default settingsObject;
