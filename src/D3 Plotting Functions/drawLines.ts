import { lineNameMap } from "../Functions/getAesthetic";
import type { svgBaseType, Visual } from "../visual";
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
    const [name, points] = grouped[i];
    const key = lineNameMap[name];
    const style = { colour: lineSettings[`colour_${key}`], width: lineSettings[`width_${key}`], type: lineSettings[`type_${key}`] };
    lines[i] = { name, points, style: () => style };
  }
  drawLines(group, { frame: visualObj.plotProperties, lines, palette: visualObj.viewModel.colourPalette });
}
