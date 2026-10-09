"use strict";

import type powerbi from "powerbi-visuals-api";
type ISelectionId = powerbi.visuals.ISelectionId;
import * as d3 from "./D3 Plotting Functions/D3 Modules";
import { drawAxes, drawTooltipLine, drawLines, drawDots, addContextMenu,
          drawValueLabels, drawLineLabels, drawDownloadButton } from "./D3 Plotting Functions"
import { viewModelClass, type viewModelValidationT, type plotData, plotPropertiesClass } from "./Classes"
import getAesthetic from "./Functions/getAesthetic";
import { identitySelected, selectedKeys } from "powerbi-visuals-core/powerbi";
import {
  adjustPaddingForOverflow, highlightOpacity, initialiseSvg, drawErrorMessage, type ErrorKind, type PlotLine
} from "powerbi-visuals-core/rendering";
import type { LineName } from "./Functions/getAesthetic";
import drawMisc from "./D3 Plotting Functions/drawMisc";
import type { miscPoint } from "./Classes/viewModelClass";

export type svgBaseType = d3.Selection<SVGSVGElement, unknown, null, undefined>;

export class Visual implements powerbi.extensibility.IVisual {
  host: powerbi.extensibility.visual.IVisualHost;
  svg: svgBaseType;
  viewModel: viewModelClass;
  private currentPlotProperties: plotPropertiesClass | undefined;

  get plotProperties(): plotPropertiesClass {
    if (this.currentPlotProperties === undefined) throw new Error("Plot properties require validated data.");
    return this.currentPlotProperties;
  }
  selectionManager: powerbi.extensibility.ISelectionManager;

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions | undefined) {
    if (options === undefined) {
      throw new Error("Visual constructor options are required.");
    }
    this.svg = d3.select(options.element).append("svg");
    this.host = options.host;
    this.viewModel = new viewModelClass(this.host);

    this.selectionManager = this.host.createSelectionManager();
    this.selectionManager.registerOnSelectCallback(() => this.updateHighlighting());
    const svg = this.svg.node();
    if (svg !== null) {
      initialiseSvg(svg);
    }
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
        this.currentPlotProperties = undefined;
        this.resizeCanvas(options.viewport.width, options.viewport.height);
        this.drawErrors(options, update_status.error, update_status.type,
                        this.viewModel?.inputSettings?.settings?.canvas?.show_errors ?? true);

        this.host.eventService.renderingFailed(options);
        return;
      }

      if (update_status.warning) {
        this.host.displayWarningIcon("Invalid inputs or settings ignored.\n",
                                      update_status.warning);
      }

      this.resizeCanvas(options.viewport.width, options.viewport.height);
      if (this.viewModel.inputSettings.showMisc) {
        this.currentPlotProperties = undefined;
        this.svg.call(drawMisc, this);
        this.updateHighlighting();
        this.host.eventService.renderingFinished(options);
        return;
      }
      const svg = this.svg.node();
      if (svg !== null && !this.svg.select(".misc-root").empty()) {
        initialiseSvg(svg, true);
      }
      this.currentPlotProperties = new plotPropertiesClass(options, this.viewModel, update_status.data);
      this.drawVisual();
      this.adjustPaddingForOverflow();

      this.updateHighlighting();
      this.host.eventService.renderingFinished(options);
    } catch (caught_error) {
      this.currentPlotProperties = undefined;
      this.drawErrors(options, caught_error instanceof Error ? caught_error.message : String(caught_error), "internal", true);
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
    const selected = selectedKeys(allSelectionIDs);

    if (this.viewModel.inputSettings.showMisc) {
      const active = this.viewModel.miscAnyHighlights || allSelectionIDs.length > 0;
      this.svg.selectAll<SVGRectElement, miscPoint>(".misc-bar").attr("opacity", point =>
        highlightOpacity(point.aesthetics, active, identitySelected(point.identity, selected) || point.highlighted));
      return;
    }

    const dotsSelection = this.svg.selectAll(".dotsgroup").selectChildren<SVGGElement, plotData>();
    const linesSelection = this.svg.selectAll(".linesgroup").selectChildren<SVGGElement, PlotLine>("g");

    const active = anyHighlights || allSelectionIDs.length > 0;
    const settings = this.viewModel.inputSettings.settings;
    linesSelection.style("stroke-opacity", (d: PlotLine) => getAesthetic(d.name as LineName, "lines", active ? "opacity_unselected" : "opacity", settings));
    const dotOpacity = (d: plotData) => highlightOpacity(d.aesthetics, active, identitySelected(d.identity, selected) || d.highlighted);
    dotsSelection.style("fill-opacity", dotOpacity).style("stroke-opacity", dotOpacity);
  }

  // A hidden error leaves an empty canvas
  drawErrors(options: powerbi.extensibility.visual.VisualUpdateOptions, message: string, kind: ErrorKind | undefined, show: boolean): void {
    const svg = this.svg.node();
    if (svg === null) {
      return;
    }
    if (show) {
      drawErrorMessage(svg, {
        width: options.viewport.width, height: options.viewport.height,
        message, kind, colour: this.viewModel.colourPalette.foregroundColour
      });
    } else {
      initialiseSvg(svg, true);
    }
  }

  drawVisual(): void {
    this.svg.call(drawAxes, this)
            .call(drawTooltipLine, this)
            .call(drawLines, this)
            .call(drawLineLabels, this)
            .call(drawDots, this)
            .call(addContextMenu, this)
            .call(drawDownloadButton, this)
            .call(drawValueLabels, this);
  }

  adjustPaddingForOverflow(): void {
    // Headless mode does not render to screen so do not attempt to adjust for overflow
    if (this.viewModel.headless) {
      return;
    }
    const node = this.svg.node();
    if (node === null) {
      return;
    }
    const { xAxis, yAxis } = this.plotProperties;
    const padding = adjustPaddingForOverflow(node.getBBox(), this.viewModel.svgWidth, this.viewModel.svgHeight,
      { left: xAxis.start_padding, right: xAxis.end_padding, top: yAxis.end_padding, bottom: yAxis.start_padding });
    if (padding === undefined) {
      return;
    }
    xAxis.start_padding = padding.left;
    xAxis.end_padding = padding.right;
    yAxis.end_padding = padding.top;
    yAxis.start_padding = padding.bottom;
    this.plotProperties.initialiseScale(this.viewModel.svgWidth, this.viewModel.svgHeight);
    this.drawVisual();
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.viewModel.inputSettings.getFormattingModel();
  }
}
