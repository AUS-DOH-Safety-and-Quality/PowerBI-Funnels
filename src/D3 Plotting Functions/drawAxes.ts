import type { svgBaseType, Visual } from "../visual";
import { drawAxis } from "powerbi-visuals-core/rendering";

export default function drawAxes(selection: svgBaseType, visualObj: Visual) {
  const svg = selection.node();
  if (svg === null) {
    return;
  }
  const viewModel = visualObj.viewModel;
  const settings = viewModel.inputSettings.settings;
  const frame = visualObj.plotProperties;
  const measure = !viewModel.frontend;
  drawAxis(svg, {
    axis: "x", frame, show: settings.x_axis.xlimit_show, labelSize: settings.x_axis.xlimit_label_size, measure,
    tickFormat: undefined
  });
  const sigFigs = settings.y_axis.ylimit_sig_figs ?? settings.funnel.sig_figs;
  const derivedSettings = viewModel.inputSettings.derivedSettings;
  drawAxis(svg, {
    axis: "y", frame, show: settings.y_axis.ylimit_show, labelSize: settings.y_axis.ylimit_label_size, measure,
    tickFormat: viewModel.inputData
      ? value => derivedSettings.percentLabels ? `${value.toFixed(sigFigs)}%` : value.toFixed(sigFigs)
      : undefined
  });
}
