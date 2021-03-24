// Function to get user-specified settings from properties pane and update
//   internal objects
function updateSettings(settings, options, dataViewObjects) {
    settings.axis.x.show.value = dataViewObjects.getValue(
        options.dataViews[0].metadata.objects, {
            objectName: "xAxis",
            propertyName: "show"
        },
        settings.axis.x.show.default
    )
    settings.axis.y.show.value = dataViewObjects.getValue(
        options.dataViews[0].metadata.objects, {
            objectName: "yAxis",
            propertyName: "show"
        },
        settings.axis.y.show.default
    )
    settings.funnel.data_type.value = dataViewObjects.getValue(
        options.dataViews[0].metadata.objects, {
            objectName: "funnel",
            propertyName: "data_type"
        },
        settings.funnel.data_type.default
    )
    settings.funnel.od_adjust.value = dataViewObjects.getValue(
        options.dataViews[0].metadata.objects, {
            objectName: "funnel",
            propertyName: "od_adjust"
        },
        settings.funnel.od_adjust.default
    )
}

export default updateSettings;