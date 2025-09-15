import type { plotData } from "../Classes";
import { between } from "../Functions";
import type { svgBaseType, Visual } from "../visual";
import * as d3 from "./D3 Modules"

type aestheticSelection = d3.Selection<SVGGraphicsElement, plotData, d3.BaseType, any>;
type dataPointSelection = d3.Selection<SVGGraphicsElement, plotData, d3.BaseType, any>;

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

        if (use_group_text) {
          dataPoint.append("text").call(text_attributes, visualObj);
        } else {
          dataPoint.append("path").call(dot_attributes, visualObj);
        }
        dataPoint.call(dot_tooltips, visualObj)

        return dataPoint
      },
      (update) => {
        let current_text = update.select("text");
        let current_circle = update.select("path");
        if (use_group_text) {
          current_circle.remove();
          // The text element may not exist if use_group_text was previously false
          if (!(current_text.node())) {
            current_text = update.append("text");
          }
          current_text.call(text_attributes, visualObj)
        } else {
          current_text.remove();
          if (!(current_circle.node())) {
            current_circle = update.append("path");
          }
          current_circle.call(dot_attributes, visualObj)
        }

        return update
      },
    )

  selection.on('click', () => {
    visualObj.selectionManager.clear();
    visualObj.updateHighlighting();
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
          .then(() => visualObj.updateHighlighting());
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
  const ylower: number = visualObj.viewModel.plotProperties.yAxis.lower;
  const yupper: number = visualObj.viewModel.plotProperties.yAxis.upper;
  const xlower: number = visualObj.viewModel.plotProperties.xAxis.lower;
  const xupper: number = visualObj.viewModel.plotProperties.xAxis.upper;
  selection
    .attr("d", (d: plotData) => {
      const shape: string = d.aesthetics.shape;
      const size: number = d.aesthetics.size;
      return d3.symbol().type(d3[`symbol${shape}`]).size((size*size) * Math.PI)()
    })
    .attr("transform", (d: plotData) => {
      if (!between(d.value, ylower, yupper) || !between(d.x, xlower, xupper)) {
        return "translate(0, 0) scale(0, 0)";
      }
      return `translate(${visualObj.viewModel.plotProperties.xScale(d.x)}, ${visualObj.viewModel.plotProperties.yScale(d.value)})`
    })
    .style("fill", (d: plotData) => {
      return d.aesthetics.colour;
    })
    .style("stroke", (d: plotData) => {
      return d.aesthetics.colour_outline;
    })
    .style("stroke-width", (d: plotData) => d.aesthetics.width_outline);
}

function text_attributes(selection: aestheticSelection, visualObj: Visual): void {
  const ylower: number = visualObj.viewModel.plotProperties.yAxis.lower;
  const yupper: number = visualObj.viewModel.plotProperties.yAxis.upper;
  const xlower: number = visualObj.viewModel.plotProperties.xAxis.lower;
  const xupper: number = visualObj.viewModel.plotProperties.xAxis.upper;
  selection
    .attr("transform", (d: plotData) => {
      if (!between(d.value, ylower, yupper) || !between(d.x, xlower, xupper)) {
        return "translate(0, 0) scale(0, 0)";
      }
      return `translate(${visualObj.viewModel.plotProperties.xScale(d.x)}, ${visualObj.viewModel.plotProperties.yScale(d.value)})`
    })
    .attr("dy", "0.35em")
    .text((d: plotData) => d.group_text)
    .style("text-anchor", "middle")
    .style("font-size", (d: plotData) => `${d.aesthetics.scatter_text_size}px`)
    .style("font-family", (d: plotData) => d.aesthetics.scatter_text_font)
    .style("fill", (d: plotData) => d.aesthetics.scatter_text_colour)
}
