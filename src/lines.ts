import * as d3 from "d3";

function makeLines(LineObject, x_scale, y_scale, linetype, ThisBase, x_scale_inv?, y_scale_inv?) {
    if (linetype != "target") {
        LineObject.attr("d", d3.line<typeof ThisBase.viewModel.LimitLines>().x(d => x_scale(d.denominator)).y(d => y_scale(d.limit)))
            .attr("fill","none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3);
        if (linetype == "95%") {
            LineObject.style("stroke-dasharray",("3,3"))
        } else if(linetype == "99.8%") {
            LineObject.style("stroke-dasharray",("6,3"))
        }
        LineObject.on("mouseover", d => {
                        // Get screen coordinates of mouse pointer, tooltip will
                        //   be displayed at these coordinates
                        //    Needs the '<any>' prefix, otherwise PowerBI doesn't defer
                        //      to d3 properly
                        let x = (<any>d3).event.pageX;
                        let y = (<any>d3).event.pageY;
                
                        ThisBase.host.tooltipService.show({
                            dataItems: [{
                                displayName: "Type",
                                value: linetype
                            }, {
                                displayName: "Ratio",
                                value: (y_scale_inv(y)).toFixed(2)
                            }, {
                                displayName: "Denominator",
                                value: (x_scale_inv(x)).toFixed(2)
                            }],
                            identities: [0],
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
                            dataItems: [{
                                displayName: "Type",
                                value: linetype
                            }, {
                                displayName: "Ratio",
                                value: (y_scale_inv(y)).toFixed(2)
                            }, {
                                displayName: "Denominator",
                                value: (x_scale_inv(x)).toFixed(2)
                            }],
                            identities: [0],
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
    } else if (linetype == "target") {
        LineObject.attr("d", d3.line<typeof ThisBase.viewModel.LimitLines>().x(d => x_scale(d.denominator)).y(d => y_scale(ThisBase.viewModel.target)))
            // Apply CSS class to elements so that they can be looked up later
            .attr("fill","none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5);
    }

    LineObject.exit()
            .remove();
}

export default makeLines;