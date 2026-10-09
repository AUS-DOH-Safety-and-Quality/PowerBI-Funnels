import type { svgBaseType, Visual } from "../visual";
import { drawDots } from "powerbi-visuals-core/rendering";

export default function drawPlotDots(selection: svgBaseType, visualObj: Visual): void {
  const svg = selection.node();
  if (svg === null) {
    return;
  }
  const viewModel = visualObj.viewModel;
  const useGroupText = viewModel.inputSettings.settings.scatter.use_group_text;
  drawDots(svg, {
    frame: visualObj.plotProperties,
    points: viewModel.plotPoints,
    show: true,
    text: useGroupText
      ? point => ({
        text: point.group_text, size: point.aesthetics.scatter_text_size,
        font: point.aesthetics.scatter_text_font, colour: point.aesthetics.scatter_text_colour
      })
      : undefined,
    host: visualObj.host,
    selectionManager: visualObj.selectionManager,
    onSelectionChange: () => visualObj.updateHighlighting(),
    onClick: undefined
  });
}
