import checkIDSelected from "./checkIDSelected";
import * as d3 from "d3";

/**
 * Function to update opacity of dots if selected in other plots,
 *     or in the current plot
 * 
 * @param DotObject     - Base dot object to add style attributes to
 * @param selectionIds  - List of current selection ids returned for getSelectionIds
 * @returns 
 */
function highlightIfSelected(DotObject, selectionIds) {
    if (!DotObject || !selectionIds) {
        return;
    }

    if (!selectionIds.length) {
        DotObject.style("fill-opacity", 1.0);
        return;
    }

    DotObject.each(d => {
        const opacity = checkIDSelected(selectionIds, d.identity) ? 1.0 : 0.2;

        (<any>d3).select(DotObject)
                 .style("fill-opacity", opacity);
    });
}

export default highlightIfSelected;