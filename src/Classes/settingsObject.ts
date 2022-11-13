import powerbi from "powerbi-visuals-api";
import dataObject from "./dataObject";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

class settingsPair<T> {
  default: T;
  value: T;

  constructor(initialValue: T) {
    this.default = initialValue;
    this.value = initialValue;
  }
}

class axispadSettings {
  x: {
    padding: settingsPair<number>,
    end_padding: settingsPair<number>
  };
  y: {
    padding: settingsPair<number>,
    end_padding: settingsPair<number>
  };

  constructor() {
    this.x = {
      padding: new settingsPair(50),
      end_padding: new settingsPair(10)
    };
    this.y = {
      padding: new settingsPair(50),
      end_padding: new settingsPair(10)
    };
  };
};

class funnelSettings {
  data_type: settingsPair<string>;
  od_adjust: settingsPair<string>;
  multiplier: settingsPair<number>;
  transformation: settingsPair<string>;
  alt_target: settingsPair<number>;

  constructor() {
    this.data_type = new settingsPair("PR");
    this.od_adjust = new settingsPair("no");
    this.multiplier = new settingsPair(1);
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
    this.colour_target = new settingsPair("#6495ED");
    this.colour_alt_target = new settingsPair("#6495ED");
  }
}

class axisSettings {
  xlimit_label: settingsPair<string>;
  ylimit_label: settingsPair<string>;
  xlimit_l: settingsPair<number>;
  xlimit_u: settingsPair<number>;
  ylimit_l: settingsPair<number>;
  ylimit_u: settingsPair<number>;

  constructor() {
    this.xlimit_label = new settingsPair(<string>null);
    this.ylimit_label = new settingsPair(<string>null);
    this.xlimit_l = new settingsPair(<number>null);
    this.xlimit_u = new settingsPair(<number>null);
    this.ylimit_l = new settingsPair(<number>null);
    this.ylimit_u = new settingsPair(<number>null);
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
    this.three_sigma = new settingsPair(true);
    this.three_sigma_colour = new settingsPair("#E1C233");
    this.two_sigma = new settingsPair(false);
    this.two_sigma_colour = new settingsPair("#E1C233");
  };
}

class settingsObject {
  axispad: axispadSettings;
  funnel: funnelSettings;
  scatter: scatterSettings;
  lines: lineSettings;
  axis: axisSettings;
  outliers: outliersSettings;

  updateSettings(inputObjects: powerbi.DataViewObjects): void {
    let allSettingGroups: string[] = Object.getOwnPropertyNames(this)
                                           .filter(groupName => groupName !== "axispad");
    allSettingGroups.forEach(settingGroup => {
      let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroup]);
      settingNames.forEach(settingName => {
        let method: string = settingName.includes("colour") ? "getFillColor" : "getValue";
        this[settingGroup][settingName].value = dataViewObjects[method](
          inputObjects, {
            objectName: settingGroup,
            propertyName: settingName
          },
          this[settingGroup][settingName].default
        )
      })
    })
  }

  settingInData(settingGroupName: string, settingName: string): boolean {
    let settingsInData: string[] = ["chart_type", "chart_multiplier", "flag_direction", "ylimit_l", "ylimit_u"];
    return settingsInData.includes(settingName);
  }

  returnValues(settingGroupName: string, inputData: dataObject) {
    let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroupName]);
    let firstSettingObject = {
      [settingNames[0]]: this.settingInData(settingGroupName, settingNames[0])
        ? inputData[settingNames[0]]
        : this[settingGroupName][settingNames[0]].value
    };
    return settingNames.reduce((previousSetting, currentSetting) => {
      return {
        ...previousSetting,
        ...{
          [currentSetting]: this.settingInData(settingGroupName, currentSetting)
            ? inputData[currentSetting]
            : this[settingGroupName][currentSetting].value
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
    this.outliers = new outliersSettings();
  }
}

export default settingsObject;
