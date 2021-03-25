import isSelectionIdInArray from "../src/isSelectionIdInArray";
import * as d3 from "d3";

function syncSelectionState(DotObject, selectionIds) {
    if (!DotObject || !selectionIds) {
        return;
    }

    if (!selectionIds.length) {
        DotObject.style("fill-opacity", 1.0);

        return;
    }

    DotObject.each(d => {
        const isSelected: boolean = isSelectionIdInArray(selectionIds, d.identity);

        const opacity: number = isSelected ? 1.0 : 0.2;

        (<any>d3).select(DotObject)
                 .style("fill-opacity", opacity);
    });
}

export default syncSelectionState;