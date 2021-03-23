import * as d3 from "d3";

function makeDots(DotObject,ThisBase,x_scale,y_scale) {
    DotObject.attr("cy", d => y_scale(d.ratio))
    .attr("cx", d => x_scale(d.denominator))
    .attr("r", 3)
    // Fill each dot with the colour in each DataPoint
    .style("fill", d => d.colour)
    // Change opacity (highlighting) with selections in other plots
    .style("fill-opacity", d => ThisBase.viewModel.highlights ? (d.highlighted ? 1.0 : 0.2) : 1.0)
    // Specify actions to take when clicking on dots
    .on("click", d => {
        // Pass identities of selected data back to PowerBI
        ThisBase.selectionManager
            // Propagate identities of selected data based to PowerBI based on all selected dots
            .select(d.identity, true)
            // Change opacity of non-selected dots
            .then(ids => {
                DotObject.style(
                    "fill-opacity",d => 
                    ids.length > 0 ? 
                    (ids.indexOf(d.identity) >= 0 ? 1.0 : 0.2) 
                    : 1.0
                );
            })
    })
    // Display tooltip content on mouseover
    .on("mouseover", d => {
        // Get screen coordinates of mouse pointer, tooltip will
        //   be displayed at these coordinates
        //    Needs the '<any>' prefix, otherwise PowerBI doesn't defer
        //      to d3 properly
        let x = (<any>d3).event.pageX;
        let y = (<any>d3).event.pageY;

        ThisBase.host.tooltipService.show({
            dataItems: d.tooltips,
            identities: [d.identity],
            coordinates: [x, y],
            isTouchEvent: false
        });
    })
    // Specify that tooltips should move with the mouse
    .on("mousemove", d => {
        // Get screen coordinates of mouse pointer, tooltip will
        //   be displayed at these coordinates
        //    Needs the '<any>' prefix, otherwise PowerBI doesn't defer
        //      to d3 properly
        let x = (<any>d3).event.pageX;
        let y = (<any>d3).event.pageY;

        // Use the 'move' service for more responsive display
        ThisBase.host.tooltipService.move({
            dataItems: d.tooltips,
            identities: [d.identity],
            coordinates: [x, y],
            isTouchEvent: false
        });
    })
    // Hide tooltip when mouse moves out of dot
    .on("mouseout", d => {
        ThisBase.host.tooltipService.hide({
            immediately: true,
            isTouchEvent: false
        })
    });
}

export default makeDots;