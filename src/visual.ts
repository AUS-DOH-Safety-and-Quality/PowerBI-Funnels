"use strict";

import type powerbi from "powerbi-visuals-api";
type EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
type VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
type ISelectionId = powerbi.visuals.ISelectionId;
import * as d3 from "./D3 Plotting Functions/D3 Modules";
import { drawXAxis, drawYAxis, drawTooltipLine, drawLines,
          drawDots, addContextMenu,
          initialiseSVG, drawErrors } from "./D3 Plotting Functions"
import { viewModelClass, type defaultSettingsKeys, type viewModelValidationT, type plotData } from "./Classes"
import { identitySelected } from "./Functions";

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
    const opacityFull: number = this.viewModel.inputSettings.settings.scatter.opacity;
    const opacityReduced: number = this.viewModel.inputSettings.settings.scatter.opacity_unselected;

    const defaultOpacity: number = (anyHighlights || (allSelectionIDs.length > 0))
                                      ? opacityReduced
                                      : opacityFull;
    this.svg.selectAll(".linesgroup").style("stroke-opacity", defaultOpacity);

    const dotsSelection = this.svg.selectAll(".dotsgroup").selectChildren();

    dotsSelection.style("fill-opacity", defaultOpacity);
    if (anyHighlights || (allSelectionIDs.length > 0)) {
      dotsSelection.nodes().forEach(currentDotNode => {
        const dot: plotData = d3.select(currentDotNode).datum() as plotData;
        const currentPointSelected: boolean = identitySelected(dot.identity, this.selectionManager);
        const currentPointHighlighted: boolean = dot.highlighted;
        const newDotOpacity: number = (currentPointSelected || currentPointHighlighted) ? dot.aesthetics.opacity : dot.aesthetics.opacity_unselected;
        d3.select(currentDotNode).style("fill-opacity", newDotOpacity);
      })
    }
  }

  drawVisual(): void {
    this.svg.call(drawXAxis, this)
            .call(drawYAxis, this)
            .call(drawTooltipLine, this)
            .call(drawLines, this)
            .call(drawDots, this)
            .call(addContextMenu, this);
  }

  adjustPaddingForOverflow(): void {
    let xLeftOverflow: number = 0;
    let xRightOverflow: number = 0;
    let yBottomOverflow: number = 0;
    let yTopOverflow: number = 0;
    const svgWidth: number = this.viewModel.svgWidth;
    const svgHeight: number = this.viewModel.svgHeight;
    this.svg.selectChildren().each(function() {
      const currentClass: string = d3.select(this).attr("class");
      if (currentClass === "yaxislabel" || currentClass === "xaxislabel") {
        return;
      }
      const boundRect = (this as SVGGraphicsElement).getBoundingClientRect();
      const bbox = (this as SVGGraphicsElement).getBBox();
      xLeftOverflow = Math.min(xLeftOverflow, bbox.x);
      xRightOverflow = Math.max(xRightOverflow, boundRect.right - svgWidth);
      yBottomOverflow = Math.max(yBottomOverflow, boundRect.bottom - svgHeight);
      yTopOverflow = Math.min(yTopOverflow, boundRect.top);
    });

    xLeftOverflow = Math.abs(xLeftOverflow);
    xRightOverflow = Math.abs(xRightOverflow);
    yBottomOverflow = Math.abs(yBottomOverflow);
    yTopOverflow = Math.abs(yTopOverflow);

    // Only redraw plot if overflow occurred
    if ((xLeftOverflow + xRightOverflow + yBottomOverflow + yTopOverflow) > 0) {
      this.viewModel.plotProperties.xAxis.start_padding += xLeftOverflow + this.viewModel.plotProperties.xAxis.start_padding;
      this.viewModel.plotProperties.xAxis.end_padding += xRightOverflow + this.viewModel.plotProperties.xAxis.end_padding;
      this.viewModel.plotProperties.yAxis.start_padding += yBottomOverflow + this.viewModel.plotProperties.yAxis.start_padding;
      this.viewModel.plotProperties.yAxis.end_padding += yTopOverflow + this.viewModel.plotProperties.yAxis.end_padding;
      this.viewModel.plotProperties.initialiseScale(svgWidth, svgHeight);
      this.drawVisual();
    }
  }

  // Function to render the properties specified in capabilities.json to the properties pane
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumerationObject {
    return this.viewModel.inputSettings.createSettingsEntry(options.objectName as defaultSettingsKeys);
  }
}
