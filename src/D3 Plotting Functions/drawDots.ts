import type { plotData } from "../Classes";
import { between } from "../Functions";
import type { svgBaseType, Visual } from "../visual";
import { updateHighlighting } from "../D3 Plotting Functions";

export default function drawDots(selection: svgBaseType, visualObj: Visual) {
  selection
    .select(".dotsgroup")
    .selectAll("circle")
    .data(visualObj.viewModel.plotPoints)
    .join("circle")
    .filter((d: plotData) => d.value !== null)
    .attr("cy", (d: plotData) => visualObj.viewModel.plotProperties.yScale(d.value))
    .attr("cx", (d: plotData) => visualObj.viewModel.plotProperties.xScale(d.x))
    .attr("r", (d: plotData) => d.aesthetics.size)
    .style("fill", (d: plotData) => {
      const ylower: number = visualObj.viewModel.plotProperties.yAxis.lower;
      const yupper: number = visualObj.viewModel.plotProperties.yAxis.upper;
      const xlower: number = visualObj.viewModel.plotProperties.xAxis.lower;
      const xupper: number = visualObj.viewModel.plotProperties.xAxis.upper;
      return (between(d.value, ylower, yupper) && between(d.x, xlower, xupper))
              ? d.aesthetics.colour
              : "#FFFFFF";
    })
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

  selection.on('click', () => {
    visualObj.selectionManager.clear();
    selection.call(updateHighlighting, visualObj);
  });
}
