import { toggleOption, colourOption, flagDirectionOptions } from "powerbi-visuals-core/settings";

const outliersSettings = {
  description: "Outlier Settings",
  displayName: "Outlier Settings",
  settingsGroups: {
    "General" : flagDirectionOptions(),
    "Three Sigma Outliers" : {
      three_sigma: toggleOption("Three Sigma Outliers", "Flags points beyond the 99.8% limits.", false),
      three_sigma_colour_improvement: colourOption("Imp. Three Sigma Colour",
                                                   "Colour for three-sigma outliers that are an improvement.", "improvement"),
      three_sigma_colour_deterioration: colourOption("Det. Three Sigma Colour",
                                                     "Colour for three-sigma outliers that are a deterioration.", "deterioration"),
      three_sigma_colour_neutral_low: colourOption("Neutral (Low) Three Sigma Colour",
                                                   "Colour for points below the lower 99.8% limit when the improvement direction is neutral.", "neutral_low"),
      three_sigma_colour_neutral_high: colourOption("Neutral (High) Three Sigma Colour",
                                                    "Colour for points above the upper 99.8% limit when the improvement direction is neutral.", "neutral_high")
    },
    "Two Sigma Outliers": {
      two_sigma: toggleOption("Two Sigma Outliers", "Flags points beyond the 95% limits.", false),
      two_sigma_colour_improvement: colourOption("Imp. Two Sigma Colour",
                                                 "Colour for two-sigma outliers that are an improvement.", "improvement"),
      two_sigma_colour_deterioration: colourOption("Det. Two Sigma Colour",
                                                   "Colour for two-sigma outliers that are a deterioration.", "deterioration"),
      two_sigma_colour_neutral_low: colourOption("Neutral (Low) Two Sigma Colour",
                                                 "Colour for points below the lower 95% limit when the improvement direction is neutral.", "neutral_low"),
      two_sigma_colour_neutral_high: colourOption("Neutral (High) Two Sigma Colour",
                                                  "Colour for points above the upper 95% limit when the improvement direction is neutral.", "neutral_high")
    }
  }
};

export default outliersSettings;
