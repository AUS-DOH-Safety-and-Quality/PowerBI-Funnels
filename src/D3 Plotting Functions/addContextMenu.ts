import type powerbi from "powerbi-visuals-api";
import type { plotData } from "../Classes";
import type { svgBaseType, Visual } from "../visual";
import { bindContextMenu, select, type BaseType } from "powerbi-visuals-core/rendering";

type ISelectionId = powerbi.visuals.ISelectionId;

export default function addContextMenu(selection: svgBaseType, visualObj: Visual, enabled = visualObj.plotProperties.displayPlot) {
  const root = selection.node();
  if (root === null) {
    return;
  }
  bindContextMenu(root, {
    enabled,
    // Background clicks keep the existing empty identity
    identity: target => (select(target as BaseType).datum() as plotData | undefined)?.identity ?? ({} as ISelectionId),
    show: (identity, position) => visualObj.selectionManager.showContextMenu(identity, position)
  });
}
