<!-- Generated from the settings model; edit the setting definitions, not this file. -->

### General

| Setting | Description | Default | Values |
| --- | --- | --- | --- |
| Type of Change to Flag | Which changes are flagged. Ignored when the improvement direction is neutral. | Both | • Both (`both`)<br>• Improvement (`improvement`)<br>• Deterioration (`deterioration`) |
| Improvement Direction | Whether higher or lower values are better. Neutral flags both sides in the neutral colours. | Increase | • Increase (`increase`)<br>• Neutral (`neutral`)<br>• Decrease (`decrease`) |

### Three Sigma Outliers

| Setting | Description | Default | Values |
| --- | --- | --- | --- |
| Three Sigma Outliers | Flags points beyond the 99.8% limits. | Off | On or Off |
| Imp. Three Sigma Colour | Colour for three-sigma outliers that are an improvement. | `#00B0F0` | Colour |
| Det. Three Sigma Colour | Colour for three-sigma outliers that are a deterioration. | `#E46C0A` | Colour |
| Neutral (Low) Three Sigma Colour | Colour for points below the lower 99.8% limit when the improvement direction is neutral. | `#490092` | Colour |
| Neutral (High) Three Sigma Colour | Colour for points above the upper 99.8% limit when the improvement direction is neutral. | `#490092` | Colour |

### Two Sigma Outliers

| Setting | Description | Default | Values |
| --- | --- | --- | --- |
| Two Sigma Outliers | Flags points beyond the 95% limits. | Off | On or Off |
| Imp. Two Sigma Colour | Colour for two-sigma outliers that are an improvement. | `#00B0F0` | Colour |
| Det. Two Sigma Colour | Colour for two-sigma outliers that are a deterioration. | `#E46C0A` | Colour |
| Neutral (Low) Two Sigma Colour | Colour for points below the lower 95% limit when the improvement direction is neutral. | `#490092` | Colour |
| Neutral (High) Two Sigma Colour | Colour for points above the upper 95% limit when the improvement direction is neutral. | `#490092` | Colour |
