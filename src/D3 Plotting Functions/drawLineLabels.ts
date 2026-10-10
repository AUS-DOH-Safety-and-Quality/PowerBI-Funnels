import type { svgBaseType, Visual } from "../visual";
import lineKeys, { type LineName } from "../Functions/lineKeys";
import { lineLabel, lineSetting } from "powerbi-visuals-core/settings";
import { drawLineLabels, inPlot, type LineLabel } from "powerbi-visuals-core/rendering";

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

/** Labels each line's last point inside the axis limits; Core places and draws them */
export default function drawLabels(selection: svgBaseType, visualObj: Visual) {
  const group = selection.select<SVGGElement>(".linesgroup").node();
  if (group === null) {
    return;
  }
  const inputSettings = visualObj.viewModel.inputSettings;
  const lineSettings = inputSettings.settings.lines;
  const lines = visualObj.viewModel.groupedLines;
  const formatValue = inputSettings.derivedSettings.formatValue;
  const frame = visualObj.plotProperties;
  const labels: LineLabel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i][0];
    const points = lines[i][1];
    const key = lineKeys[name];
    if (!lineSetting<boolean>(lineSettings, "plot_label_show", key)) {
      continue;
    }
    for (let j = points.length - 1; j >= 0; j--) {
      const value = points[j].line_value;
      if (value !== undefined && inPlot(frame, points[j].x, value)) {
        labels.push(lineLabel(lineSettings, key, { x: frame.xScale(points[j].x), y: frame.yScale(value), value }, lowerLines[name], formatValue));
        break;
      }
    }
  }
  drawLineLabels(group, labels);
}
