import type { svgBaseType, Visual } from "../visual";
import { lineNameMap, type LineName } from "../Functions/getAesthetic";
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
  const labels: LineLabel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const [name, points] = lines[i];
    const point = points[points.length - 1];
    const key = lineNameMap[name];
    if (point === undefined || point.line_value === undefined || !lineSettings[`plot_label_show_${key}`]) continue;
    labels.push({
      text: lineSettings[`plot_label_prefix_${key}`] + formatValue(point.line_value, "value"),
      x: visualObj.plotProperties.xScale(point.x),
      y: visualObj.plotProperties.yScale(point.line_value),
      position: lineSettings[`plot_label_position_${key}`],
      lower: lowerLines[name],
      hpad: lineSettings[`plot_label_hpad_${key}`],
      vpad: lineSettings[`plot_label_vpad_${key}`],
      lineWidth: lineSettings[`width_${key}`],
      size: lineSettings[`plot_label_size_${key}`],
      font: lineSettings[`plot_label_font_${key}`],
      colour: lineSettings[`plot_label_colour_${key}`]
    });
  }
  drawLineLabels(group, labels);
}
