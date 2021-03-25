import checkIDSelected from "./checkIDSelected";
import * as d3 from "d3";

function highlightIfSelected(DotObject, selectionIds) {
    if (!DotObject || !selectionIds) {
        return;
    }

    if (!selectionIds.length) {
        DotObject.style("fill-opacity", 1.0);
        return;
    }

    DotObject.each(d => {
        const isSelected: boolean = checkIDSelected(selectionIds, d.identity);

        const opacity: number = isSelected ? 1.0 : 0.2;

        (<any>d3).select(DotObject)
                 .style("fill-opacity", opacity);
    });
}

export default highlightIfSelected;