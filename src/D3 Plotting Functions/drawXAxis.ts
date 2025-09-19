import * as d3 from "./D3 Modules";
import type { axisProperties } from "../Classes";
import type { svgBaseType, Visual } from "../visual";

export default function drawXAxis(selection: svgBaseType, visualObj: Visual, refresh?: boolean) {
  const xAxisProperties: axisProperties = visualObj.viewModel.plotProperties.xAxis;
  const xAxis: d3.Axis<d3.NumberValue> = d3.axisBottom(visualObj.viewModel.plotProperties.xScale);

  if (xAxisProperties.ticks) {
    if (xAxisProperties.tick_count) {
      xAxis.ticks(xAxisProperties.tick_count)
    }
  } else {
    xAxis.tickValues([]);
  }

  const plotHeight: number = visualObj.viewModel.svgHeight;
  const xAxisHeight: number = plotHeight - visualObj.viewModel.plotProperties.yAxis.start_padding;
  const displayPlot: boolean = visualObj.viewModel.plotProperties.displayPlot;
  const xAxisGroup = selection.select(".xaxisgroup") as d3.Selection<SVGGElement, unknown, null, undefined>;

  xAxisGroup
      .call(xAxis)
      .attr("color", displayPlot ? xAxisProperties.colour : "#FFFFFF")
      // Plots the axis at the correct height
      .attr("transform", `translate(0, ${xAxisHeight})`);
  const tickGroup = xAxisGroup
      .selectAll(".tick text")
      .attr("transform","rotate(" + xAxisProperties.tick_rotation + ")")
      .attr("text-anchor", "middle")
      .attr("dx", null)
      .style("font-size", xAxisProperties.tick_size)
      .style("font-family", xAxisProperties.tick_font)
      .style("fill", displayPlot ? xAxisProperties.tick_colour : "#FFFFFF");

  if (xAxisProperties.tick_rotation != 0) {
    const textAnchor = xAxisProperties.tick_rotation < 0.0 ? "end" : "start";
    const dx = xAxisProperties.tick_rotation < 0.0 ? "-.8em" : ".8em";
    tickGroup.attr("text-anchor", textAnchor)
              .attr("dx", dx);
  }
  const xAxisNode: SVGGElement = selection.selectAll(".xaxisgroup").node() as SVGGElement;
  if (!xAxisNode) {
    selection.select(".xaxislabel")
              .style("fill", displayPlot ? xAxisProperties.label_colour : "#FFFFFF");
    return;
  }

  const textX: number = visualObj.viewModel.svgWidth / 2;
  const textY: number = visualObj.viewModel.plotProperties.yAxis.start_padding - visualObj.viewModel.inputSettings.settings.x_axis.xlimit_label_size * 0.5;

  xAxisGroup.select(".xaxislabel")
            .selectAll("text")
            .data([xAxisProperties.label])
            .join("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("transform", `translate(${textX}, ${textY})`)
            .style("text-anchor", "middle")
            .text(d => d)
            .style("font-size", xAxisProperties.label_size)
            .style("font-family", xAxisProperties.label_font)
            .style("fill", displayPlot ? xAxisProperties.label_colour : "#FFFFFF");
}
