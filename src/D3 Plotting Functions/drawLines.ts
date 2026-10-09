import lineKeys from "../Functions/lineKeys";
import type { svgBaseType, Visual } from "../visual";
import { lineStyle } from "powerbi-visuals-core/settings";
import { drawLines, type PlotLine } from "powerbi-visuals-core/rendering";

export default function drawPlotLines(selection: svgBaseType, visualObj: Visual) {
  const group = selection.select<SVGGElement>(".linesgroup").node();
  if (group === null) {
    return;
  }
  const lineSettings = visualObj.viewModel.inputSettings.settings.lines;
  const grouped = visualObj.viewModel.groupedLines;
  const lines = new Array<PlotLine>(grouped.length);
  for (let i = 0; i < grouped.length; i++) {
    const name = grouped[i][0];
    const points = grouped[i][1];
    const style = lineStyle(lineSettings, lineKeys[name]);
    lines[i] = { name, points, style: () => style };
  }
  drawLines(group, { frame: visualObj.plotProperties, lines, palette: visualObj.viewModel.colourPalette });
}
