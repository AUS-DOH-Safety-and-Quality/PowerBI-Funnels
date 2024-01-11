---
title: Chart Types
layout: page
has_children: true
nav_order: 3
---

# Supported Funnel Plot Types

This page summarises the available funnel plot types and their implementation. For any other chart types that you'd like to see added, please open an issue on the [GitHub page](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-Funnels).

# Why Funnels?
Funnel plots are a graphical tool used in healthcare to monitor and improve patient care. They are used to compare the performance of different groups by plotting their results on a graph. The central line on the graph represents the average result, while the dots represent the results of individual groups.

# Choosing a Chart Type
There are multiple types of Funnel charts, each for monitoring a different type of data.

There are three chart types available in this visual:

| Chart Type | Description | Example Use Case |
| -- | -- | -- |
| Indirectly Standardised (HSMR) | Where the denominator is an expected value and the numerator is an observed value, forming a ratio of 1 | Hospital Standardised Mortality Ratio |
| Proportion | Used to measure the proportion of events occuring | The proportion of patients transferred from an acute hospital |
| Rate | Also known as ratio of counts, used for when there may be multiple counts for each record | Number of comorbidities per patient |

## Calculating limits
The functions for calculating the two and three sigma limits are consistent with the *R* package *[FunnelPlotR](https://nhs-r-community.github.io/FunnelPlotR/)* developed by the NHS-R community, based on the methods outlined by Spiegelhalter. Please see this link for further information on calculation methodologies.