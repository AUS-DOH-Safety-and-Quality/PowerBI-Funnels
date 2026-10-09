import * as d3 from "./D3 Modules";
import type { axisProperties } from "../Classes";
import type { svgBaseType, Visual } from "../visual";
import { drawGridlines, axisLabelPlacement } from "powerbi-visuals-core/rendering";

export default function drawYAxis(selection: svgBaseType, visualObj: Visual, refresh?: boolean) {
  const yAxisProperties: axisProperties = visualObj.plotProperties.yAxis;
  const yAxis: d3.Axis<number> = d3.axisLeft(visualObj.plotProperties.yScale);
  yAxis.tickSizeOuter(yAxisProperties.tick_marks ? 6 : 0);
  const yaxis_sig_figs =  visualObj.viewModel.inputSettings.settings.y_axis.ylimit_sig_figs;
  const sig_figs: number = yaxis_sig_figs ?? visualObj.viewModel.inputSettings.settings.funnel.sig_figs;
  const displayPlot: boolean = visualObj.plotProperties.displayPlot;

  if (yAxisProperties.ticks) {
    if (yAxisProperties.tick_count) {
      yAxis.ticks(yAxisProperties.tick_count)
    }
    if (visualObj.viewModel.inputData) {
      yAxis.tickFormat(
        (d: number) => {
          return visualObj.viewModel.inputSettings.derivedSettings.percentLabels
            ? d.toFixed(sig_figs) + "%"
            : d.toFixed(sig_figs);
        }
      );
    }
  } else {
    yAxis.tickValues([]);
  }
  const yAxisGroup = selection.select(".yaxisgroup") as d3.Selection<SVGGElement, unknown, null, undefined>;

  yAxisGroup
      .call(yAxis)
      .attr("color", displayPlot ? yAxisProperties.colour : "#FFFFFF")
      .attr("transform", `translate(${visualObj.plotProperties.xAxis.start_padding}, 0)`)
      .selectAll(".tick text")
      // Right-align
      .style("text-anchor", "right")
      // Rotate tick labels
      .attr("transform", `rotate(${yAxisProperties.tick_rotation})`)
      // Scale font
      .style("font-size", yAxisProperties.tick_size)
      .style("font-family", yAxisProperties.tick_font)
      .style("fill", displayPlot ? yAxisProperties.tick_colour : "#FFFFFF");

  yAxisGroup.selectAll(".tick line")
      .style("stroke", yAxisProperties.tick_marks ? "currentColor" : "none");
  const gridGroup = selection.select<SVGGElement>(".gridgroup").node();
  if (gridGroup !== null) {
    drawGridlines({
      container: gridGroup, className: "ygridline", orientation: "horizontal",
      values: yAxisProperties.grid_show ? yAxisGroup.selectAll<SVGGElement, number>(".tick").data() : [],
      scale: visualObj.plotProperties.yScale,
      from: visualObj.plotProperties.xAxis.start_padding, to: visualObj.viewModel.svgWidth - visualObj.plotProperties.xAxis.end_padding,
      colour: displayPlot ? yAxisProperties.grid_colour : "#FFFFFF",
      width: yAxisProperties.grid_width
    });
  }

  const textX: number = -(visualObj.plotProperties.xAxis.start_padding - visualObj.viewModel.inputSettings.settings.y_axis.ylimit_label_size * 1.5);
  const label = axisLabelPlacement(yAxisProperties.label_align, visualObj.viewModel.svgHeight - yAxisProperties.start_padding,
                                   yAxisProperties.end_padding);
  const textY: number = label.position;
  yAxisGroup.select(".yaxislabel")
            .selectAll("text")
            .data([visualObj.viewModel.inputSettings.settings.y_axis.ylimit_label])
            .join("text")
            .attr("x", textX)
            .attr("y", textY)
            .attr("transform", `rotate(-90, ${textX}, ${textY})`)
            .style("text-anchor", label.anchor)
            .text(d => d)
            .style("font-size", yAxisProperties.label_size)
            .style("font-style", yAxisProperties.label_style)
            .style("font-family", yAxisProperties.label_font)
            .style("fill", yAxisProperties.label_colour);
}
