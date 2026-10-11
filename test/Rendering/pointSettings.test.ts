import { describe, expect, it } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { cells, keyedHost, must } from "powerbi-visuals-core/testing";
import type { settingsValueType } from "../../src/settings";
import type { SettingsOverrides } from "../helpers/buildDataView";
import { renderVisual } from "../helpers/renderVisual";

type Outliers = settingsValueType["outliers"];
type Tier = "two_sigma" | "three_sigma";
type Status = "improvement" | "deterioration" | "neutral_low" | "neutral_high";

/** Points 0 and 2 fall beyond the 99% limits, 1 and 3 between the 95% and 99% limits, the rest inside */
const data = {
  key: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numerators: [30, 40, 20, 40, 60, 75, 105, 120],
  denominators: [100, 200, 300, 400, 500, 600, 700, 800]
};
const count = data.key.length;
const tiers: Tier[] = ["two_sigma", "three_sigma"];
const statuses: Status[] = ["improvement", "deterioration", "neutral_low", "neutral_high"];
const commonCause = "rgb(166, 166, 166)";

/** A distinct colour for each tier and status */
function flagColour(tier: Tier, status: Status): string {
  return `#${(tiers.indexOf(tier) + 1).toString(16)}0${(statuses.indexOf(status) + 1).toString(16)}0a0`;
}

function rgb(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
}

function colouredOutliers(overrides: Partial<Outliers>): Partial<Outliers> {
  const result: Partial<Outliers> = { ...overrides };
  for (let t = 0; t < tiers.length; t++) {
    for (let s = 0; s < statuses.length; s++) {
      Object.assign(result, { [`${tiers[t]}_colour_${statuses[s]}`]: flagColour(tiers[t], statuses[s]) });
    }
  }
  return result;
}

function dots(element: HTMLElement): NodeListOf<SVGPathElement> {
  return element.querySelectorAll<SVGPathElement>(".dotsgroup path");
}

function groupTexts(element: HTMLElement): NodeListOf<SVGTextElement> {
  return element.querySelectorAll<SVGTextElement>(".dotsgroup text");
}

/** One settings override per row, from the row's index */
function perRow(overrides: (i: number) => SettingsOverrides): SettingsOverrides[] {
  const rows = new Array<SettingsOverrides>(count);
  for (let i = 0; i < count; i++) {
    rows[i] = overrides(i);
  }
  return rows;
}

describe("scatter settings", () => {
  it("draws each dot with the configured fill, outline and outline width", () => {
    const defaults = dots(renderVisual({}, data).element);
    expect(defaults).toHaveLength(count);
    for (let i = 0; i < defaults.length; i++) {
      expect(defaults[i].style.fill).toBe(commonCause);
      expect(defaults[i].style.stroke).toBe(commonCause);
      expect(defaults[i].style.strokeWidth).toBe("1");
    }
    const drawn = dots(renderVisual({ scatter: { colour: "#123456", colour_outline: "#654321", width_outline: 3 } }, data).element);
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fill).toBe("rgb(18, 52, 86)");
      expect(drawn[i].style.stroke).toBe("rgb(101, 67, 33)");
      expect(drawn[i].style.strokeWidth).toBe("3");
    }
  });

  // Size is the marker radius, so a circle spans twice it and a square of equal area its root-pi multiple
  it.each([2, 6])("draws distinct shapes sized by a size of %d", size => {
    const shapes = ["Circle", "Cross", "Diamond", "Square", "Star", "Triangle", "Wye"] as const;
    const paths = new Set<string>();
    const widths: Record<string, number> = {};
    for (let i = 0; i < shapes.length; i++) {
      const dot = dots(renderVisual({ scatter: { shape: shapes[i], size } }, data).element)[0];
      paths.add(must(dot.getAttribute("d")));
      widths[shapes[i]] = dot.getBBox().width;
    }
    expect(paths.size).toBe(shapes.length);
    expect(widths.Circle).toBeCloseTo(2 * size, 3);
    expect(widths.Square).toBeCloseTo(size * Math.sqrt(Math.PI), 3);
  });

  it("places each dot at its denominator and plotted value", () => {
    const rendered = renderVisual({}, data);
    const frame = rendered.visual.plotProperties;
    const svg = must(rendered.element.querySelector("svg")).getBoundingClientRect();
    const drawn = dots(rendered.element);
    for (let i = 0; i < drawn.length; i++) {
      const box = drawn[i].getBoundingClientRect();
      expect(box.left + box.width / 2 - svg.left).toBeCloseTo(frame.xScale(data.denominators[i]), 3);
      expect(box.top + box.height / 2 - svg.top).toBeCloseTo(frame.yScale(rendered.visual.viewModel.plotPoints[i].value), 3);
    }
  });

  it("styles each dot from its own row's conditional formatting", () => {
    const drawn = dots(renderVisual(perRow(i => ({
      scatter: { colour: i % 2 === 0 ? "#111111" : "#222222", size: i % 2 === 0 ? 2 : 5, width_outline: i % 2 === 0 ? 1 : 2 }
    })), data).element);
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fill).toBe(i % 2 === 0 ? "rgb(17, 17, 17)" : "rgb(34, 34, 34)");
      expect(drawn[i].style.strokeWidth).toBe(i % 2 === 0 ? "1" : "2");
      expect(drawn[i].getBBox().width).toBeCloseTo(i % 2 === 0 ? 4 : 10, 3);
    }
  });

  it("fades each dot by its own row's opacities while a point is selected", async () => {
    const rendered = renderVisual(perRow(i => ({
      scatter: { opacity: i < 4 ? 0.9 : 0.8, opacity_selected: i < 4 ? 0.7 : 0.6, opacity_unselected: i < 4 ? 0.3 : 0.4 }
    })), data, { host: keyedHost() });
    const drawn = dots(rendered.element);
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fillOpacity).toBe(i < 4 ? "0.9" : "0.8");
      expect(drawn[i].style.strokeOpacity).toBe(i < 4 ? "0.9" : "0.8");
    }
    const selected = [1, 5];
    for (let i = 0; i < selected.length; i++) {
      await rendered.visual.selectionManager.select(rendered.visual.viewModel.plotPoints[selected[i]].identity, true);
    }
    rendered.visual.updateHighlighting();
    const expected = ["0.3", "0.7", "0.3", "0.3", "0.4", "0.6", "0.4", "0.4"];
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fillOpacity, `point ${i}`).toBe(expected[i]);
      expect(drawn[i].style.strokeOpacity, `point ${i}`).toBe(expected[i]);
    }
  });

  it("emphasises the rows another visual highlights and fades the rest", () => {
    const rendered = renderVisual({ scatter: { opacity_selected: 0.9, opacity_unselected: 0.25 } }, data, {
      prepare: dataView => {
        must(dataView.categorical?.values)[0].highlights = cells([null, 40, null, null, null, 75, null, null]);
      }
    });
    const drawn = dots(rendered.element);
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fillOpacity, `point ${i}`).toBe(i === 1 || i === 5 ? "0.9" : "0.25");
    }
  });

  it("fills unflagged dots with the high-contrast foreground", () => {
    const host = createVisualHost({});
    Object.assign(host.colorPalette, { isHighContrast: true, foreground: { value: "#abcdef" } });
    const drawn = dots(renderVisual({ scatter: { colour: "#123456" } }, data, { host }).element);
    expect(drawn).toHaveLength(count);
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fill).toBe("rgb(171, 205, 239)");
    }
  });
});

describe("group text", () => {
  it("draws each group's name in place of its marker with the group text settings", () => {
    const rendered = renderVisual({
      scatter: { use_group_text: true, scatter_text_font: "Georgia", scatter_text_size: 14, scatter_text_colour: "#123456" }
    }, data);
    const frame = rendered.visual.plotProperties;
    expect(dots(rendered.element)).toHaveLength(0);
    const texts = groupTexts(rendered.element);
    expect(texts).toHaveLength(count);
    for (let i = 0; i < texts.length; i++) {
      const point = rendered.visual.viewModel.plotPoints[i];
      expect(texts[i].textContent).toBe(data.key[i]);
      expect(texts[i].getAttribute("transform")).toBe(`translate(${frame.xScale(point.x)}, ${frame.yScale(point.value)})`);
      expect(texts[i].getAttribute("dy")).toBe("0.35em");
      expect(texts[i].style.textAnchor).toBe("middle");
      expect(texts[i].style.fontFamily).toBe("Georgia");
      expect(texts[i].style.fontSize).toBe("14px");
      expect(texts[i].style.fill).toBe("rgb(18, 52, 86)");
    }
    rendered.update({});
    expect(groupTexts(rendered.element)).toHaveLength(0);
    expect(dots(rendered.element)).toHaveLength(count);
  });

  it("styles each group's text from its own row's conditional formatting", () => {
    const texts = groupTexts(renderVisual(perRow(i => ({
      scatter: { use_group_text: true, scatter_text_colour: i % 2 === 0 ? "#111111" : "#222222", scatter_text_size: i % 2 === 0 ? 8 : 16 }
    })), data).element);
    expect(texts).toHaveLength(count);
    for (let i = 0; i < texts.length; i++) {
      expect(texts[i].style.fill).toBe(i % 2 === 0 ? "rgb(17, 17, 17)" : "rgb(34, 34, 34)");
      expect(texts[i].style.fontSize).toBe(i % 2 === 0 ? "8px" : "16px");
    }
  });

  it("shows group text at its own default opacity rather than the marker's", () => {
    const texts = groupTexts(renderVisual({
      scatter: { use_group_text: true, scatter_text_opacity: 0.7, opacity: 0.3 }
    }, data).element);
    expect(texts).toHaveLength(count);
    for (let i = 0; i < texts.length; i++) {
      expect(texts[i].style.fillOpacity).toBe("0.7");
    }
  });
});

describe("outlier colours", () => {
  it("leaves every dot in its own colour until a flag is turned on", () => {
    const rendered = renderVisual({ outliers: colouredOutliers({}) }, data);
    const drawn = dots(rendered.element);
    for (let i = 0; i < drawn.length; i++) {
      expect(drawn[i].style.fill, `point ${i}`).toBe(commonCause);
      expect(rendered.visual.viewModel.plotPoints[i].two_sigma).toBe("none");
      expect(rendered.visual.viewModel.plotPoints[i].three_sigma).toBe("none");
    }
  });

  // Three-sigma colours override two-sigma ones for points beyond both limits
  it.each([
    { flags: { two_sigma: true }, expected: ["two_sigma", "two_sigma", "two_sigma", "two_sigma"] },
    { flags: { three_sigma: true }, expected: ["three_sigma", undefined, "three_sigma", undefined] },
    { flags: { two_sigma: true, three_sigma: true }, expected: ["three_sigma", "two_sigma", "three_sigma", "two_sigma"] }
  ] satisfies { flags: Partial<Outliers>; expected: (Tier | undefined)[] }[])("fills and outlines dots flagged by $flags", ({ flags, expected }) => {
    const drawn = dots(renderVisual({
      scatter: { colour_outline: "#654321" },
      outliers: colouredOutliers(flags)
    }, data).element);
    const statusByPoint: Status[] = ["improvement", "improvement", "deterioration", "deterioration"];
    for (let i = 0; i < drawn.length; i++) {
      const tier = expected[i];
      const fill = tier === undefined ? commonCause : rgb(flagColour(tier, statusByPoint[i]));
      expect(drawn[i].style.fill, `point ${i}`).toBe(fill);
      expect(drawn[i].style.stroke, `point ${i}`).toBe(tier === undefined ? "rgb(101, 67, 33)" : fill);
    }
  });

  it("colours flagged group text with the winning flag's colour", () => {
    const texts = groupTexts(renderVisual({
      scatter: { use_group_text: true, scatter_text_colour: "#123456" },
      outliers: colouredOutliers({ two_sigma: true, three_sigma: true })
    }, data).element);
    const expected = [
      rgb(flagColour("three_sigma", "improvement")), rgb(flagColour("two_sigma", "improvement")),
      rgb(flagColour("three_sigma", "deterioration")), rgb(flagColour("two_sigma", "deterioration"))
    ];
    for (let i = 0; i < texts.length; i++) {
      expect(texts[i].style.fill, `point ${i}`).toBe(i < expected.length ? expected[i] : "rgb(18, 52, 86)");
    }
  });

  // High points 0 (three sigma) and 1 (two sigma), low points 2 (three sigma) and 3 (two sigma)
  it.each([
    { direction: "increase", type: "both", high: "improvement", low: "deterioration" },
    { direction: "increase", type: "improvement", high: "improvement", low: undefined },
    { direction: "increase", type: "deterioration", high: undefined, low: "deterioration" },
    { direction: "decrease", type: "both", high: "deterioration", low: "improvement" },
    { direction: "decrease", type: "improvement", high: undefined, low: "improvement" },
    { direction: "decrease", type: "deterioration", high: "deterioration", low: undefined },
    { direction: "neutral", type: "both", high: "neutral_high", low: "neutral_low" },
    // A neutral direction has no improvement or deterioration to filter by, so flags both sides
    { direction: "neutral", type: "improvement", high: "neutral_high", low: "neutral_low" },
    { direction: "neutral", type: "deterioration", high: "neutral_high", low: "neutral_low" }
  ] as const)("flags $type changes for an improvement direction of $direction", ({ direction, type, high, low }) => {
    const rendered = renderVisual({
      outliers: colouredOutliers({ improvement_direction: direction, process_flag_type: type, two_sigma: true, three_sigma: true })
    }, data);
    const drawn = dots(rendered.element);
    const points = rendered.visual.viewModel.plotPoints;
    const flagged: { index: number; tier: Tier; status: Status | undefined }[] = [
      { index: 0, tier: "three_sigma", status: high },
      { index: 1, tier: "two_sigma", status: high },
      { index: 2, tier: "three_sigma", status: low },
      { index: 3, tier: "two_sigma", status: low }
    ];
    for (let i = 0; i < flagged.length; i++) {
      const point = flagged[i];
      const status = point.status;
      expect(points[point.index][point.tier], `point ${point.index}`).toBe(status ?? "none");
      expect(drawn[point.index].style.fill, `point ${point.index}`).toBe(status === undefined ? commonCause : rgb(flagColour(point.tier, status)));
    }
    for (let i = flagged.length; i < drawn.length; i++) {
      expect(drawn[i].style.fill, `point ${i}`).toBe(commonCause);
    }
  });
});
