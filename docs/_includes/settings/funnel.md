<!-- Generated from the settings model; edit the setting definitions, not this file. -->

### Data Settings

| Setting | Description | Default | Values |
| --- | --- | --- | --- |
| Chart Type | Type of funnel plot: an indirectly standardised ratio of observed to expected, a proportion or a rate. | Proportion | • Indirectly Standardised (HSMR) (`SR`)<br>• Proportion (`PR`)<br>• Rate (`RC`) |
| OD Adjustment | Widens the limits for overdispersion. Yes adjusts for any estimated overdispersion; Auto only when a chi-squared test detects it. | No | • Auto (`auto`)<br>• Yes (`yes`)<br>• No (`no`) |
| Multiplier | Multiplies plotted values and limits, e.g. 1000 for a rate per 1,000. | 1 | Number, at least 0 |
| Decimals to Report: | Decimal places for values in tooltips, line labels and the y-axis, unless the y-axis sets its own. | 2 | Whole number from 0 to 20 |
| Report as percentage | Yes multiplies by 100 and adds a % sign, replacing the multiplier. Automatic does this for proportion charts with a multiplier of 1 or 100. No never adds a % sign. | Automatic | • `Automatic`<br>• `Yes`<br>• `No` |
| Transformation | Scale for the plotted values and limits; any transformation turns off % labels. | None | • None (`none`)<br>• Natural Log (y+1) (`ln`)<br>• Log10 (y+1) (`log10`)<br>• Square-Root (`sqrt`) |
| Show Group in Tooltip | Shows the group name in the tooltip. | On | On or Off |
| Group Tooltip Label | Name for the group in the tooltip. | `Group` | Text |
| Show Numerator in Tooltip | Shows the numerator in the tooltip, when one is supplied. | On | On or Off |
| Numerator Tooltip Label | Name for the numerator in the tooltip. | `Numerator` | Text |
| Show Denominator in Tooltip | Shows the denominator in the tooltip, when one is supplied. | On | On or Off |
| Denominator Tooltip Label | Name for the denominator in the tooltip. | `Denominator` | Text |
| Show Value in Tooltip | Shows the plotted value in the tooltip. | On | On or Off |
| Value Tooltip Label | Name for the plotted value in the tooltip; Automatic names it after the chart type. | `Automatic` | Text |
| Truncate Lower Limits at: | Limits below this plotted value are drawn at it, and points are flagged against them. | (blank) | Number |
| Truncate Upper Limits at: | Limits above this plotted value are drawn at it, and points are flagged against them. | (blank) | Number |
