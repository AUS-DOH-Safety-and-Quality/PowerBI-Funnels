import type { svgBaseType, Visual } from "../visual";
import type { plotData, plotPropertiesClass } from "../Classes/";
import { drawCrosshairs } from "powerbi-visuals-core/rendering";

export default function drawTooltipLine(selection: svgBaseType, visualObj: Visual) {
  const plotProperties: plotPropertiesClass = visualObj.plotProperties;
  const vertical = selection.select<SVGLineElement>(".ttip-line-x").node();
  const horizontal = selection.select<SVGLineElement>(".ttip-line-y").node();
  if (vertical === null || horizontal === null) return;
  const crosshairs = drawCrosshairs({
    vertical, horizontal,
    left: plotProperties.xAxis.start_padding,
    right: plotProperties.width - plotProperties.xAxis.end_padding,
    top: plotProperties.yAxis.end_padding,
    bottom: plotProperties.height - plotProperties.yAxis.start_padding,
    colour: visualObj.viewModel.colourPalette.isHighContrast
      ? visualObj.viewModel.colourPalette.foregroundColour
      : "black"
  });

  selection.on("mousemove", (event) => {
    if (!plotProperties.displayPlot) {
      return;
    }
    const plotPoints: plotData[] = visualObj.viewModel.plotPoints

    const node = visualObj.svg.node();
    if (node === null) return;
    const boundRect = node.getBoundingClientRect();
    const xValue: number = (event.clientX - boundRect.left);
    const yValue: number = (event.clientY - boundRect.top);
    let nearest: { index: number; x: number; y: number } | undefined;
    let nearestDistance: number = Infinity;
    for (let i = 0; i < plotPoints.length; i++) {
      const curr_x: number = plotProperties.xScale(plotPoints[i].x);
      const curr_y: number = plotProperties.yScale(plotPoints[i].value);
      const curr_diff: number = Math.abs(curr_x - xValue) + Math.abs(curr_y - yValue);
      if (curr_diff < nearestDistance) {
        nearestDistance = curr_diff;
        nearest = { index: i, x: curr_x, y: curr_y };
      }
    }

    if (nearest === undefined) return;
    visualObj.host.tooltipService.show({
      dataItems: plotPoints[nearest.index].tooltip,
      identities: [plotPoints[nearest.index].identity],
      coordinates: [nearest.x, nearest.y],
      isTouchEvent: false
    });
    crosshairs.show(nearest.x, nearest.y);
  })
  .on("mouseleave", () => {
    if (!plotProperties.displayPlot) {
      return;
    }
    visualObj.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
    crosshairs.hide();
  });
}
