"use strict";

import type powerbi from "powerbi-visuals-api";
import {
  PlotVisual, highlightOpacity, initialiseSvg, valueTickFormat, createTableContainer, showTable, drawSummaryTable, highlightTable,
  type ColumnKind, type PlotOptions, type SvgSelection, type TableSelection
} from "powerbi-visuals-core/rendering";
import drawMisc from "./D3 Plotting Functions/drawMisc";
import { viewModelClass, type plotData } from "./Classes";
import type { lineData, miscPoint } from "./Classes/viewModelClass";
import type { settingsValueType } from "./settings";
import { identitySelected, selectionState } from "powerbi-visuals-core/powerbi";
import { lowerLimitLines, standardLineKeys } from "powerbi-visuals-core/settings";

export type svgBaseType = SvgSelection;

const columnKinds: Record<string, ColumnKind> = {
  value: "number", target: "number", alt_target: "number",
  ll99: "number", ll95: "number", ll68: "number", ul68: "number", ul95: "number", ul99: "number",
  numerator: "integer", denominator: "integer",
  two_sigma: "flag", three_sigma: "flag"
};

export class Visual extends PlotVisual<plotData, viewModelClass, settingsValueType, lineData> {
  tableDiv: TableSelection;
  protected readonly lineKeys = standardLineKeys;

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions | undefined) {
    super(options, host => new viewModelClass(host));
    this.tableDiv = createTableContainer(this.element);
  }

  resizeCanvas(width: number, height: number): void {
    super.resizeCanvas(width, height);
    showTable(this.tableDiv, width === 0 && height === 0);
  }

  protected get settings(): settingsValueType {
    return this.viewModel.inputSettings.settings[0];
  }

  protected drawAlternate(): boolean {
    const viewModel = this.viewModel;
    if (viewModel.showMisc) {
      this.svg.call(drawMisc, this);
      return true;
    }
    const svg = this.svg.node();
    if (svg !== null && !this.svg.select(".misc-root").empty()) {
      initialiseSvg(svg, true);
    }
    if (!this.settings.summary_table.show_table) {
      return false;
    }
    this.resizeCanvas(0, 0);
    drawSummaryTable(this.tableDiv, {
      columns: viewModel.tableColumns,
      rows: viewModel.plotPoints,
      kinds: columnKinds,
      settings: this.settings.summary_table,
      formatValue: viewModel.inputSettings.derivedSettings[0].formatValue,
      width: viewModel.svgWidth,
      host: this.host,
      selectionManager: this.selectionManager,
      onSelectionChange: () => this.updateHighlighting()
    });
    this.addContextMenu(this.tableDiv.node(), true);
    return true;
  }

  updateHighlighting(): void {
    const viewModel = this.viewModel;
    if (viewModel.showMisc) {
      const state = selectionState(this.selectionManager, viewModel.miscAnyHighlights);
      this.svg.selectAll<SVGRectElement, miscPoint>(".misc-bar").attr("opacity", point =>
        highlightOpacity(point.aesthetics, state.active, identitySelected(point.identity, state.selected) || point.highlighted));
      return;
    }
    const state = selectionState(this.selectionManager, viewModel.inputData ? viewModel.inputData.anyHighlights : false);
    const settings = this.settings;
    const table = settings.summary_table;
    highlightTable(this.tableDiv, state, () => ({
      opacity: table.table_opacity, opacity_selected: table.table_opacity_selected, opacity_unselected: table.table_opacity_unselected
    }));
    // Group text fades by its own opacities; markers by the dot ones
    this.highlightPlotPoints(state, point => settings.scatter.use_group_text
      ? {
        opacity: point.aesthetics.scatter_text_opacity,
        opacity_selected: point.aesthetics.scatter_text_opacity_selected,
        opacity_unselected: point.aesthetics.scatter_text_opacity_unselected
      }
      : point.aesthetics);
  }

  protected plotOptions(): PlotOptions<plotData, lineData> {
    const settings = this.settings;
    return {
      tickFormats: {
        x: undefined,
        y: valueTickFormat(settings.y_axis.ylimit_sig_figs ?? settings.funnel.sig_figs, this.viewModel.inputSettings.derivedSettings[0].percentLabels)
      },
      verticalCrosshair: true,
      lineSettings: () => settings.lines,
      lowerLines: lowerLimitLines,
      dots: {
        show: true,
        text: settings.scatter.use_group_text
          ? point => ({
            text: point.group_text, size: point.aesthetics.scatter_text_size,
            font: point.aesthetics.scatter_text_font, colour: point.aesthetics.scatter_text_colour
          })
          : undefined,
        onClick: undefined
      }
    };
  }
}
