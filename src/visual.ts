"use strict";

import type powerbi from "powerbi-visuals-api";
type EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
type VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import * as d3 from "./D3 Plotting Functions/D3 Modules";
import viewModelObject from "./Classes/viewModel"
import { drawXAxis, drawYAxis, drawTooltipLine, drawLines,
          drawDots, updateHighlighting, addContextMenu } from "./D3 Plotting Functions"

export type svgBaseType = d3.Selection<SVGSVGElement, unknown, null, undefined>;

export class Visual implements powerbi.extensibility.IVisual {
  host: powerbi.extensibility.visual.IVisualHost;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  viewModel: viewModelObject;
  selectionManager: powerbi.extensibility.ISelectionManager;

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
    this.svg = d3.select(options.element).append("svg");
    this.host = options.host;

    this.viewModel = new viewModelObject();

    this.selectionManager = this.host.createSelectionManager();
    this.selectionManager.registerOnSelectCallback(() => {
      this.svg.call(updateHighlighting, this);
    })

    this.svg.append('g').classed("linesgroup", true)
    this.svg.append('g').classed("dotsgroup", true)
    this.svg.append('line').classed("ttip-line-x", true)
    this.svg.append('line').classed("ttip-line-y", true)
    this.svg.append('g').classed("xaxisgroup", true)
    this.svg.append('text').classed("xaxislabel", true)
    this.svg.append('g').classed("yaxisgroup", true)
    this.svg.append('text').classed("yaxislabel", true)
  }

  public update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
    try {
      this.host.eventService.renderingStarted(options);

      this.viewModel.update({ options: options, host: this.host });

      this.svg.attr("width", this.viewModel.plotProperties.width)
              .attr("height", this.viewModel.plotProperties.height)
              .call(drawXAxis, this)
              .call(drawYAxis, this)
              .call(drawTooltipLine, this)
              .call(drawLines, this)
              .call(drawDots, this)
              .call(updateHighlighting, this)
              .call(addContextMenu, this);

      this.host.eventService.renderingFinished(options);
    } catch (caught_error) {
      console.error(caught_error)
      this.host.eventService.renderingFailed(options);
    }
  }

  // Function to render the properties specified in capabilities.json to the properties pane
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    return this.viewModel.inputSettings.createSettingsEntry(options.objectName);
  }
}
