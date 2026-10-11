import { describe, expect, it, vi } from "vitest";
import type powerbi from "powerbi-visuals-api";
import { keyedHost, findBy, must } from "powerbi-visuals-core/testing";
import type { settingsValueType } from "../src/settings";
import type { SettingsOverrides } from "./helpers/buildDataView";
import { calculate, renderVisual, type Inputs } from "./helpers/renderVisual";

type Lines = settingsValueType["lines"];
type Tooltip = powerbi.extensibility.VisualTooltipDataItem[];

// A is above the 99% limit, B between the upper 95% and 99% limits and F below the lower 99% limit
const inputs = {
  key: ["A", "B", "C", "D", "E", "F"],
  numerators: [50, 37, 20, 25, 22, 6],
  denominators: [100, 100, 100, 120, 80, 100]
};
const limitNames = ["Upper 99% Limit", "Upper 95% Limit", "Centerline", "Lower 95% Limit", "Lower 99% Limit"];

function tooltip(overrides: SettingsOverrides, index = 0, data: Inputs = inputs): Tooltip {
  return calculate(overrides, data).plotPoints[index].tooltip;
}

function names(items: Tooltip): (string | undefined)[] {
  const result = new Array<string | undefined>(items.length);
  for (let i = 0; i < items.length; i++) {
    result[i] = items[i].displayName;
  }
  return result;
}

function entry(items: Tooltip, name: string): string | undefined {
  return findBy(items, "displayName", name)?.value;
}

function lineOverrides(key: string, values: Readonly<Record<string, string | boolean>>): Partial<Lines> {
  const result: Partial<Lines> = {};
  const settings = Object.keys(values);
  for (let i = 0; i < settings.length; i++) {
    Object.assign(result, { [settings[i].replace("<key>", key)]: values[settings[i]] });
  }
  return result;
}

describe("tooltip contents", () => {
  it.each([
    { chart_type: "PR", label: "Proportion", value: "50.00%", target: "26.67%", suffix: "%", counts: ["50", "100"] },
    { chart_type: "SR", label: "Standardised Ratio", value: "0.50", target: "1.00", suffix: "", counts: ["50.00", "100.00"] },
    { chart_type: "RC", label: "Rate", value: "0.50", target: "0.27", suffix: "", counts: ["50", "100"] }
  ] as const)("lists the group, $label, counts, limits and target in order for a $chart_type chart",
    ({ chart_type, label, value, target, suffix, counts }) => {
      const point = calculate({ funnel: { chart_type } }, inputs).plotPoints[0];
      const items = point.tooltip;
      expect(names(items)).toEqual(["Group", label, "Numerator", "Denominator", ...limitNames]);
      expect(items[0].value).toBe("A");
      expect(items[1].value).toBe(value);
      expect(items[2].value).toBe(counts[0]);
      expect(items[3].value).toBe(counts[1]);
      expect(entry(items, "Centerline")).toBe(target);
      const limits = point.limits;
      expect(entry(items, "Upper 99% Limit")).toBe(`${must(limits.ul99).toFixed(2)}${suffix}`);
      expect(entry(items, "Upper 95% Limit")).toBe(`${must(limits.ul95).toFixed(2)}${suffix}`);
      expect(entry(items, "Lower 95% Limit")).toBe(`${must(limits.ll95).toFixed(2)}${suffix}`);
      expect(entry(items, "Lower 99% Limit")).toBe(`${must(limits.ll99).toFixed(2)}${suffix}`);
    });

  it("reports each point's own group, counts and limits at its denominator", () => {
    const points = calculate({}, inputs).plotPoints;
    const items = points[3].tooltip;
    expect(items[0].value).toBe("D");
    expect(items[1].value).toBe(`${(25 / 120 * 100).toFixed(2)}%`);
    expect(items[2].value).toBe("25");
    expect(items[3].value).toBe("120");
    expect(points[3].limits.denominators).toBe(120);
    expect(entry(items, "Upper 99% Limit")).toBe(`${must(points[3].limits.ul99).toFixed(2)}%`);
    expect(entry(items, "Upper 99% Limit")).not.toBe(entry(points[0].tooltip, "Upper 99% Limit"));
  });

  it("renames the group, value and count entries", () => {
    const items = tooltip({
      funnel: { ttip_label_group: "Trust", ttip_label_value: "Mortality", ttip_label_numerator: "Deaths", ttip_label_denominator: "Admissions" },
      lines: { show_95: false, show_99: false }
    });
    expect(names(items)).toEqual(["Trust", "Mortality", "Deaths", "Admissions", "Centerline"]);
    expect(items[0].value).toBe("A");
    expect(items[1].value).toBe("50.00%");
    expect(items[2].value).toBe("50");
    expect(items[3].value).toBe("100");
  });

  it.each([
    { funnel: { ttip_show_group: false }, name: "Group" },
    { funnel: { ttip_show_value: false }, name: "Proportion" },
    { funnel: { ttip_show_numerator: false }, name: "Numerator" },
    { funnel: { ttip_show_denominator: false }, name: "Denominator" }
  ] as const)("hides the $name entry alone", ({ funnel, name }) => {
    const shown = names(tooltip({}));
    const hidden = names(tooltip({ funnel }));
    expect(hidden).not.toContain(name);
    const expected: (string | undefined)[] = [];
    for (let i = 0; i < shown.length; i++) {
      if (shown[i] !== name) {
        expected.push(shown[i]);
      }
    }
    expect(hidden).toEqual(expected);
  });

  it("formats values and limits with the reported decimals and percentage setting", () => {
    const cases = [
      { settings: { funnel: { sig_figs: 0 } }, value: "50%", pattern: /^\d+%$/ },
      { settings: { funnel: { sig_figs: 3 } }, value: "50.000%", pattern: /^\d+\.\d{3}%$/ },
      { settings: { funnel: { perc_labels: "No" } }, value: "0.50", pattern: /^\d+\.\d{2}$/ },
      { settings: { funnel: { multiplier: 1000 } }, value: "500.00", pattern: /^\d+\.\d{2}$/ },
      { settings: { funnel: { chart_type: "RC", perc_labels: "Yes" } }, value: "50.00%", pattern: /^\d+\.\d{2}%$/ },
      { settings: { funnel: { chart_type: "RC", multiplier: 1000, sig_figs: 1 } }, value: "500.0", pattern: /^\d+\.\d$/ },
      { settings: { funnel: { chart_type: "SR", perc_labels: "Yes" } }, value: "50.00%", pattern: /^\d+\.\d{2}%$/ }
    ] as const;
    for (let i = 0; i < cases.length; i++) {
      const settings = cases[i].settings;
      const items = tooltip(settings);
      expect(items[1].value, JSON.stringify(settings)).toBe(cases[i].value);
      // Counts are never scaled or suffixed; expected counts keep the reported decimals
      const sr = "chart_type" in settings.funnel && settings.funnel.chart_type === "SR";
      expect(items[2].value).toBe(sr ? "50.00" : "50");
      expect(items[3].value).toBe(sr ? "100.00" : "100");
      for (let j = 0; j < limitNames.length; j++) {
        expect(entry(items, limitNames[j]), limitNames[j]).toMatch(cases[i].pattern);
      }
    }
  });
});

describe("count tooltips", () => {
  it("shows expected counts with the reported decimals rather than rounding them", () => {
    const expected = { key: ["A", "B", "C"], numerators: [3, 7, 12], denominators: [2.346, 8.5, 10.25] };
    const items = tooltip({ funnel: { chart_type: "SR", sig_figs: 3 } }, 0, expected);
    expect(entry(items, "Numerator")).toBe("3.000");
    expect(entry(items, "Denominator")).toBe("2.346");
  });
});

describe("line tooltip settings", () => {
  const lineGroups: { key: string; enable: Partial<Lines>; upper: string; lower?: string }[] = [
    { key: "target", enable: {}, upper: "Centerline" },
    { key: "alt_target", enable: { show_alt_target: true, alt_target: 30 }, upper: "Alt. Target" },
    { key: "68", enable: { show_68: true }, upper: "Upper 68% Limit", lower: "Lower 68% Limit" },
    { key: "95", enable: {}, upper: "Upper 95% Limit", lower: "Lower 95% Limit" },
    { key: "99", enable: {}, upper: "Upper 99% Limit", lower: "Lower 99% Limit" }
  ];

  it.each(lineGroups)("shows, renames and hides the $key entries", ({ key, enable, upper, lower }) => {
    const shown = names(tooltip({ lines: enable }));
    expect(shown).toContain(upper);
    if (lower !== undefined) {
      expect(shown).toContain(lower);
    }

    const renamed = names(tooltip({ lines: { ...enable, ...lineOverrides(key, { "ttip_label_<key>": "Bound" }) } }));
    if (lower === undefined) {
      expect(renamed).toContain("Bound");
    } else {
      expect(renamed).toContain("Upper Bound");
      expect(renamed).toContain("Lower Bound");
      const prefixed = names(tooltip({ lines: { ...enable, ...lineOverrides(key, {
        "ttip_label_<key>_prefix_upper": "Max ", "ttip_label_<key>_prefix_lower": "Min "
      }) } }));
      expect(prefixed).toContain(upper.replace("Upper ", "Max "));
      expect(prefixed).toContain(lower.replace("Lower ", "Min "));
      expect(prefixed).not.toContain(upper);
    }
    expect(renamed).not.toContain(upper);
    expect(renamed).toHaveLength(shown.length);

    const untipped = names(tooltip({ lines: { ...enable, ...lineOverrides(key, { "ttip_show_<key>": false }) } }));
    const unshown = names(tooltip({ lines: { ...enable, ...lineOverrides(key, { "show_<key>": false }) } }));
    expect(untipped).not.toContain(upper);
    expect(unshown).not.toContain(upper);
    expect(untipped.length).toBe(shown.length - (lower === undefined ? 1 : 2));
    expect(unshown).toEqual(untipped);
  });

  it("orders upper limits outwards-in, then the targets, then lower limits inwards-out", () => {
    const point = calculate({ funnel: { perc_labels: "No" }, lines: { show_68: true, show_alt_target: true, alt_target: 0.3 } }, inputs).plotPoints[0];
    const items = point.tooltip;
    expect(names(items).slice(4)).toEqual([
      "Upper 99% Limit", "Upper 95% Limit", "Upper 68% Limit", "Centerline", "Alt. Target",
      "Lower 68% Limit", "Lower 95% Limit", "Lower 99% Limit"
    ]);
    expect(entry(items, "Upper 68% Limit")).toBe(must(point.limits.ul68).toFixed(2));
    expect(entry(items, "Lower 68% Limit")).toBe(must(point.limits.ll68).toFixed(2));
    expect(entry(items, "Centerline")).toBe((160 / 600).toFixed(2));
    expect(entry(items, "Alt. Target")).toBe("0.30");
  });

  it("omits the alt. target entry until a value is given", () => {
    expect(names(tooltip({ lines: { show_alt_target: true } }))).not.toContain("Alt. Target");
  });

  it("formats each line's value with the chart's percentage suffix and decimals", () => {
    const items = tooltip({ funnel: { sig_figs: 1 }, lines: { show_68: true } });
    expect(names(items)).toHaveLength(11);
    for (let i = 4; i < items.length; i++) {
      expect(items[i].value, items[i].displayName).toMatch(/^\d+\.\d%$/);
    }
  });
});

describe("plot scaling tooltip", () => {
  const transformations = [
    { transformation: "ln", transform: (x: number) => Math.log(x + 1), name: "Natural Log (y+1)" },
    { transformation: "log10", transform: (x: number) => Math.log10(x + 1), name: "Log10 (y+1)" },
    { transformation: "sqrt", transform: Math.sqrt, name: "Square-Root" }
  ] as const;

  it.each(transformations)("adds a Plot Scaling entry after the limits and reports transformed values for $transformation",
    ({ transformation, transform, name }) => {
      const point = calculate({ funnel: { transformation, perc_labels: "No" } }, inputs).plotPoints[0];
      const items = point.tooltip;
      expect(names(items)).toEqual(["Group", "Proportion", "Numerator", "Denominator", ...limitNames, "Plot Scaling"]);
      expect(point.value).toBe(transform(0.5));
      expect(items[1].value).toBe(transform(0.5).toFixed(2));
      expect(items[2].value).toBe("50");
      expect(items[3].value).toBe("100");
      expect(entry(items, "Upper 99% Limit")).toBe(must(point.limits.ul99).toFixed(2));
      expect(entry(items, "Centerline")).toBe(transform(160 / 600).toFixed(2));
      expect(entry(items, "Plot Scaling")).toBe(name);
    });

  it.each(transformations)("drops the percentage suffix from transformed proportions: $transformation", ({ transformation, transform }) => {
    const model = calculate({ funnel: { transformation } }, inputs);
    expect(model.inputSettings.derivedSettings.percentLabels).toBe(false);
    const items = model.plotPoints[0].tooltip;
    expect(items[1].value).toBe(transform(50).toFixed(2));
    for (let i = 0; i < limitNames.length; i++) {
      expect(entry(items, limitNames[i]), limitNames[i]).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it("has no Plot Scaling entry without a transformation", () => {
    expect(names(tooltip({ funnel: { transformation: "none" } }))).not.toContain("Plot Scaling");
  });
});

describe("pattern tooltips", () => {
  function patterns(settings: SettingsOverrides, index: number): string | undefined {
    return entry(tooltip(settings, index), "Pattern(s)");
  }

  it("lists three-sigma before two-sigma outliers in one entry, one per line", () => {
    const both = { outliers: { three_sigma: true, two_sigma: true } };
    expect(patterns(both, 0)).toBe("Three Sigma Outlier\nTwo Sigma Outlier");
    expect(patterns(both, 1)).toBe("Two Sigma Outlier");
    expect(patterns(both, 2)).toBeUndefined();
    expect(patterns(both, 5)).toBe("Three Sigma Outlier\nTwo Sigma Outlier");
    expect(names(tooltip(both, 0)).slice(-2)).toEqual(["Lower 99% Limit", "Pattern(s)"]);
  });

  it("only names the outlier types that are switched on", () => {
    expect(patterns({}, 0)).toBeUndefined();
    expect(patterns({ outliers: { three_sigma: true } }, 0)).toBe("Three Sigma Outlier");
    expect(patterns({ outliers: { three_sigma: true } }, 1)).toBeUndefined();
    expect(patterns({ outliers: { two_sigma: true } }, 0)).toBe("Two Sigma Outlier");
    expect(patterns({ outliers: { two_sigma: true } }, 1)).toBe("Two Sigma Outlier");
  });

  it("names only the flagged change types for the improvement direction", () => {
    const improvement = { three_sigma: true, process_flag_type: "improvement" } as const;
    expect(patterns({ outliers: improvement }, 0)).toBe("Three Sigma Outlier");
    expect(patterns({ outliers: improvement }, 5)).toBeUndefined();
    const decrease = { ...improvement, improvement_direction: "decrease" } as const;
    expect(patterns({ outliers: decrease }, 0)).toBeUndefined();
    expect(patterns({ outliers: decrease }, 5)).toBe("Three Sigma Outlier");
    const deterioration = { three_sigma: true, process_flag_type: "deterioration" } as const;
    expect(patterns({ outliers: deterioration }, 0)).toBeUndefined();
    expect(patterns({ outliers: deterioration }, 5)).toBe("Three Sigma Outlier");
  });

  it("appends the report's tooltip columns after the plot scaling and patterns", () => {
    const withColumns = { ...inputs, tooltips: ["t-A", "t-B", "t-C", "t-D", "t-E", "t-F"] };
    const settings = { funnel: { transformation: "sqrt" }, outliers: { three_sigma: true } } as const;
    const flagged = tooltip(settings, 0, withColumns);
    expect(names(flagged).slice(-4)).toEqual(["Lower 99% Limit", "Plot Scaling", "Pattern(s)", "tooltips"]);
    expect(flagged[flagged.length - 1].value).toBe("t-A");
    const plain = tooltip(settings, 2, withColumns);
    expect(names(plain).slice(-2)).toEqual(["Plot Scaling", "tooltips"]);
    expect(plain[plain.length - 1].value).toBe("t-C");
    expect(names(tooltip(settings, 0))).not.toContain("tooltips");
  });

  it("keeps tooltip columns with their rows when a row is removed", () => {
    const items = tooltip({}, 1, {
      key: ["A", "B", "C"], numerators: [4, null, 25], denominators: [10, 90, 100], tooltips: ["t-A", "t-B", "t-C"]
    });
    expect(items[0].value).toBe("C");
    expect(entry(items, "tooltips")).toBe("t-C");
  });
});

describe("tooltip host wiring", () => {
  const removed = { key: ["A", "B", "C", "D"], numerators: [4, null, 25, 30], denominators: [10, 90, 100, 120] };

  it("passes a hovered dot's tooltip and identity to the host and hides it on leave", () => {
    const host = keyedHost();
    const show = vi.spyOn(host.tooltipService, "show");
    const hide = vi.spyOn(host.tooltipService, "hide");
    const rendered = renderVisual({ funnel: { ttip_label_value: "Mortality" } }, removed, { host });
    const dot = rendered.element.querySelectorAll(".dotsgroup path")[1];
    dot.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const point = rendered.visual.viewModel.plotPoints[1];
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ dataItems: point.tooltip, identities: [point.identity], isTouchEvent: false }));
    expect(point.identity.getKey()).toBe("key[2];");
    expect(names(point.tooltip)[1]).toBe("Mortality");
    expect(point.tooltip[0].value).toBe("C");
    dot.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(hide).toHaveBeenCalledWith({ immediately: true, isTouchEvent: false });
  });

  it("shows the nearest point's tooltip as the pointer moves over the plot", () => {
    const host = keyedHost();
    const show = vi.spyOn(host.tooltipService, "show");
    const rendered = renderVisual({}, removed, { host });
    const svg = must(rendered.element.querySelector("svg"));
    const frame = rendered.visual.plotProperties;
    const point = rendered.visual.viewModel.plotPoints[2];
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new MouseEvent("mousemove", {
      clientX: rect.left + frame.xScale(point.x), clientY: rect.top + frame.yScale(point.value), bubbles: true
    }));
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ dataItems: point.tooltip, identities: [point.identity] }));
    expect(point.identity.getKey()).toBe("key[3];");
  });
});
