import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { createRenderer, type Rendered as BaseRendered } from "powerbi-visuals-core/testing";
import { Visual } from "../../src/visual";
import viewModelClass from "../../src/Classes/viewModelClass";
import buildDataView, { type Inputs, type SettingsOverrides } from "./buildDataView";

export type { Inputs } from "./buildDataView";
export type Rendered = BaseRendered<Visual, SettingsOverrides | SettingsOverrides[], Inputs>;

export const renderVisual = createRenderer<Visual, SettingsOverrides | SettingsOverrides[], Inputs>(Visual, buildDataView);

/** The view model alone, failing the test on invalid input */
export function calculate(settings: SettingsOverrides | SettingsOverrides[], inputs: Inputs): viewModelClass {
  const host = createVisualHost({});
  const model = new viewModelClass(host);
  const status = model.update({ dataViews: [buildDataView(inputs, settings)], viewport: { width: 500, height: 500 }, type: 2 }, host);
  if (!status.status) {
    throw new Error(status.error);
  }
  return model;
}
