---
title: Outlier Highlighting
layout: page
parent: Settings Reference
nav_order: 7.2
---

# Pattern Detection Configuration & Aesthetics
Funnel patterns can be displayed and formatted in this section.

## Type of Change to Flag
This setting determines whether improvement and deterioration are both flagged, or only one of these directions are flagged. These apply across all the enabled patterns. The various options can be selected in the drop down menu:

![Type of Change to Flag](images\outlierHighlighting\TypeChangeFlag.png)

- **Both** - Both improvement and deterioration patterns are highlighted (default)
- **Improvement (Imp.)** - Only improvement patterns are highlighted
- **Deterioration (Det.)** - Only deterioration patterns are highlighted

To use these with the conditional formatting, the values must be set to only **both**, **improvement** and **deterioration** respectfully.

This setting should be used in conjunction with the **Improvement Direction** setting below.

## Improvement Direction
This setting determines which direction is deemed to be the improvement direction for the measure. That is, the measure is getting better in this direction. The various options can be selected in the drop down menu:

![Improvement Direction](images\outlierHighlighting\ImprovementDirection.png)

- **Increase** - The measure increasing is a favourable outcome, and signals improvement in the measure (default).
- **Neutral** - There is no direction set, and the measure increasing or decreasing does not signal improvement or deterioration. This setting is used to detect any statistical variation.
- **Decrease** - The measure decreasing is a favourable outcome, and signals improvement in the measure.

To use these with the conditional formatting, the values must be set to only **increase**, **neutral** and **decrease** respectfully.

This setting should be used in conjunction with the **Type of Change to Flag** setting above.

## Pattern Options for Three and Two Sigma
This section covers the settings that are common across the three sigma and two sigma outliers. The below shows the example for three sigma outliers:

![Pattern Common Options](images\outlierHighlighting\PatternCommonOptions.png)

- **Outliers Toggle** - The toggle to set whether the pattern is displayed
- **Imp. Colour** - Colour for the points when improvement is detected for this pattern. Only available if **Improvement Direction** is set to *Increase* or *Decrease*.
- **Det. Colour** - Colour for the points when deterioration is detected for this pattern. Only available if **Improvement Direction** is not set to *Increase* or *Decrease*.
- **Neutral (Low) Colour** - Colour for the points when a pattern is detected and on the lower part of the chart. Only available if **Improvement Direction** is set to *Neutral*.
- **Neutral (Higher) Colour** - Colour for the points when a pattern is detected and on the higher part of the chart. Only available if **Improvement Direction** is set to *Neutral*.

The default colours are consistent with the NHS theme.