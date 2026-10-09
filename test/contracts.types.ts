import type powerbi from "powerbi-visuals-api";
import type viewModelClass from "../src/Classes/viewModelClass";
import type { settingsValueType } from "../src/settings";
import type { limitArgs, limitData } from "../src/Classes";
import type settingsClass from "../src/Classes/settingsClass";
import validateInputData from "../src/Functions/validateInputData";
import extractInputData from "../src/Functions/extractInputData";
import buildDataView from "./helpers/buildDataView";
import { categoricalData, validated } from "./dataViewFixture";

declare const viewModel: viewModelClass;
declare const host: powerbi.extensibility.visual.IVisualHost;
declare const settings: settingsClass;
declare const args: limitArgs;

// Fixture cells may be blank, but never objects
categoricalData([1, null, undefined]);
buildDataView({ key: ["A", null], numerators: [1, undefined] });
// @ts-expect-error Cells are Power BI primitives.
categoricalData([{}]);

// Validation takes the funnel's chart type, not any string
validateInputData(["A"], [1], [2], "PR");
// @ts-expect-error Unknown chart types never reach validation.
validateInputData(["A"], [1], [2], "XY");

// Test flags ride on the host's update options without a cast
viewModel.update({ dataViews: [], viewport: { width: 1, height: 1 }, type: 2, headless: true }, host);

// @ts-expect-error The chart type is a closed union.
const chart: settingsValueType["funnel"]["chart_type"] = "XY";

// Extraction only accepts a view Core has validated for both required roles
extractInputData(validated(), settings);
// @ts-expect-error Raw categorical data must pass validateDataView first.
extractInputData(categoricalData(), settings);

/** Each plotted point carries the limits at its denominator; every limit call has a standard error */
const limits: limitData = viewModel.plotPoints[0].limits;
const se: number = args.SE;
const labels: (string | undefined)[] = viewModel.plotPoints.length > 0 && viewModel.inputData !== undefined ? viewModel.inputData.labels : [];
void [chart, limits, se, labels];
