import { FormattingComponent } from "./common";

const funnelSettings = {
  description: "Funnel Settings",
  displayName: "Data Settings",
  settingsGroups: {
    "all": {
      chart_type: {
        displayName: "Chart Type",
        type: FormattingComponent.Dropdown,
        default: "PR",
        valid: ["SR", "PR", "RC"],
        items: [
          { displayName : "Indirectly Standardised (HSMR)", value : "SR" },
          { displayName : "Proportion",                     value : "PR" },
          { displayName : "Rate",                           value : "RC" }
        ]
      },
      od_adjust: {
        displayName: "OD Adjustment",
        type: FormattingComponent.Dropdown,
        default: "no",
        valid: ["auto", "yes", "no"],
        items: [
          { displayName : "Automatic", value : "auto" },
          { displayName : "Yes",       value : "yes" },
          { displayName : "No",        value : "no" }
        ]
      },
      multiplier: {
        displayName: "Multiplier",
        type: FormattingComponent.NumUpDown,
        default: 1,
        options: { minValue: { value: 0 } }
      },
      sig_figs: {
        displayName: "Decimals to Report:",
        type: FormattingComponent.NumUpDown,
        default: 2,
        options: { minValue: { value: 0 }, maxValue: { value: 20 } }
      },
      perc_labels: {
        displayName: "Report as percentage",
        type: FormattingComponent.Dropdown,
        default: "Automatic",
        valid: ["Automatic", "Yes", "No"],
        items: [
          { displayName : "Automatic",  value : "Automatic" },
          { displayName : "Yes",        value : "Yes" },
          { displayName : "No",         value : "No" }
        ]
      },
      transformation: {
        displayName: "Transformation",
        type: FormattingComponent.Dropdown,
        default: "none",
        valid: ["none", "ln", "log10", "sqrt"],
        items: [
          { displayName : "None",              value : "none" },
          { displayName : "Natural Log (y+1)", value : "ln" },
          { displayName : "Log10 (y+1)",       value : "log10" },
          { displayName : "Square-Root",       value : "sqrt" }
        ]
      },
      ttip_show_group: {
        displayName: "Show Group in Tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_group: {
        displayName: "Group Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "Group"
      },
      ttip_show_numerator: {
        displayName: "Show Numerator in Tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_numerator: {
        displayName: "Numerator Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "Numerator"
      },
      ttip_show_denominator: {
        displayName: "Show Denominator in Tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_denominator: {
        displayName: "Denominator Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "Denominator"
      },
      ttip_show_value: {
        displayName: "Show Value in Tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_value: {
        displayName: "Value Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "Automatic"
      },
      ll_truncate: {
        displayName: "Truncate Lower Limits at:",
        type: FormattingComponent.NumUpDown,
        default: undefined as number | undefined
      },
      ul_truncate: {
        displayName: "Truncate Upper Limits at:",
        type: FormattingComponent.NumUpDown,
        default: undefined as number | undefined
      }
    }
  }
};

export default funnelSettings;
