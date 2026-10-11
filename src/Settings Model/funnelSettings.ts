import {
  toggleOption, textOption, dropdownOption, scalingOptions, valueTooltipOptions, limitTruncationOptions
} from "powerbi-visuals-core/settings";

const funnelSettings = {
  description: "Funnel Settings",
  displayName: "Data Settings",
  settingsGroups: {
    "all": {
      chart_type: dropdownOption(
        "Chart Type", "Type of funnel plot: an indirectly standardised ratio of observed to expected, a proportion or a rate.",
        "PR", ["SR", "PR", "RC"], "none",
        ["Indirectly Standardised (HSMR)", "Proportion", "Rate"]
      ),
      od_adjust: dropdownOption("OD Adjustment",
                                "Widens the limits for overdispersion. Yes adjusts for any estimated overdispersion; "
                                + "Auto only when a chi-squared test detects it.", "no", ["auto", "yes", "no"], "sentence"),
      ...scalingOptions(),
      transformation:dropdownOption("Transformation", "Scale for the plotted values and limits; any transformation turns off % labels.",
        "none", ["none", "ln", "log10", "sqrt"], "none",
        ["None", "Natural Log (y+1)", "Log10 (y+1)", "Square-Root"]
      ),
      ttip_show_group: toggleOption("Show Group in Tooltip", "Shows the group name in the tooltip.", true),
      ttip_label_group: textOption("Group Tooltip Label", "Name for the group in the tooltip.", "Group"),
      ...valueTooltipOptions(),
      ...limitTruncationOptions()
    }
  }
};

export default funnelSettings;
