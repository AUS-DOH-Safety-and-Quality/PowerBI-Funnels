import type { svgBaseType, Visual } from "../visual";
import lineKeys, { type LineName } from "../Functions/lineKeys";
import { lineLabel, lineSetting } from "powerbi-visuals-core/settings";
import { drawLineLabels, type LineLabel } from "powerbi-visuals-core/rendering";

// Lower interval lines place outside labels below the line (finding 18)
const lowerLines: Record<LineName, boolean> = {
  ll99: true, ll95: true, ll68: true, ul68: false, ul95: false, ul99: false, target: false, alt_target: false
};

// Labels each visible line's final defined endpoint (finding 14); Core places and draws them
export default function drawLabels(selection: svgBaseType, visualObj: Visual) {
  const group = selection.select<SVGGElement>(".linesgroup").node();
  if (group === null) return;
  const inputSettings = visualObj.viewModel.inputSettings;
  const lineSettings = inputSettings.settings.lines;
  const lines = visualObj.viewModel.groupedLines;
  const formatValue = inputSettings.derivedSettings.formatValue;
  const frame = visualObj.plotProperties;
  const labels: LineLabel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const [name, points] = lines[i];
    const point = points[points.length - 1];
    const key = lineKeys[name];
    if (point === undefined || point.line_value === undefined || !lineSetting<boolean>(lineSettings, "plot_label_show", key)) continue;
    const value = point.line_value;
    labels.push(lineLabel(lineSettings, key, { x: frame.xScale(point.x), y: frame.yScale(value), value }, lowerLines[name], formatValue));
  }
  drawLineLabels(group, labels);
}
