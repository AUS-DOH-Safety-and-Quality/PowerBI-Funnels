import { toggleOption, textOption, dropdownOption, numberOption } from "./common";

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
      multiplier: numberOption("Multiplier", 1, { min: 0 }),
      sig_figs: numberOption("Decimals to Report:", 2, { min: 0, max: 20 }),
      perc_labels: dropdownOption("Report as percentage", "Automatic", ["Automatic", "Yes", "No"]),
      transformation:dropdownOption("Transformation", "none", ["none", "ln", "log10", "sqrt"], "none",
        ["None", "Natural Log (y+1)", "Log10 (y+1)", "Square-Root"]
      ),
      ttip_show_group: toggleOption("Show Group in Tooltip", true),
      ttip_label_group: textOption("Group Tooltip Label", "Automatic"),
      ttip_show_numerator: toggleOption("Show Numerator in Tooltip", true),
      ttip_label_numerator: textOption("Numerator Tooltip Label", "Numerator"),
      ttip_show_denominator: toggleOption("Show Denominator in Tooltip", true),
      ttip_label_denominator: textOption("Denominator Tooltip Label", "Denominator"),
      ttip_show_value: toggleOption("Show Value in Tooltip", true),
      ttip_label_value: textOption("Value Tooltip Label", "Automatic"),
      ll_truncate: numberOption("Truncate Lower Limits at:", undefined),
      ul_truncate: numberOption("Truncate Upper Limits at:", undefined)
    }
  }
};

export default funnelSettings;
