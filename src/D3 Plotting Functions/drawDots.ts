import type { plotData } from "../Classes";
import { between } from "../Functions";
import type { svgBaseType, Visual } from "../visual";
import { updateHighlighting } from "../D3 Plotting Functions";
import { select, type Selection, type BaseType } from "./D3 Modules"

type aestheticSelection = Selection<SVGGraphicsElement, plotData, BaseType, any>;
type dataPointSelection = Selection<SVGGraphicsElement, plotData, BaseType, any>;

export default function drawDots(selection: svgBaseType, visualObj: Visual): void {
  const use_group_text: boolean = visualObj.viewModel.inputSettings.settings.scatter.use_group_text;
  /**
   * Use the join() call with custom enter & update functions so that we can
   *   create/update both text and circle elements for a given observation
   *   in a single pass
   */
  selection
    .selectAll(".dotsgroup")
    .selectAll(".dotsgroup-child")
    .data(visualObj.viewModel.plotPoints)
    .join(
      (enter) => {
        const dataPoint = enter.append("g").classed("dotsgroup-child", true);

        dataPoint.append("circle").call(dot_attributes, visualObj);
        if (use_group_text) {
          dataPoint.append("text").call(text_attributes, visualObj);
        }
        dataPoint.call(dot_tooltips, visualObj)

        return dataPoint
      },
      (update) => {
        update.select("circle").call(dot_attributes, visualObj)

        let current_text = update.select("text");
        if (use_group_text) {
          // The text element may not exist if use_group_text was previously false
          if (!(current_text.node())) {
            current_text = update.append("text");
          }
          current_text.call(text_attributes, visualObj)
        } else {
          current_text.remove();
        }

        return update
      },
    )

  selection.on('click', () => {
    visualObj.selectionManager.clear();
    selection.call(updateHighlighting, visualObj);
  });
}

function dot_tooltips(selection: dataPointSelection, visualObj: Visual) {
  selection
    .on("click", (event, d: plotData) => {
      // Pass identities of selected data back to PowerBI
      visualObj
          .selectionManager
          .select(d.identity, (event.ctrlKey || event.metaKey))
          // Change opacity of non-selected dots
          .then(() => { select("svg").call(updateHighlighting, visualObj); });
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
}

// TODO(Andrew): Construct these attributes in the viewModel
//   - Tricky as the plotProperties get updated when rendering X & Y axes
//      to add padding when rendering out of frame
function dot_attributes(selection: aestheticSelection, visualObj: Visual): void {
  const scatter_settings = visualObj.viewModel.inputSettings.settings.scatter;
  const display_text: boolean = scatter_settings.use_group_text;

  // If group text is displayed, then the dots are set to white backgrounds for
  // the labels - avoids readability issues when intersecting with lines
  selection
    .attr("cy", (d: plotData) => visualObj.viewModel.plotProperties.yScale(d.value))
    .attr("cx", (d: plotData) => visualObj.viewModel.plotProperties.xScale(d.x))
    .attr("r", (d: plotData) => display_text ? scatter_settings.scatter_text_size * 0.6 : d.aesthetics.size)
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

function text_attributes(selection: aestheticSelection, visualObj: Visual): void {
  selection
    .attr("y", (d: plotData) => visualObj.viewModel.plotProperties.yScale(d.value))
    .attr("x", (d: plotData) => visualObj.viewModel.plotProperties.xScale(d.x))
    .attr("dy", "0.35em")
    .text((d: plotData) => d.group_text)
    .style("text-anchor", "middle")
    .style("font-size", (d: plotData) => `${d.aesthetics.scatter_text_size}px`)
    .style("font-family", (d: plotData) => d.aesthetics.scatter_text_font)
    .style("fill", (d: plotData) => d.aesthetics.scatter_text_colour)
}
