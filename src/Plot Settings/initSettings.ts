function initSettings() {
    return {
        axispad: {
            x: {
                padding: {
                    default: 50,
                    value: 50
                }
            },
            y: {
                padding: {
                    default: 50,
                    value: 50
                }
            }
        },
        funnel: {
            data_type: {
                default: "PR",
                value: "PR"
            },
            od_adjust: {
                default: "no",
                value: "no"
            },
            multiplier: {
                default: 1,
                value: 1
            },
            transformation: {
                default: "none",
                value: "none"
            },
            alt_target: {
                default: null,
                value: null
            }
        },
        scatter: {
            size: {
                default: 4,
                value: 4
            },
            colour: {
                default: "#000000",
                value: "#000000"
            },
            opacity: {
                default: 1,
                value: 1
            },
            opacity_unselected: {
                default: 0.2,
                value: 0.2
            }
        },
        lines: {
            width_99: {
                default: 3,
                value: 3
            },
            width_95: {
                default: 3,
                value: 3
            },
            width_target: {
                default: 1.5,
                value: 1.5
            },
            width_alt_target: {
                default: 1.5,
                value: 1.5
            },
            colour_99: {
                default: "#4682B4",
                value: "#4682B4"
            },
            colour_95: {
                default: "#4682B4",
                value: "#4682B4"
            },
            colour_target: {
                default: "#4682B4",
                value: "#4682B4"
            },
            colour_alt_target: {
                default: "#4682B4",
                value: "#4682B4"
            }
        },
        axis: {
            ylimit_l: {
                default: null,
                value: null
            },
            ylimit_u: {
                default: null,
                value: null
            },
            xlimit_l: {
                default: null,
                value: null
            },
            xlimit_u: {
                default: null,
                value: null
            }
        }
    }
}

export default initSettings;