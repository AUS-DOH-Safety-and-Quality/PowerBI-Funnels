import { Visual } from "../../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api"
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions
var powerbiKey: any = "powerbi";
var powerbi: any = window[powerbiKey];

var testVizF30829F441604A19810D9552E06150AC: IVisualPlugin = {
    name: 'testVizF30829F441604A19810D9552E06150AC',
    displayName: 'TestViz',
    class: 'Visual',
    apiVersion: '2.6.0',
    create: (options: VisualConstructorOptions) => {
        if (Visual) {
            return new Visual(options);
        }

        throw 'Visual instance not found';
    },
    custom: true
};

if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["testVizF30829F441604A19810D9552E06150AC"] = testVizF30829F441604A19810D9552E06150AC;
}

export default testVizF30829F441604A19810D9552E06150AC;