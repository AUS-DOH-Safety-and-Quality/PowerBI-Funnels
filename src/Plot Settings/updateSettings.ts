import powerbi from "powerbi-visuals-api";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

/**
 * Function for updating an internal object of plot settings with
 *   user-specified settings
 * 
 * @param settings        - Existing settings object to update
 * @param objects         - List of settings objects to get values from
 */
function updateSettings(settings: any, objects: powerbi.DataViewObjects) {
    settings.funnel.data_type.value = dataViewObjects.getValue(
        objects, {
            objectName: "funnel",
            propertyName: "data_type"
        },
        settings.funnel.data_type.default
    )
    settings.funnel.od_adjust.value = dataViewObjects.getValue(
        objects, {
            objectName: "funnel",
            propertyName: "od_adjust"
        },
        settings.funnel.od_adjust.default
    )
    settings.funnel.multiplier.value = dataViewObjects.getValue(
        objects, {
            objectName: "funnel",
            propertyName: "multiplier"
        },
        settings.funnel.multiplier.default
    )
    settings.funnel.transformation.value = dataViewObjects.getValue(
        objects, {
            objectName: "funnel",
            propertyName: "transformation"
        },
        settings.funnel.transformation.default
    )
    settings.funnel.alt_target.value = dataViewObjects.getValue(
        objects, {
            objectName: "funnel",
            propertyName: "alt_target"
        },
        settings.funnel.alt_target.default
    )
    settings.scatter.size.value = dataViewObjects.getValue(
        objects, {
            objectName: "scatter",
            propertyName: "size"
        },
        settings.scatter.size.default
    )
    settings.scatter.colour.value = dataViewObjects.getFillColor(
        objects, {
            objectName: "scatter",
            propertyName: "colour"
        },
        settings.scatter.colour.default
    )
    settings.scatter.opacity.value = dataViewObjects.getValue(
        objects, {
            objectName: "scatter",
            propertyName: "opacity"
        },
        settings.scatter.opacity.default
    )
    settings.scatter.opacity_unselected.value = dataViewObjects.getValue(
        objects, {
            objectName: "scatter",
            propertyName: "opacity_unselected"
        },
        settings.scatter.opacity_unselected.default
    )
    settings.lines.width_99.value = dataViewObjects.getValue(
        objects, {
            objectName: "lines",
            propertyName: "width_99"
        },
        settings.lines.width_99.default
    )
    settings.lines.width_95.value = dataViewObjects.getValue(
        objects, {
            objectName: "lines",
            propertyName: "width_95"
        },
        settings.lines.width_95.default
    )
    settings.lines.width_target.value = dataViewObjects.getValue(
        objects, {
            objectName: "lines",
            propertyName: "width_target"
        },
        settings.lines.width_target.default
    )
    settings.lines.width_alt_target.value = dataViewObjects.getValue(
        objects, {
            objectName: "lines",
            propertyName: "width_alt_target"
        },
        settings.lines.width_alt_target.default
    )
    settings.lines.colour_99.value = dataViewObjects.getFillColor(
        objects, {
            objectName: "lines",
            propertyName: "colour_99"
        },
        settings.lines.colour_99.default
    )
    settings.lines.colour_95.value = dataViewObjects.getFillColor(
        objects, {
            objectName: "lines",
            propertyName: "colour_95"
        },
        settings.lines.colour_95.default
    )
    settings.lines.colour_target.value = dataViewObjects.getFillColor(
        objects, {
            objectName: "lines",
            propertyName: "colour_target"
        },
        settings.lines.colour_target.default
    )
    settings.lines.colour_alt_target.value = dataViewObjects.getFillColor(
        objects, {
            objectName: "lines",
            propertyName: "colour_alt_target"
        },
        settings.lines.colour_alt_target.default
    )
    settings.axis.xlimit_label.value = dataViewObjects.getValue(
        objects, {
            objectName: "axis",
            propertyName: "xlimit_label"
        },
        settings.axis.xlimit_label.default
    )
    settings.axis.ylimit_label.value = dataViewObjects.getValue(
        objects, {
            objectName: "axis",
            propertyName: "ylimit_label"
        },
        settings.axis.ylimit_label.default
    )
    settings.axis.ylimit_l.value = dataViewObjects.getValue(
        objects, {
            objectName: "axis",
            propertyName: "ylimit_l"
        },
        settings.axis.ylimit_l.default
    )
    settings.axis.ylimit_u.value = dataViewObjects.getValue(
        objects, {
            objectName: "axis",
            propertyName: "ylimit_u"
        },
        settings.axis.ylimit_u.default
    )
    settings.axis.xlimit_l.value = dataViewObjects.getValue(
        objects, {
            objectName: "axis",
            propertyName: "xlimit_l"
        },
        settings.axis.xlimit_l.default
    )
    settings.axis.xlimit_u.value = dataViewObjects.getValue(
        objects, {
            objectName: "axis",
            propertyName: "xlimit_u"
        },
        settings.axis.xlimit_u.default
    )
}

export default updateSettings;