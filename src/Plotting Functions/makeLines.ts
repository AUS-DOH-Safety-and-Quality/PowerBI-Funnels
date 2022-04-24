import * as d3 from "d3";
import viewModelObject from "../Classes/viewModel";
import { lineData } from "../Classes/Interfaces"

/**
 * Function for plotting the control limit and target lines, as well
 *   as managing the creation & updating of tooltips.
 *
 * @param MergedLineObject       - Base object to render line to
 * @param x_scale          - d3 scale function for translating axis coordinates to screen coordinates
 * @param y_scale          - d3 scale function for translating axis coordinates to screen coordinates
 * @param linetype         - Whether a control limit (either 95% or 99.8%) or a target line is requested
 * @param viewModel        - Reference to object containing the user-provided data
 * @param tooltipService   - Object managing the display and updating of tooltips
 * Optional:
 * @param x_scale_inv      - d3 scale function for translating screen coordinates to axis coordinates
 * @param y_scale_inv      - d3 scale function for translating screen coordinates to axis coordinates
 */
function makeLines(LineObject: any,
                   settings: any,
                   x_scale: d3.ScaleLinear<number, number, never>,
                   y_scale: d3.ScaleLinear<number, number, never>,
                   viewModel: viewModelObject,
                   highlights: boolean): void {
  let l99_width: number = settings.lines.width_99.value;
  let l95_width: number = settings.lines.width_95.value;
  let target_width: number = settings.lines.width_target.value;
  let alt_target_width: number = settings.lines.width_alt_target.value;
  let l99_colour: string = settings.lines.colour_99.value;
  let l95_colour: string = settings.lines.colour_95.value;
  let target_colour: string = settings.lines.colour_target.value;
  let alt_target_colour: string = settings.lines.colour_alt_target.value;

  let GroupedLines = viewModel.groupedLines;
  let group_keys: string[] = GroupedLines.map(d => d.key)

  let line_color = d3.scaleOrdinal()
                     .domain(group_keys)
                     .range([l99_colour, l95_colour, l95_colour, l99_colour, target_colour, alt_target_colour]);

  let line_width = d3.scaleOrdinal()
                     .domain(group_keys)
                     .range([l99_width, l95_width, l95_width, l99_width, target_width, alt_target_width]);

  let lineMerged = LineObject.enter()
                             .append("path")
                             .merge(<any>LineObject);
  lineMerged.classed('line', true);
  lineMerged.attr("d", d => {
    return d3.line<lineData>()
             .x(d => x_scale(d.x))
             .y(d => y_scale(d.line_value))
             .defined(function(d) { return d.line_value !== null; })
             (d.values)
  })
  lineMerged.attr("fill", "none")
            .attr("stroke", d => <string>line_color(d.key))
            .attr("stroke-width", d => <number>line_width(d.key));
  lineMerged.exit().remove()
}

export default makeLines;
