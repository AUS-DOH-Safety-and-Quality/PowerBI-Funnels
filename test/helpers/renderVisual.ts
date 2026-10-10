import type powerbi from "powerbi-visuals-api";
import { onTestFinished } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../../src/visual";
import viewModelClass from "../../src/Classes/viewModelClass";
import buildDataView, { type SettingsOverrides } from "./buildDataView";

export type Inputs = Parameters<typeof buildDataView>[0];

export type RenderOptions = {
  host?: powerbi.extensibility.visual.IVisualHost;
  /** Adjusts each data view before the update, e.g. highlights */
  prepare?: (dataView: powerbi.DataView) => void;
};

export type Rendered = {
  element: HTMLElement;
  visual: Visual;
  update: (settings: SettingsOverrides | SettingsOverrides[], inputs?: Inputs) => void;
};

/** A 500px visual, removed when the test finishes; later updates reuse the data unless given new data */
export function renderVisual(settings: SettingsOverrides | SettingsOverrides[], inputs: Inputs,
                             options: RenderOptions = {}): Rendered {
  const element = testDom("500", "500");
  onTestFinished(() => element.remove());
  const visual = new Visual({ element, host: options.host ?? createVisualHost({}) });
  let current = inputs;
  const update = (next: SettingsOverrides | SettingsOverrides[], nextInputs = current): void => {
    current = nextInputs;
    const dataView = buildDataView(nextInputs, next);
    options.prepare?.(dataView);
    visual.update({ dataViews: [dataView], viewport: { width: 500, height: 500 }, type: 2 });
  };
  update(settings);
  return { element, visual, update };
}

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

export function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error("Missing element");
  }
  return value;
}
