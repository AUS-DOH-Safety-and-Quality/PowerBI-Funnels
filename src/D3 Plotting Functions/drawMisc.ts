import { clamp, normalQuantile, scaleLinear } from "powerbi-visuals-core/math";
import { axisLabelPlacement } from "powerbi-visuals-core/rendering";
import type { svgBaseType, Visual } from "../visual";
import type { miscPoint } from "../Classes/viewModelClass";

export default function drawMisc(svg: svgBaseType, visual: Visual): void {
  svg.selectChildren().remove();
  const model = visual.viewModel;
  const settings = model.inputSettings.settings[0];
  const canvas = settings.canvas;
  const misc = settings.misc;
  const xAxis = settings.x_axis;
  const yAxis = settings.y_axis;
  const lines = settings.lines;
  const palette = model.colourPalette;
  const colour = (value: string): string => palette.isHighContrast ? palette.foregroundColour : value;
  svg.style("background", () => palette.isHighContrast ? palette.backgroundColour : null);
  const root = svg.append("g").classed("misc-root", true);
  const top = canvas.upper_padding + 55;
  const bottom = Math.max(top, model.svgHeight - canvas.lower_padding - 35);
  const rowHeight = (bottom - top) / model.miscPoints.length;
  const labels = root.selectAll<SVGTextElement, miscPoint>(".misc-y-tick").data(model.miscPoints).join("text")
    .classed("misc-y-tick", true).attr("text-anchor", "end").attr("dominant-baseline", "middle")
    .attr("y", (_, i) => top + (i + 0.5) * rowHeight)
    .style("font-family", yAxis.ylimit_tick_font).style("font-size", `${yAxis.ylimit_tick_size}px`)
    .attr("fill", colour(yAxis.ylimit_tick_colour)).text(point => point.indicator);
  let labelWidth = 0;
  if (!model.headless) {
    const nodes = labels.nodes();
    for (let i = 0; i < nodes.length; i++) {
      labelWidth = Math.max(labelWidth, nodes[i].getBBox().width);
    }
  }
  const left = canvas.left_padding + labelWidth + 10;
  const right = Math.max(left, model.svgWidth - canvas.right_padding);
  labels.attr("x", left - 8);
  const scale = scaleLinear().domain([misc.lower, misc.upper]).range([left, right]);
  const zero = scale(0);
  const limits = [
    { value: normalQuantile(0.001, 0, 1, true, false), level: "99" }, { value: normalQuantile(0.999, 0, 1, true, false), level: "99" },
    { value: normalQuantile(0.025, 0, 1, true, false), level: "95" }, { value: normalQuantile(0.975, 0, 1, true, false), level: "95" },
    { value: 0, level: "target" }
  ] as const;
  const drawn = { "99": false, "95": false, target: false };
  for (let i = 0; i < limits.length; i++) {
    const value = limits[i].value;
    const level = limits[i].level;
    if (!lines[`show_${level}`] || value < misc.lower || value > misc.upper) {
      continue;
    }
    drawn[level] = true;
    root.append("line").attr("class", level === "target" ? "misc-zero-line" : `misc-limit-${level}`)
      .attr("x1", scale(value)).attr("x2", scale(value)).attr("y1", top).attr("y2", bottom)
      .attr("stroke", colour(lines[`colour_${level}`])).attr("stroke-width", lines[`width_${level}`])
      .attr("stroke-dasharray", lines[`type_${level}`]).attr("opacity", lines[`opacity_${level}`]);
  }
  root.append("line").classed("misc-axis", true).attr("x1", left).attr("x2", right)
    .attr("y1", bottom).attr("y2", bottom).attr("stroke", colour(xAxis.xlimit_colour));
  if (xAxis.xlimit_ticks) {
    const ticks = scale.ticks(xAxis.xlimit_tick_count);
    for (let i = 0; i < ticks.length; i++) {
      const tick = ticks[i];
      root.append("text").classed("misc-x-tick", true).attr("x", scale(tick)).attr("y", bottom + xAxis.xlimit_tick_size + 5)
        .attr("text-anchor", "middle").style("font-family", xAxis.xlimit_tick_font)
        .style("font-size", `${xAxis.xlimit_tick_size}px`).attr("fill", colour(xAxis.xlimit_tick_colour))
        .text(Number(tick.toFixed(2)));
    }
  }
  const title = axisLabelPlacement(xAxis.xlimit_label_align, left, right);
  root.append("text").attr("x", title.position).attr("y", model.svgHeight - canvas.lower_padding)
    .attr("text-anchor", title.anchor).style("font-family", xAxis.xlimit_label_font)
    .style("font-size", `${xAxis.xlimit_label_size}px`).style("font-style", xAxis.xlimit_label_style)
    .attr("fill", colour(xAxis.xlimit_label_colour)).text(xAxis.xlimit_label);
  const directions = [
    { text: misc.unfavourable_label, x: (left + zero) / 2, colour: settings.outliers.three_sigma_colour_deterioration },
    { text: misc.favourable_label, x: (zero + right) / 2, colour: settings.outliers.three_sigma_colour_improvement }
  ];
  for (let i = 0; i < directions.length; i++) {
    const direction = directions[i];
    root.append("text").classed("misc-direction", true).attr("x", direction.x).attr("y", top - 10)
      .attr("text-anchor", "middle").style("font-family", xAxis.xlimit_tick_font).style("font-size", "12px")
      .style("font-weight", "bold").attr("fill", colour(direction.colour)).text(direction.text);
  }
  const legends = [{ level: "95", text: "95% Control Limits" }, { level: "99", text: "99% Control Limits" }] as const;
  for (let i = 0; i < legends.length; i++) {
    const level = legends[i].level;
    const text = legends[i].text;
    if (!drawn[level]) {
      continue;
    }
    const x = left + (right - left) * i / 2;
    root.append("line").attr("x1", x).attr("x2", x + 20).attr("y1", top - 35).attr("y2", top - 35)
      .attr("stroke", colour(lines[`colour_${level}`])).attr("stroke-width", lines[`width_${level}`])
      .attr("stroke-dasharray", lines[`type_${level}`]).attr("opacity", lines[`opacity_${level}`]);
    root.append("text").attr("x", x + 24).attr("y", top - 35).attr("dominant-baseline", "middle")
      .style("font-family", xAxis.xlimit_tick_font).style("font-size", "10px")
      .attr("fill", colour(xAxis.xlimit_tick_colour)).text(text);
  }
  root.selectAll<SVGRectElement, miscPoint>(".misc-bar").data(model.miscPoints).join("rect")
    .classed("misc-bar", true).attr("x", point => scale(Math.min(0, clamp(point.score, misc.lower, misc.upper))))
    .attr("y", (_, i) => top + (i + (1 - misc.bar_height) / 2) * rowHeight)
    .attr("width", point => Math.abs(scale(clamp(point.score, misc.lower, misc.upper)) - zero))
    .attr("height", rowHeight * misc.bar_height).attr("fill", point => colour(point.aesthetics.colour))
    .on("click", (event: MouseEvent, point) => {
      if (!visual.host.hostCapabilities.allowInteractions) {
        return;
      }
      visual.selectionManager.select(point.identity, event.ctrlKey || event.metaKey).then(() => visual.updateHighlighting());
      event.stopPropagation();
    })
    .on("mouseover", (event: MouseEvent, point) => visual.host.tooltipService.show({
      dataItems: point.tooltip,
      identities: [point.identity],
      coordinates: [event.clientX, event.clientY],
      isTouchEvent: false
    }))
    .on("mouseout", () => visual.host.tooltipService.hide({ immediately: true, isTouchEvent: false }));
  // Namespaced with the plot's handlers, which are dropped whenever the view changes
  svg.on("click.plot", () => {
    if (!visual.host.hostCapabilities.allowInteractions) {
      return;
    }
    visual.selectionManager.clear().then(() => visual.updateHighlighting());
  });
  visual.addContextMenu(svg.node(), visual.host.hostCapabilities.allowInteractions === true);
}
