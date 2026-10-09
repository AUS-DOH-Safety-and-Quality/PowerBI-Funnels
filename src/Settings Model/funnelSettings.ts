import {
  toggleOption, textOption, dropdownOption, scalingOptions, valueTooltipOptions, limitTruncationOptions
} from "powerbi-visuals-core/settings";

const funnelSettings = {
  description: "Funnel Settings",
  displayName: "Data Settings",
  settingsGroups: {
    "all": {
      chart_type: dropdownOption(
        "Chart Type", "PR", ["SR", "PR", "RC"], "none",
        ["Indirectly Standardised (HSMR)", "Proportion", "Rate"]
      ),
      od_adjust: dropdownOption("OD Adjustment", "no", ["auto", "yes", "no"], "sentence"),
      ...scalingOptions(),
      transformation:dropdownOption("Transformation", "none", ["none", "ln", "log10", "sqrt"], "none",
        ["None", "Natural Log (y+1)", "Log10 (y+1)", "Square-Root"]
      ),
      ttip_show_group: toggleOption("Show Group in Tooltip", true),
      ttip_label_group: textOption("Group Tooltip Label", "Group"),
      ...valueTooltipOptions(),
      ...limitTruncationOptions()
    }
  }
};

export default funnelSettings;
