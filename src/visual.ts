"use strict";

import type powerbi from "powerbi-visuals-api";
import {
  PlotVisual, drawPlotAxes, drawPlotTooltips, drawPlotDots, drawPlotDownload, drawPlotValueLabels, drawPlotLines, drawPlotLineLabels,
  highlightOpacity, initialiseSvg, valueTickFormat, type AxisBounds, type SvgSelection
} from "powerbi-visuals-core/rendering";
import addContextMenu from "./D3 Plotting Functions/addContextMenu";
import drawMisc from "./D3 Plotting Functions/drawMisc";
import { viewModelClass, type plotData } from "./Classes";
import type { miscPoint } from "./Classes/viewModelClass";
import axisRanges from "./Functions/axisRanges";
import downloadRows from "./Functions/downloadRows";
import lineKeys, { type LineName } from "./Functions/lineKeys";
import type { settingsValueType } from "./settings";
import { identitySelected, selectionState } from "powerbi-visuals-core/powerbi";
import { lineStyle } from "powerbi-visuals-core/settings";

export type svgBaseType = SvgSelection;

/** Lower interval lines place outside labels below the line */
const lowerLines: Record<LineName, boolean> = {
  ll99: true,
  ll95: true,
  ll68: true,
  ul68: false,
  ul95: false,
  ul99: false,
  target: false,
  alt_target: false
};

export class Visual extends PlotVisual<plotData, viewModelClass, settingsValueType> {
  protected readonly lineKeys = lineKeys;

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions | undefined) {
    super(options, host => new viewModelClass(host));
  }

  protected get settings(): settingsValueType {
    return this.viewModel.inputSettings.settings;
  }

  protected axisRanges(): { x: AxisBounds; y: AxisBounds } {
    return axisRanges(this.viewModel);
  }

  protected drawAlternate(): boolean {
    if (this.viewModel.inputSettings.showMisc) {
      this.svg.call(drawMisc, this);
      return true;
    }
    const svg = this.svg.node();
    if (svg !== null && !this.svg.select(".misc-root").empty()) {
      initialiseSvg(svg, true);
    }
    return false;
  }

  updateHighlighting(): void {
    const viewModel = this.viewModel;
    if (viewModel.inputSettings.showMisc) {
      const state = selectionState(this.selectionManager, viewModel.miscAnyHighlights);
      this.svg.selectAll<SVGRectElement, miscPoint>(".misc-bar").attr("opacity", point =>
        highlightOpacity(point.aesthetics, state.active, identitySelected(point.identity, state.selected) || point.highlighted));
      return;
    }
    const state = selectionState(this.selectionManager, viewModel.inputData ? viewModel.inputData.anyHighlights : false);
    const settings = this.settings;
    // Group text fades by its own opacities; markers by the dot ones
    this.highlightPlotPoints(state, point => settings.scatter.use_group_text
      ? {
        opacity: point.aesthetics.scatter_text_opacity,
        opacity_selected: point.aesthetics.scatter_text_opacity_selected,
        opacity_unselected: point.aesthetics.scatter_text_opacity_unselected
      }
      : point.aesthetics);
  }

  drawVisual(): void {
    const svg = this.svg.node();
    if (svg === null) {
      return;
    }
    const viewModel = this.viewModel;
    const settings = this.settings;
    const context = this.plotContext();
    drawPlotAxes(svg, context, {
      x: undefined,
      y: valueTickFormat(settings.y_axis.ylimit_sig_figs ?? settings.funnel.sig_figs, viewModel.inputSettings.derivedSettings.percentLabels)
    });
    drawPlotTooltips(svg, context, true);
    drawPlotLines(svg, context, viewModel.groupedLines, name => lineStyle(settings.lines, lineKeys[name]));
    drawPlotLineLabels(svg, context, {
      lines: viewModel.groupedLines,
      settings: settings.lines,
      keys: lineKeys,
      lower: name => lowerLines[name],
      format: viewModel.inputSettings.derivedSettings.formatValue,
      periodEnds: [viewModel.calculatedLimits.length - 1]
    });
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
}
