import * as d3 from "./D3 Modules";
import type powerbi from "powerbi-visuals-api";
import type { plotData } from "../Classes";
import type { svgBaseType, Visual } from "../visual";
import { bindContextMenu } from "powerbi-visuals-core/rendering";

type ISelectionId = powerbi.visuals.ISelectionId;

export default function addContextMenu(selection: svgBaseType, visualObj: Visual) {
  const root = selection.node();
  if (root === null) return;
  bindContextMenu(root, {
    enabled: visualObj.plotProperties.displayPlot,
    // Background clicks keep the existing empty identity
    identity: target => (d3.select(target as d3.BaseType).datum() as plotData | undefined)?.identity ?? ({} as ISelectionId),
    show: (identity, position) => visualObj.selectionManager.showContextMenu(identity, position)
  });
}
