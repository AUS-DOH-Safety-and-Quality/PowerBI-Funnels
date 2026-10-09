"use strict";

import type powerbi from "powerbi-visuals-api";
import * as d3 from "./D3 Plotting Functions/D3 Modules";
import { drawLines, addContextMenu, drawLineLabels } from "./D3 Plotting Functions"
import { viewModelClass, type viewModelValidationT, type plotData } from "./Classes"
import axisRanges from "./Functions/axisRanges";
import downloadRows from "./Functions/downloadRows";
import lineKeys, { type LineName } from "./Functions/lineKeys";
import { identitySelected, selectionState } from "powerbi-visuals-core/powerbi";
import { lineOpacity } from "powerbi-visuals-core/settings";
import {
  createPlotFrame, fitPlotToOverflow, highlightOpacity, highlightPlot, initialiseSvg, drawErrorMessage,
  drawPlotAxes, drawPlotTooltips, drawPlotDots, drawPlotDownload, drawPlotValueLabels, valueTickFormat,
  type ErrorKind, type PlotContext, type PlotFrame
} from "powerbi-visuals-core/rendering";
import drawMisc from "./D3 Plotting Functions/drawMisc";
import type { miscPoint } from "./Classes/viewModelClass";

export type svgBaseType = d3.Selection<SVGSVGElement, unknown, null, undefined>;

export class Visual implements powerbi.extensibility.IVisual {
  host: powerbi.extensibility.visual.IVisualHost;
  svg: svgBaseType;
  viewModel: viewModelClass;
  private currentPlotProperties: PlotFrame | undefined;

  get plotProperties(): PlotFrame {
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
      const viewModel = this.viewModel;
      this.currentPlotProperties = createPlotFrame({
        width: options.viewport.width,
        height: options.viewport.height,
        displayPlot: viewModel.plotPoints.length > 0,
        ...axisRanges(viewModel, update_status.data),
        settings: viewModel.inputSettings.settings,
        palette: viewModel.colourPalette
      });
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
    const viewModel = this.viewModel;
    if (viewModel.inputSettings.showMisc) {
      const { active, selected } = selectionState(this.selectionManager, viewModel.miscAnyHighlights);
      this.svg.selectAll<SVGRectElement, miscPoint>(".misc-bar").attr("opacity", point =>
        highlightOpacity(point.aesthetics, active, identitySelected(point.identity, selected) || point.highlighted));
      return;
    }
    const svg = this.svg.node();
    if (svg === null) {
      return;
    }
    const { active, selected } = selectionState(this.selectionManager, viewModel.inputData ? viewModel.inputData.anyHighlights : false);
    const settings = viewModel.inputSettings.settings;
    highlightPlot<plotData>(svg, {
      active, selected,
      lineOpacity: line => lineOpacity(settings.lines, lineKeys[line.name as LineName], active),
      // Group text fades by its own opacities; markers by the dot ones
      dotOpacities: point => settings.scatter.use_group_text
        ? { opacity: point.aesthetics.scatter_text_opacity, opacity_selected: point.aesthetics.scatter_text_opacity_selected,
            opacity_unselected: point.aesthetics.scatter_text_opacity_unselected }
        : point.aesthetics
    });
  }

  drawErrors(options: powerbi.extensibility.visual.VisualUpdateOptions, message: string, kind: ErrorKind | undefined, show: boolean): void {
    const svg = this.svg.node();
    if (svg === null) {
      return;
    }
    drawErrorMessage(svg, {
      width: options.viewport.width, height: options.viewport.height,
      message, kind, show, colour: this.viewModel.colourPalette.foregroundColour
    });
  }

  plotContext(): PlotContext<plotData> {
    const viewModel = this.viewModel;
    return {
      frame: this.plotProperties,
      points: viewModel.plotPoints,
      palette: viewModel.colourPalette,
      settings: viewModel.inputSettings.settings,
      host: this.host,
      selectionManager: this.selectionManager,
      onSelectionChange: () => this.updateHighlighting(),
      headless: viewModel.headless,
      frontend: viewModel.frontend
    };
  }

  drawVisual(): void {
    const svg = this.svg.node();
    if (svg === null) {
      return;
    }
    const viewModel = this.viewModel;
    const settings = viewModel.inputSettings.settings;
    const context = this.plotContext();
    drawPlotAxes(svg, context, {
      x: undefined,
      y: valueTickFormat(settings.y_axis.ylimit_sig_figs ?? settings.funnel.sig_figs, viewModel.inputSettings.derivedSettings.percentLabels)
    });
    drawPlotTooltips(svg, context, true);
    this.svg.call(drawLines, this)
            .call(drawLineLabels, this);
    drawPlotDots(svg, context, {
      show: true,
      text: settings.scatter.use_group_text
        ? point => ({
          text: point.group_text, size: point.aesthetics.scatter_text_size,
          font: point.aesthetics.scatter_text_font, colour: point.aesthetics.scatter_text_colour
        })
        : undefined,
      onClick: undefined
    });
    this.svg.call(addContextMenu, this);
    drawPlotDownload(svg, context, () => downloadRows(viewModel));
    drawPlotValueLabels(svg, context, viewModel.inputData?.anyLabels ?? false);
  }

  adjustPaddingForOverflow(): void {
    // Headless mode does not render to screen so do not attempt to adjust for overflow
    if (this.viewModel.headless) {
      return;
    }
    const svg = this.svg.node();
    if (svg === null) {
      return;
    }
    const fitted = fitPlotToOverflow(svg, this.plotProperties);
    if (fitted === undefined) {
      return;
    }
    this.currentPlotProperties = fitted;
    this.drawVisual();
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.viewModel.inputSettings.getFormattingModel();
  }
}
