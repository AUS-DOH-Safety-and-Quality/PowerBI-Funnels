import powerbi from "powerbi-visuals-api";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

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

  updateSettings(inputObjects: powerbi.DataViewObjects): void {
    let allSettingGroups: string[] = Object.getOwnPropertyNames(this)
                                           .filter(groupName => groupName !== "axispad");
    allSettingGroups.forEach(settingGroup => {
      let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroup]);
      settingNames.forEach(settingName => {
        this[settingGroup][settingName].value = dataViewObjects.getValue(
          inputObjects, {
            objectName: settingGroup,
            propertyName: settingName
          },
          this[settingGroup][settingName].default
        )
      })
    })
  }

  returnValues(settingGroupName: string) {
    let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroupName])
    let firstSettingObject = {
      [settingNames[0]]: this[settingGroupName][settingNames[0]].value
    };
    return settingNames.reduce((previousSetting, currentSetting) => {
      return {
        ...previousSetting,
        ...{
          [currentSetting]: this[settingGroupName][currentSetting].value
        }
      }
    }, firstSettingObject);
  }

  constructor() {
    this.axispad = new axispadSettings();
    this.funnel = new funnelSettings();
    this.scatter = new scatterSettings();
    this.lines = new lineSettings();
    this.axis = new axisSettings();
  }
}

export default settingsObject;
