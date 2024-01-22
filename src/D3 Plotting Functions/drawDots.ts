import type { plotData } from "../Classes";
import { between } from "../Functions";
import type { svgBaseType, Visual } from "../visual";
import { updateHighlighting } from "../D3 Plotting Functions";
import type { Selection, BaseType } from "./D3 Modules"

type aestheticSelection = Selection<SVGGraphicsElement, plotData, BaseType, any>;

function circle_attr(selection: aestheticSelection, visualObj: Visual): void {
  const scatter_settings = visualObj.viewModel.inputSettings.settings.scatter;
  const display_text: boolean = scatter_settings.use_group_text;

  selection
    .attr("cy", (d: plotData) => visualObj.viewModel.plotProperties.yScale(d.value))
    .attr("cx", (d: plotData) => visualObj.viewModel.plotProperties.xScale(d.x))
    .attr("r", (d: plotData) => display_text ? scatter_settings.scatter_text_size * 0.5 : d.aesthetics.size)
    .style("fill", (d: plotData) => {
      const ylower: number = visualObj.viewModel.plotProperties.yAxis.lower;
      const yupper: number = visualObj.viewModel.plotProperties.yAxis.upper;
      const xlower: number = visualObj.viewModel.plotProperties.xAxis.lower;
      const xupper: number = visualObj.viewModel.plotProperties.xAxis.upper;
      return (between(d.value, ylower, yupper) && between(d.x, xlower, xupper) && !display_text)
              ? d.aesthetics.colour
              : "#FFFFFF";
    })
}

function text_attr(selection: aestheticSelection, visualObj: Visual): void {
  selection
    .attr("y", (d: plotData) => visualObj.viewModel.plotProperties.yScale(d.value))
    .attr("x", (d: plotData) => visualObj.viewModel.plotProperties.xScale(d.x))
    .attr("dy", "0.35em")
    .text((d: plotData) => d.tooltip.find((element) => element.displayName == "Group").value)
    .style("text-anchor", "middle")
    .style("vertical-align", "sub")
    .style("font-size", (d: plotData) => `${d.aesthetics.scatter_text_size}px`)
    .style("font-family", (d: plotData) => d.aesthetics.scatter_text_font)
    .style("fill", (d: plotData) => d.aesthetics.scatter_text_colour)
}

export default function drawDots(selection: svgBaseType, visualObj: Visual): void {
  const use_group_text: boolean = visualObj.viewModel.inputSettings.settings.scatter.use_group_text;
  selection
    .selectAll(".dotsgroup")
    .selectAll(".dotsgroup-child")
    .data(visualObj.viewModel.plotPoints)
    .join(
      (enter) => {
        const g = enter.append("g").classed("dotsgroup-child", true);

        g.append("circle")
          .call(circle_attr, visualObj)
          .on("click", (event, d: plotData) => {
            // Pass identities of selected data back to PowerBI
            visualObj.selectionManager
                // Propagate identities of selected data back to
                //   PowerBI based on all selected dots
                .select(d.identity, (event.ctrlKey || event.metaKey))
                // Change opacity of non-selected dots
                .then(() => { selection.call(updateHighlighting, visualObj); });

            event.stopPropagation();
          })
          // Display tooltip content on mouseover
          .on("mouseover", (event, d: plotData) => {
            // Get screen coordinates of mouse pointer, tooltip will
            //   be displayed at these coordinates
            const x = event.pageX;
            const y = event.pageY;

            visualObj.host.tooltipService.show({
              dataItems: d.tooltip,
              identities: [d.identity],
              coordinates: [x, y],
              isTouchEvent: false
            });
          })
          // Hide tooltip when mouse moves out of dot
          .on("mouseout", () => {
            visualObj.host.tooltipService.hide({
              immediately: true,
              isTouchEvent: false
            })
          });
        if (use_group_text) {
          g.append("text")
            .call(text_attr, visualObj);
        }

        return g
      },
      (update) => {
        update.select("circle").call(circle_attr, visualObj)
        const group_text = update.select("text").node() ? update.select("text") : update.append("text")
        if (use_group_text) {
          group_text.call(text_attr, visualObj)
        } else {
          group_text.remove()
        }
        return update
      },
    )

  selection.on('click', () => {
    visualObj.selectionManager.clear();
    selection.call(updateHighlighting, visualObj);
  });
}
