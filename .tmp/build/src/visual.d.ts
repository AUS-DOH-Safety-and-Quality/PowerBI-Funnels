import "core-js/stable";
import "../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
export declare class Visual implements IVisual {
    private host;
    private svg;
    private dotGroup;
    private viewModel;
    private xPadding;
    private selectionManager;
    private xAxisGroup;
    private yAxisGroup;
    private settings;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private updateSettings;
    private getViewModel;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration;
}
