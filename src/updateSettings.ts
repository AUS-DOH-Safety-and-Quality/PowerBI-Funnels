import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

/**
 * Function for updating an internal object of plot settings with
 *   user-specified settings
 * 
 * @param settings        - Existing settings object to update
 * @param objects         - List of settings objects to get values from
 */
function updateSettings(settings, objects) {
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
    settings.scatter.size.value = dataViewObjects.getValue(
        objects, {
            objectName: "scatter",
            propertyName: "size"
        },
        settings.scatter.size.default
    )
    settings.scatter.colour.value = dataViewObjects.getValue(
        objects, {
            objectName: "scatter",
            propertyName: "colour"
        },
        settings.scatter.colour.default
    )
}

export default updateSettings;