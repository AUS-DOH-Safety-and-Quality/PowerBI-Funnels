import { dropdownOption, toggleOption, colourOption } from "./common";

const outliersSettings = {
  description: "Outlier Settings",
  displayName: "Outlier Settings",
  settingsGroups: {
    "General" : {
      process_flag_type: dropdownOption("Type of Change to Flag", "both", ["both", "improvement", "deterioration"], "sentence"),
      improvement_direction: dropdownOption("Improvement Direction", "increase", ["increase", "neutral", "decrease"], "sentence")
    },
    "Three Sigma Outliers" : {
      three_sigma: toggleOption("Three Sigma Outliers", false),
      three_sigma_colour_improvement: colourOption("Imp. Three Sigma Colour", "improvement"),
      three_sigma_colour_deterioration: colourOption("Det. Three Sigma Colour", "deterioration"),
      three_sigma_colour_neutral_low: colourOption("Neutral (Low) Three Sigma Colour", "neutral_low"),
      three_sigma_colour_neutral_high: colourOption("Neutral (High) Three Sigma Colour", "neutral_high")
    },
    "Two Sigma Outliers": {
      two_sigma: toggleOption("Two Sigma Outliers", false),
      two_sigma_colour_improvement: colourOption("Imp. Two Sigma Colour", "improvement"),
      two_sigma_colour_deterioration: colourOption("Det. Two Sigma Colour", "deterioration"),
      two_sigma_colour_neutral_low: colourOption("Neutral (Low) Two Sigma Colour", "neutral_low"),
      two_sigma_colour_neutral_high: colourOption("Neutral (High) Two Sigma Colour", "neutral_high")
    }
  }
};

export default outliersSettings;
