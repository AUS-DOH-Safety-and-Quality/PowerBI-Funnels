import type { svgBaseType, Visual } from "../visual";
import type { limitData } from "../Classes";
import { toCsv } from "powerbi-visuals-core/data";
import { drawDownloadButton } from "powerbi-visuals-core/rendering";

export default function drawDownload(selection: svgBaseType, visualObj: Visual): void {
  const svg = selection.node();
  if (svg === null) {
    return;
  }
  const viewModel = visualObj.viewModel;
  drawDownloadButton(svg, {
    visible: viewModel.inputSettings.settings.download_options.show_button,
    x: viewModel.svgWidth - 50,
    y: viewModel.svgHeight - 5,
    onClick: () => {
      const points = viewModel.plotPoints;
      const limits = viewModel.calculatedLimits;
      const rows = new Array<Record<string, unknown>>(points.length);
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        let limit: limitData | undefined;
        for (let j = 0; j < limits.length; j++) {
          if (limits[j].denominators === point.x) {
            limit = limits[j];
            break;
          }
        }
        rows[i] = {
          group: point.group_text, numerator: point.numerator, denominator: point.x, value: point.value,
          target: limit?.target, alt_target: limit?.alt_target,
          ll99: limit?.ll99, ll95: limit?.ll95, ll68: limit?.ll68, ul68: limit?.ul68, ul95: limit?.ul95, ul99: limit?.ul99,
          two_sigma: point.two_sigma, three_sigma: point.three_sigma
        };
      }
      visualObj.host.downloadService.exportVisualsContent(toCsv(rows), "chartdata.csv", "csv", "csv file");
    }
  });
}
