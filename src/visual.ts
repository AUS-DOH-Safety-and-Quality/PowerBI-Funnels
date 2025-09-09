"use strict";

import type powerbi from "powerbi-visuals-api";
type EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
type VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
type ISelectionId = powerbi.visuals.ISelectionId;
import * as d3 from "./D3 Plotting Functions/D3 Modules";
import { drawXAxis, drawYAxis, drawTooltipLine, drawLines,
          drawDots, addContextMenu,
          initialiseSVG, drawErrors, drawValueLabels, drawLineLabels } from "./D3 Plotting Functions"
import { viewModelClass, type defaultSettingsKeys, type viewModelValidationT, type plotData, lineData } from "./Classes"
import { getAesthetic, identitySelected } from "./Functions";

export type svgBaseType = d3.Selection<SVGSVGElement, unknown, null, undefined>;

export class Visual implements powerbi.extensibility.IVisual {
  host: powerbi.extensibility.visual.IVisualHost;
  svg: svgBaseType;
  viewModel: viewModelClass;
  selectionManager: powerbi.extensibility.ISelectionManager;

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
    this.svg = d3.select(options.element).append("svg");
    this.host = options.host;
    this.viewModel = new viewModelClass();

    this.selectionManager = this.host.createSelectionManager();
    this.selectionManager.registerOnSelectCallback(() => this.updateHighlighting());
    this.svg.call(initialiseSVG);
  }

  public update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
    try {
      this.host.eventService.renderingStarted(options);
      // Remove printed error if refreshing after a previous error run
      this.svg.select(".errormessage").remove();

      // This step handles the updating of both the input data and settings
      // If there are any errors or failures, the update exits early sets the
      // update status to false
      const update_status: viewModelValidationT = this.viewModel.update(options, this.host);
      // If running headless just return without attempting to render
      if (options?.["headless"]) {
        return;
      }
      if (!update_status.status) {
        this.resizeCanvas(options.viewport.width, options.viewport.height);
        if (this.viewModel?.inputSettings?.settings?.canvas?.show_errors ?? true) {
          this.svg.call(drawErrors, options, update_status?.error, update_status?.type);
        } else {
          this.svg.call(initialiseSVG, true);
        }

        this.host.eventService.renderingFailed(options);
        return;
      }
      if (update_status.warning) {
        this.host.displayWarningIcon("Invalid inputs or settings ignored.\n",
                                      update_status.warning);
      }

      this.resizeCanvas(options.viewport.width, options.viewport.height);
      this.drawVisual();
      this.adjustPaddingForOverflow();

      this.updateHighlighting();
      this.host.eventService.renderingFinished(options);
    } catch (caught_error) {
      this.svg.call(drawErrors, options, caught_error.message, "internal");
      console.error(caught_error)
      this.host.eventService.renderingFailed(options);
    }
  }

  resizeCanvas(width: number, height: number): void {
    this.svg.attr("width", width).attr("height", height);
  }

  updateHighlighting(): void {
    const anyHighlights: boolean = this.viewModel.inputData ? this.viewModel.inputData.anyHighlights : false;
    const allSelectionIDs: ISelectionId[] = this.selectionManager.getSelectionIds() as ISelectionId[];

    const dotsSelection = this.svg.selectAll(".dotsgroup").selectChildren();
    const linesSelection = this.svg.selectAll(".linesgroup").selectChildren();

    // Set the default opacity for all lines and dots
    linesSelection.style("stroke-opacity", (d: [string, lineData[]]) => {
      return getAesthetic(d[0], "lines", "opacity", this.viewModel.inputSettings.settings)
    });
    dotsSelection.style("fill-opacity", (d: plotData) => d.aesthetics.opacity);
    dotsSelection.style("stroke-opacity", (d: plotData) => d.aesthetics.opacity);

    if (anyHighlights || (allSelectionIDs.length > 0)) {
      linesSelection.style("stroke-opacity", (d: [string, lineData[]]) => {
        return getAesthetic(d[0], "lines", "opacity_unselected", this.viewModel.inputSettings.settings)
      });
      dotsSelection.nodes().forEach(currentDotNode => {
        const dot: plotData = d3.select(currentDotNode).datum() as plotData;
        const currentPointSelected: boolean = identitySelected(dot.identity, this.selectionManager);
        const currentPointHighlighted: boolean = dot.highlighted;
        const newDotOpacity: number = (currentPointSelected || currentPointHighlighted) ? dot.aesthetics.opacity_selected : dot.aesthetics.opacity_unselected;
        d3.select(currentDotNode).style("fill-opacity", newDotOpacity);
        d3.select(currentDotNode).style("stroke-opacity", newDotOpacity);
      })
    }
  }

  drawVisual(): void {
    this.svg.call(drawXAxis, this)
            .call(drawYAxis, this)
            .call(drawTooltipLine, this)
            .call(drawLines, this)
            .call(drawLineLabels, this)
            .call(drawDots, this)
            .call(addContextMenu, this)
            .call(drawValueLabels, this);
  }

  adjustPaddingForOverflow(): void {
    const svgWidth: number = this.viewModel.svgWidth;
    const svgHeight: number = this.viewModel.svgHeight;
    const svgBBox: DOMRect = this.svg.node().getBBox();
    const overflowLeft: number = Math.abs(Math.min(0, svgBBox.x));
    const overflowRight: number = Math.max(0, svgBBox.width + svgBBox.x - svgWidth);
    const overflowTop: number = Math.abs(Math.min(0, svgBBox.y));
    const overflowBottom: number = Math.max(0, svgBBox.height + svgBBox.y - svgHeight);
    if (overflowLeft > 0) {
      this.viewModel.plotProperties.xAxis.start_padding += overflowLeft + this.viewModel.plotProperties.xAxis.start_padding;
    }
    if (overflowRight > 0) {
      this.viewModel.plotProperties.xAxis.end_padding += overflowRight + this.viewModel.plotProperties.xAxis.end_padding;
    }
    if (overflowTop > 0) {
      this.viewModel.plotProperties.yAxis.end_padding += overflowTop + this.viewModel.plotProperties.yAxis.end_padding;
    }
    if (overflowBottom > 0) {
      this.viewModel.plotProperties.yAxis.start_padding += overflowBottom + this.viewModel.plotProperties.yAxis.start_padding;
    }
    if (overflowLeft > 0 || overflowRight > 0 || overflowTop > 0 || overflowBottom > 0) {
      this.viewModel.plotProperties.initialiseScale(svgWidth, svgHeight);
      this.drawVisual();
    }
  }

  // Function to render the properties specified in capabilities.json to the properties pane
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumerationObject {
    return this.viewModel.inputSettings.createSettingsEntry(options.objectName as defaultSettingsKeys);
  }
}
