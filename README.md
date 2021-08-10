# Introduction 
This repository contains a PowerBI custom visual for funnel plots. The visual is implemented purely within PowerBI and has no dependencies on external programs like R or Python. The visual natively supports tooltips as well as cross-plot filtering and highlighting.

The following chart types are (currently) implemented:

  - Proportion
  - Indirectly-Standardised Ratios
  - Ratio of Counts (Rates)
  - Means

The visual also provides an additive adjustment for overdispersion, as discussed in:
<br> [Statistical methods for
healthcare regulation: rating, screening and surveillance. Spiegelhalter
et al
(2012)](https://rss.onlinelibrary.wiley.com/doi/full/10.1111/j.1467-985X.2011.01010.x)<br>
[Funnel plots for comparing institutional performance. Spiegelhalter
(2005)](https://onlinelibrary.wiley.com/doi/10.1002/sim.1970)<br>
[Handling over-dispersion of performance indicators. Spiegelhalter
(2005)](https://qualitysafety.bmj.com/content/14/5/347)<br>

# Installing the Visual

The most recent version of the visual can be downloaded from the ['Releases' section'](https://github.com/andrjohns/PowerBI-Funnels/releases/tag/Continuous) and added to PowerBI using the 'Import visual from a file' option:

![image](https://user-images.githubusercontent.com/27717896/128833977-51ae139d-43f2-4d32-8c8c-4cdcabc2bdaf.png)

# Using the Visual

Once you have installed the visual and added it to your report, you can add the desired data (numerators, denominators, and groups) to the visual:

![image](https://user-images.githubusercontent.com/27717896/128835552-78039c79-9123-4cbb-b8d5-a392c608216d.png)

The visual will default to displaying a funnel plot for proportions and automatically detecting whether or not to adjust for overdispersion:

![image](https://user-images.githubusercontent.com/27717896/128835456-235e2d1f-695f-4c57-8235-f947dd480e05.png)

You can change these options through the 'Data Settings' menu:

![image](https://user-images.githubusercontent.com/27717896/128835876-7f81b55e-3f85-47c7-824e-5e3f3ee9c8dd.png)

Aesthetic options for the lines, scatter dots, and chart axes are also available.

# Building Locally

To build the PowerBI visual (.pbiviz file), you will need a working Node.js installation and internet access. Navigate to the project source directory and run:
```
npm install
npm install -g powerbi-visuals-tools@3.1.15
pbiviz package
```

The .pbiviz file can then be found in the `dist` directory

