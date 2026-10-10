import type powerbi from "powerbi-visuals-api";
import { describe, expect, it, vi } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { checkFlagDirection, type FlagDirection } from "powerbi-visuals-core/data";
import { normalQuantile } from "powerbi-visuals-core/math";
import type { FormattingModel } from "powerbi-visuals-core/powerbi";
import { keyedHost } from "powerbi-visuals-core/testing";
import { defaultSettings } from "../src/settings";
import buildDataView, { type SettingsOverrides } from "./helpers/buildDataView";
import findBy from "./helpers/findBy";
import { must, renderVisual, type Rendered } from "./helpers/renderVisual";

type Card = FormattingModel["cards"][number];
type Layout = { top: number; bottom: number; left: number; right: number; rowHeight: number; scale: (value: number) => number };

// Group A scores far above the default upper bound on Mortality, below -3 sigma on Readmissions and near zero on Falls
const indicators = ["Mortality", "Readmissions", "Falls"];
const directions = ["increase", "decrease", "increase"] as const;
const data = {
  key: ["A", "A", "A", "B", "B", "B", "C", "C", "C", "D", "D", "D"],
  numerators: [80, 50, 22, 20, 20, 20, 24, 24, 24, 30, 30, 30],
  denominators: new Array<number>(12).fill(100)
};
const z95 = normalQuantile(0.975, 0, 1, true, false);
const z99 = normalQuantile(0.999, 0, 1, true, false);

function rowSettings(common: SettingsOverrides): SettingsOverrides[] {
  const rows = new Array<SettingsOverrides>(data.key.length);
  for (let i = 0; i < rows.length; i++) {
    rows[i] = { ...common, outliers: { ...common.outliers, improvement_direction: directions[i % indicators.length] } };
  }
  return rows;
}

function addIndicators(dataView: powerbi.DataView): void {
  const values = new Array<string>(data.key.length);
  for (let i = 0; i < values.length; i++) {
    values[i] = indicators[i % indicators.length];
  }
  must(dataView.categorical?.categories).push({ source: { displayName: "Indicator", roles: { indicator: true } }, values });
}

function renderMisc(common: SettingsOverrides = {}, host = createVisualHost({})): Rendered {
  return renderVisual(rowSettings(common), data, { host, prepare: addIndicators });
}

function attr(element: Element | null | undefined, name: string): number {
  return Number(must(must(element).getAttribute(name)));
}

function all(rendered: Rendered, selector: string): NodeListOf<SVGElement> {
  return rendered.element.querySelectorAll<SVGElement>(selector);
}

function texts(elements: NodeListOf<Element>): (string | null)[] {
  const result = new Array<string | null>(elements.length);
  for (let i = 0; i < elements.length; i++) {
    result[i] = elements[i].textContent;
  }
  return result;
}

/** drawMisc reserves 55px above the rows for the legend and direction labels and 35px below for the axis */
function layout(rendered: Rendered, overrides: SettingsOverrides = {}): Layout {
  const canvas = { ...defaultSettings.canvas, ...overrides.canvas };
  const misc = { ...defaultSettings.misc, ...overrides.misc };
  const labels = rendered.element.querySelectorAll<SVGTextElement>(".misc-y-tick");
  let labelWidth = 0;
  for (let i = 0; i < labels.length; i++) {
    labelWidth = Math.max(labelWidth, labels[i].getBBox().width);
  }
  const top = canvas.upper_padding + 55;
  const bottom = 500 - canvas.lower_padding - 35;
  const left = canvas.left_padding + labelWidth + 10;
  const right = 500 - canvas.right_padding;
  return {
    top,
    bottom,
    left,
    right,
    rowHeight: (bottom - top) / labels.length,
    scale: value => left + (right - left) * (value - misc.lower) / (misc.upper - misc.lower)
  };
}

/** MISC setting errors name the setting themselves, so they have no preamble */
function errorMessage(rendered: Rendered): string | null {
  const lines = texts(all(rendered, ".errormessage text"));
  expect(lines).toHaveLength(1);
  return lines[0];
}

function legendLines(rendered: Rendered): NodeListOf<SVGLineElement> {
  return rendered.element.querySelectorAll<SVGLineElement>(".misc-root > line:not([class])");
}

function sliceNames(card: Card | undefined): string[] {
  const names: string[] = [];
  const groups = must(card).groups;
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups[i].slices.length; j++) {
      names.push(groups[i].slices[j].control.properties.descriptor.propertyName);
    }
  }
  return names;
}

function cardNames(model: FormattingModel): string[] {
  const names = new Array<string>(model.cards.length);
  for (let i = 0; i < model.cards.length; i++) {
    names[i] = model.cards[i].uid.replace("_card_uid", "");
  }
  return names;
}

describe("MISC sigma scale", () => {
  it.each([
    { lower: -5, upper: 5 },
    { lower: -4, upper: 6 },
    { lower: -2, upper: 2 }
  ])("draws bars from zero to each score clamped to [$lower, $upper]", misc => {
    const rendered = renderMisc({ misc });
    const frame = layout(rendered, { misc });
    const points = rendered.visual.viewModel.miscPoints;
    const bars = all(rendered, ".misc-bar");
    expect(bars).toHaveLength(3);
    expect(points[0].score).toBeGreaterThan(misc.upper);
    for (let i = 0; i < bars.length; i++) {
      const clamped = Math.min(Math.max(points[i].score, misc.lower), misc.upper);
      expect(attr(bars[i], "x"), points[i].indicator).toBeCloseTo(frame.scale(Math.min(0, clamped)), 6);
      expect(attr(bars[i], "width"), points[i].indicator).toBeCloseTo(Math.abs(frame.scale(clamped) - frame.scale(0)), 6);
    }
    const axis = rendered.element.querySelector(".misc-axis");
    expect(attr(axis, "x1")).toBeCloseTo(frame.left, 6);
    expect(attr(axis, "x2")).toBeCloseTo(frame.right, 6);
    expect(attr(axis, "y1")).toBe(frame.bottom);
  });

  it("clips scores beyond either bound at that edge of the plot", () => {
    const misc = { lower: -2, upper: 2 };
    const rendered = renderMisc({ misc });
    const frame = layout(rendered, { misc });
    const points = rendered.visual.viewModel.miscPoints;
    const bars = all(rendered, ".misc-bar");
    expect(points[0].score).toBeGreaterThan(misc.upper);
    expect(points[1].score).toBeLessThan(misc.lower);
    expect(attr(bars[0], "x")).toBeCloseTo(frame.scale(0), 6);
    expect(attr(bars[0], "x") + attr(bars[0], "width")).toBeCloseTo(frame.right, 6);
    expect(attr(bars[1], "x")).toBeCloseTo(frame.left, 6);
    expect(attr(bars[1], "x") + attr(bars[1], "width")).toBeCloseTo(frame.scale(0), 6);
  });

  it("draws the zero, 95% and 99% lines at their normal quantiles over the plot rows", () => {
    const misc = { lower: -4, upper: 6 };
    const rendered = renderMisc({ misc });
    const frame = layout(rendered, { misc });
    const expected = [
      { selector: ".misc-limit-99", values: [-z99, z99] },
      { selector: ".misc-limit-95", values: [-z95, z95] },
      { selector: ".misc-zero-line", values: [0] }
    ];
    for (let i = 0; i < expected.length; i++) {
      const lines = all(rendered, expected[i].selector);
      expect(lines).toHaveLength(expected[i].values.length);
      for (let j = 0; j < lines.length; j++) {
        expect(attr(lines[j], "x1")).toBeCloseTo(frame.scale(expected[i].values[j]), 6);
        expect(attr(lines[j], "x2")).toBe(attr(lines[j], "x1"));
        expect(attr(lines[j], "y1")).toBe(frame.top);
        expect(attr(lines[j], "y2")).toBe(frame.bottom);
      }
    }
  });

  it("omits limit lines outside the sigma bounds", () => {
    const narrow = renderMisc({ misc: { lower: -2.5, upper: 2.5 } });
    expect(all(narrow, ".misc-limit-99")).toHaveLength(0);
    expect(all(narrow, ".misc-limit-95")).toHaveLength(2);
    const misc = { lower: -1.5, upper: 3.5 };
    const skewed = renderMisc({ misc });
    const frame = layout(skewed, { misc });
    const upper95 = all(skewed, ".misc-limit-95");
    const upper99 = all(skewed, ".misc-limit-99");
    expect(upper95).toHaveLength(1);
    expect(upper99).toHaveLength(1);
    expect(attr(upper95[0], "x1")).toBeCloseTo(frame.scale(z95), 6);
    expect(attr(upper99[0], "x1")).toBeCloseTo(frame.scale(z99), 6);
    expect(all(skewed, ".misc-zero-line")).toHaveLength(1);
  });

  it("styles each line from its width, type, colour and opacity settings", () => {
    const defaults = renderMisc();
    const lines = {
      width_99: 1, type_99: "2 5", colour_99: "#654321", opacity_99: 0.7,
      width_95: 3, type_95: "10 10", colour_95: "#123456", opacity_95: 0.5,
      width_target: 4, type_target: "2 5", colour_target: "#ABCDEF", opacity_target: 0.3
    } as const;
    const styled = renderMisc({ lines });
    const expected = [
      { selector: ".misc-limit-99", initial: ["#6495ED", "2", "10 10", "1"], styled: ["#654321", "1", "2 5", "0.7"] },
      { selector: ".misc-limit-95", initial: ["#6495ED", "2", "2 5", "1"], styled: ["#123456", "3", "10 10", "0.5"] },
      { selector: ".misc-zero-line", initial: ["#000000", "1.5", "10 0", "1"], styled: ["#ABCDEF", "4", "2 5", "0.3"] }
    ];
    const attributes = ["stroke", "stroke-width", "stroke-dasharray", "opacity"];
    for (let i = 0; i < expected.length; i++) {
      const before = all(defaults, expected[i].selector);
      const after = all(styled, expected[i].selector);
      expect(after.length).toBeGreaterThan(0);
      expect(after).toHaveLength(before.length);
      for (let j = 0; j < after.length; j++) {
        for (let k = 0; k < attributes.length; k++) {
          expect(before[j].getAttribute(attributes[k]), `${expected[i].selector} ${attributes[k]}`).toBe(expected[i].initial[k]);
          expect(after[j].getAttribute(attributes[k]), `${expected[i].selector} ${attributes[k]}`).toBe(expected[i].styled[k]);
        }
      }
    }
  });

  it.each([
    { lines: { show_95: false }, counts: [2, 0, 1] },
    { lines: { show_99: false }, counts: [0, 2, 1] },
    { lines: { show_target: false }, counts: [2, 2, 0] }
  ])("hides lines with their show setting: $lines", ({ lines, counts }) => {
    const rendered = renderMisc({ lines });
    expect(all(rendered, ".misc-limit-99")).toHaveLength(counts[0]);
    expect(all(rendered, ".misc-limit-95")).toHaveLength(counts[1]);
    expect(all(rendered, ".misc-zero-line")).toHaveLength(counts[2]);
  });
});

describe("MISC bars", () => {
  it.each([0.65, 1, 0.2])("sizes bars to %s of each row, centred on the indicator label", bar_height => {
    const rendered = renderMisc({ misc: { bar_height } });
    const frame = layout(rendered);
    const bars = all(rendered, ".misc-bar");
    const labels = all(rendered, ".misc-y-tick");
    expect(frame.rowHeight).toBeCloseTo((frame.bottom - frame.top) / 3, 10);
    for (let i = 0; i < bars.length; i++) {
      expect(attr(bars[i], "height")).toBeCloseTo(frame.rowHeight * bar_height, 6);
      expect(attr(bars[i], "y")).toBeCloseTo(frame.top + (i + (1 - bar_height) / 2) * frame.rowHeight, 6);
      expect(attr(labels[i], "y")).toBeCloseTo(frame.top + (i + 0.5) * frame.rowHeight, 6);
      expect(attr(bars[i], "y") + attr(bars[i], "height") / 2).toBeCloseTo(attr(labels[i], "y"), 6);
    }
  });

  it("fills common-cause bars with the scatter colour and outliers with the three-sigma colours", () => {
    const fills = (rendered: Rendered): (string | null)[] => {
      const bars = all(rendered, ".misc-bar");
      const result = new Array<string | null>(bars.length);
      for (let i = 0; i < bars.length; i++) {
        result[i] = bars[i].getAttribute("fill");
      }
      return result;
    };
    expect(fills(renderMisc())).toEqual(["#00B0F0", "#E46C0A", "#A6A6A6"]);
    const colours = {
      scatter: { colour: "#123456" },
      outliers: { three_sigma_colour_improvement: "#112233", three_sigma_colour_deterioration: "#445566" }
    };
    expect(fills(renderMisc(colours))).toEqual(["#112233", "#445566", "#123456"]);
    expect(fills(renderMisc({ ...colours, outliers: { ...colours.outliers, process_flag_type: "improvement" } })))
      .toEqual(["#112233", "#123456", "#123456"]);
    const rows = rowSettings({});
    rows[2] = { ...rows[2], scatter: { colour: "#777777" } };
    expect(fills(renderVisual(rows, data, { prepare: addIndicators }))).toEqual(["#00B0F0", "#E46C0A", "#777777"]);
  });

  // Colours follow the funnel's flags against the truncated limits, while the bars show untruncated z-scores
  it("colours bars by the truncated limits while their scores ignore truncation", () => {
    const plain = renderMisc();
    const truncated = renderMisc({ funnel: { ll_truncate: 25, ul_truncate: 26 } });
    const fills: Partial<Record<FlagDirection, string>> = { improvement: "#00B0F0", deterioration: "#E46C0A", none: "#A6A6A6" };
    const bars = all(truncated, ".misc-bar");
    const points = truncated.visual.viewModel.miscPoints;
    for (let i = 0; i < points.length; i++) {
      expect(points[i].score).toBe(plain.visual.viewModel.miscPoints[i].score);
      const limits = points[i].limits;
      let side: "lower" | "upper" | "none" = "none";
      if (points[i].value < must(limits.ll99)) {
        side = "lower";
      } else if (points[i].value > must(limits.ul99)) {
        side = "upper";
      }
      expect(points[i].three_sigma).toBe(checkFlagDirection(side, { process_flag_type: "both", improvement_direction: directions[i] }));
      expect(bars[i].getAttribute("fill")).toBe(fills[points[i].three_sigma]);
    }
    // Falls is common-cause until its lower limit is raised past it
    expect(all(plain, ".misc-bar")[2].getAttribute("fill")).toBe("#A6A6A6");
    expect(bars[2].getAttribute("fill")).toBe("#E46C0A");
  });

  it("fades bars with the scatter opacities", async () => {
    const rendered = renderMisc({ scatter: { opacity: 0.6, opacity_selected: 0.9, opacity_unselected: 0.3 } }, keyedHost());
    const bars = all(rendered, ".misc-bar");
    for (let i = 0; i < bars.length; i++) {
      expect(bars[i].getAttribute("opacity")).toBe("0.6");
    }
    await rendered.visual.selectionManager.select(rendered.visual.viewModel.miscPoints[1].identity);
    rendered.visual.updateHighlighting();
    expect(bars[0].getAttribute("opacity")).toBe("0.3");
    expect(bars[1].getAttribute("opacity")).toBe("0.9");
    expect(bars[2].getAttribute("opacity")).toBe("0.3");
  });
});

describe("MISC labels and legend", () => {
  it("labels the unfavourable and favourable sides of zero in the deterioration and improvement colours", () => {
    const defaults = renderMisc();
    const frame = layout(defaults);
    const labels = all(defaults, ".misc-direction");
    expect(texts(labels)).toEqual(["Unfavourable", "Favourable"]);
    expect(labels[0].getAttribute("fill")).toBe("#E46C0A");
    expect(labels[1].getAttribute("fill")).toBe("#00B0F0");
    expect(attr(labels[0], "x")).toBeCloseTo((frame.left + frame.scale(0)) / 2, 6);
    expect(attr(labels[1], "x")).toBeCloseTo((frame.scale(0) + frame.right) / 2, 6);
    expect(attr(labels[0], "y")).toBe(frame.top - 10);

    const misc = { lower: -2, upper: 6, favourable_label: "Better", unfavourable_label: "Worse" };
    const custom = renderMisc({
      misc, outliers: { three_sigma_colour_improvement: "#112233", three_sigma_colour_deterioration: "#445566" }
    });
    const shifted = layout(custom, { misc });
    const customLabels = all(custom, ".misc-direction");
    expect(texts(customLabels)).toEqual(["Worse", "Better"]);
    expect(customLabels[0].getAttribute("fill")).toBe("#445566");
    expect(customLabels[1].getAttribute("fill")).toBe("#112233");
    expect(attr(customLabels[0], "x")).toBeCloseTo((shifted.left + shifted.scale(0)) / 2, 6);
    expect(attr(customLabels[1], "x")).toBeCloseTo((shifted.scale(0) + shifted.right) / 2, 6);
    expect(attr(customLabels[0], "x")).toBeLessThan(shifted.scale(0));
    expect(attr(customLabels[1], "x")).toBeGreaterThan(shifted.scale(0));
  });

  it("shows a legend entry in each visible limit level's colour, width, line type and opacity", () => {
    const lines = {
      colour_95: "#123456", type_95: "10 10", width_95: 3, opacity_95: 0.5,
      colour_99: "#654321", type_99: "2 5", width_99: 5, opacity_99: 0.2
    } as const;
    const rendered = renderMisc({ lines });
    const frame = layout(rendered);
    const legend = legendLines(rendered);
    expect(legend).toHaveLength(2);
    const expected = [
      { x: frame.left, colour: "#123456", type: "10 10", width: "3", opacity: "0.5" },
      { x: frame.left + (frame.right - frame.left) / 2, colour: "#654321", type: "2 5", width: "5", opacity: "0.2" }
    ];
    for (let i = 0; i < expected.length; i++) {
      expect(attr(legend[i], "x1")).toBeCloseTo(expected[i].x, 6);
      expect(attr(legend[i], "x2")).toBeCloseTo(expected[i].x + 20, 6);
      expect(attr(legend[i], "y1")).toBe(frame.top - 35);
      expect(legend[i].getAttribute("stroke")).toBe(expected[i].colour);
      expect(legend[i].getAttribute("stroke-dasharray")).toBe(expected[i].type);
      expect(legend[i].getAttribute("stroke-width")).toBe(expected[i].width);
      expect(legend[i].getAttribute("opacity")).toBe(expected[i].opacity);
    }
    expect(rendered.element.textContent).toContain("95% Control Limits");
    expect(rendered.element.textContent).toContain("99% Control Limits");
  });

  it("drops the 99% legend entry when the bounds leave out both of its lines", () => {
    const misc = { lower: -3, upper: 3 };
    const rendered = renderMisc({ misc });
    expect(all(rendered, ".misc-limit-99")).toHaveLength(0);
    const legend = legendLines(rendered);
    expect(legend).toHaveLength(1);
    expect(legend[0].getAttribute("stroke-dasharray")).toBe("2 5");
    expect(rendered.element.textContent).not.toContain("99% Control Limits");
    const oneSide = renderMisc({ misc: { lower: -3, upper: 5 } });
    expect(all(oneSide, ".misc-limit-99")).toHaveLength(1);
    expect(legendLines(oneSide)).toHaveLength(2);
  });

  it.each([
    { lines: { show_95: false }, colours: ["#6495ED"], dashes: ["10 10"], has95: false },
    { lines: { show_99: false }, colours: ["#6495ED"], dashes: ["2 5"], has95: true },
    { lines: { show_95: false, show_99: false }, colours: [], dashes: [], has95: false }
  ])("drops legend entries with their show setting: $lines", ({ lines, colours, dashes, has95 }) => {
    const rendered = renderMisc({ lines });
    const legend = legendLines(rendered);
    expect(legend).toHaveLength(dashes.length);
    for (let i = 0; i < legend.length; i++) {
      expect(legend[i].getAttribute("stroke")).toBe(colours[i]);
      expect(legend[i].getAttribute("stroke-dasharray")).toBe(dashes[i]);
    }
    expect(rendered.element.textContent?.includes("95% Control Limits")).toBe(has95);
  });

  it("draws x ticks across the sigma scale with the tick settings", () => {
    const defaults = renderMisc();
    const frame = layout(defaults);
    const ticks = all(defaults, ".misc-x-tick");
    expect(texts(ticks)).toEqual(["-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3", "4", "5"]);
    for (let i = 0; i < ticks.length; i++) {
      expect(attr(ticks[i], "x")).toBeCloseTo(frame.scale(i - 5), 6);
      expect(attr(ticks[i], "y")).toBe(frame.bottom + 10 + 5);
      expect(ticks[i].style.fontFamily).toBe(defaultSettings.x_axis.xlimit_tick_font.replace(/'/g, ""));
    }
    const styled = renderMisc({ x_axis: {
      xlimit_tick_count: 4, xlimit_tick_font: "Georgia", xlimit_tick_size: 14, xlimit_tick_colour: "#123456", xlimit_colour: "#654321"
    } });
    const styledFrame = layout(styled);
    const styledTicks = all(styled, ".misc-x-tick");
    expect(texts(styledTicks)).toEqual(["-4", "-2", "0", "2", "4"]);
    for (let i = 0; i < styledTicks.length; i++) {
      expect(attr(styledTicks[i], "x")).toBeCloseTo(styledFrame.scale(2 * i - 4), 6);
      expect(attr(styledTicks[i], "y")).toBe(styledFrame.bottom + 14 + 5);
      expect(styledTicks[i].style.fontFamily).toBe("Georgia");
      expect(styledTicks[i].style.fontSize).toBe("14px");
      expect(styledTicks[i].getAttribute("fill")).toBe("#123456");
    }
    expect(must(styled.element.querySelector(".misc-axis")).getAttribute("stroke")).toBe("#654321");
  });

  it("rounds fractional ticks to two decimals", () => {
    const rendered = renderMisc({ misc: { lower: -0.5, upper: 0.5 } });
    expect(texts(all(rendered, ".misc-x-tick"))).toEqual([
      "-0.5", "-0.4", "-0.3", "-0.2", "-0.1", "0", "0.1", "0.2", "0.3", "0.4", "0.5"
    ]);
  });

  it.each([
    { xlimit_ticks: false },
    { xlimit_tick_count: 0 }
  ])("draws no x ticks with %o", x_axis => {
    const rendered = renderMisc({ x_axis });
    expect(all(rendered, ".misc-x-tick")).toHaveLength(0);
    expect(all(rendered, ".misc-axis")).toHaveLength(1);
  });

  it.each([
    { align: "left", anchor: "start", x: (frame: Layout) => frame.left },
    { align: "right", anchor: "end", x: (frame: Layout) => frame.right }
  ] as const)("aligns the x label to the $align of the plot in its font style", ({ align, anchor, x }) => {
    const settings = { x_axis: { xlimit_label: "Sigma", xlimit_label_align: align, xlimit_label_style: "italic" } } as const;
    const rendered = renderMisc(settings);
    const label = findBy(Array.from(rendered.element.querySelectorAll<SVGTextElement>(".misc-root > text")), "textContent", "Sigma");
    expect(attr(label, "x")).toBeCloseTo(x(layout(rendered)), 6);
    expect(must(label).getAttribute("text-anchor")).toBe(anchor);
    expect(must(label).style.fontStyle).toBe("italic");
  });

  it("centres the x label under the plot with its font settings", () => {
    const settings = {
      canvas: { lower_padding: 20 },
      x_axis: { xlimit_label: "Sigma", xlimit_label_font: "Georgia", xlimit_label_size: 13, xlimit_label_colour: "#654321" }
    };
    const rendered = renderMisc(settings);
    const frame = layout(rendered, settings);
    const label = findBy(Array.from(rendered.element.querySelectorAll<SVGTextElement>(".misc-root > text")), "textContent", "Sigma");
    expect(attr(label, "x")).toBeCloseTo((frame.left + frame.right) / 2, 6);
    expect(attr(label, "y")).toBe(480);
    expect(must(label).style.fontFamily).toBe("Georgia");
    expect(must(label).style.fontSize).toBe("13px");
    expect(must(label).getAttribute("fill")).toBe("#654321");
  });

  it("styles indicator labels with the y tick settings and starts the plot beside the widest", () => {
    const defaults = renderMisc();
    const styled = renderMisc({ y_axis: { ylimit_tick_font: "Georgia", ylimit_tick_size: 16, ylimit_tick_colour: "#ABCDEF" } });
    const labels = all(styled, ".misc-y-tick");
    expect(texts(labels)).toEqual(indicators);
    const frame = layout(styled);
    for (let i = 0; i < labels.length; i++) {
      expect(labels[i].style.fontFamily).toBe("Georgia");
      expect(labels[i].style.fontSize).toBe("16px");
      expect(labels[i].getAttribute("fill")).toBe("#ABCDEF");
      expect(attr(labels[i], "x")).toBeCloseTo(frame.left - 8, 6);
    }
    const axis = styled.element.querySelector(".misc-axis");
    expect(attr(axis, "x1")).toBeCloseTo(frame.left, 6);
    expect(attr(axis, "x1")).toBeGreaterThan(attr(defaults.element.querySelector(".misc-axis"), "x1"));
  });
});

describe("MISC canvas", () => {
  it("insets the plot, labels and legend by the canvas paddings", () => {
    const canvas = { upper_padding: 30, lower_padding: 40, left_padding: 50, right_padding: 20 };
    const rendered = renderMisc({ canvas, x_axis: { xlimit_label: "Sigma" } });
    const frame = layout(rendered, { canvas });
    expect(frame.top).toBe(85);
    expect(frame.bottom).toBe(425);
    expect(frame.right).toBe(480);
    const axis = rendered.element.querySelector(".misc-axis");
    expect(attr(axis, "x1")).toBeCloseTo(frame.left, 6);
    expect(attr(axis, "x2")).toBe(480);
    expect(attr(axis, "y1")).toBe(425);
    const zero = rendered.element.querySelector(".misc-zero-line");
    expect(attr(zero, "y1")).toBe(85);
    expect(attr(zero, "y2")).toBe(425);
    const bars = all(rendered, ".misc-bar");
    expect(attr(bars[0], "y")).toBeCloseTo(85 + 0.175 * frame.rowHeight, 6);
    expect(attr(bars[2], "y") + attr(bars[2], "height")).toBeCloseTo(425 - 0.175 * frame.rowHeight, 6);
    expect(attr(rendered.element.querySelector(".misc-direction"), "y")).toBe(75);
    expect(attr(legendLines(rendered)[0], "y1")).toBe(50);
    const label = findBy(Array.from(rendered.element.querySelectorAll<SVGTextElement>(".misc-root > text")), "textContent", "Sigma");
    expect(attr(label, "y")).toBe(460);
  });
});

describe("MISC validation", () => {
  it.each([
    { lower: 1, upper: 5 },
    { lower: 0, upper: 5 },
    { lower: -5, upper: 0 },
    { lower: -5, upper: -1 }
  ])("reports bounds [$lower, $upper] that do not span zero, then recovers", misc => {
    const host = createVisualHost({});
    const failed = vi.spyOn(host.eventService, "renderingFailed");
    const rendered = renderMisc({ misc }, host);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(errorMessage(rendered)).toBe("MISC sigma bounds must span zero.");
    expect(all(rendered, ".misc-bar")).toHaveLength(0);
    rendered.update(rowSettings({}));
    expect(failed).toHaveBeenCalledTimes(1);
    expect(all(rendered, ".errormessage")).toHaveLength(0);
    expect(all(rendered, ".misc-bar")).toHaveLength(3);
  });

  it("reports a selected group that is no longer in the data", () => {
    let group = "missing";
    const rendered = renderVisual(rowSettings({}), data, { prepare: dataView => {
      addIndicators(dataView);
      dataView.metadata.objects = { misc: { group } };
    } });
    expect(errorMessage(rendered)).toBe("Select a MISC group present in the data.");
    expect(all(rendered, ".misc-bar")).toHaveLength(0);
    group = "";
    rendered.update(rowSettings({}));
    expect(all(rendered, ".errormessage")).toHaveLength(0);
    expect(all(rendered, ".misc-bar")).toHaveLength(3);
  });
});

describe("MISC formatting pane", () => {
  it("exposes only the MISC settings when indicators are present", () => {
    const funnel = renderVisual({}, data).visual.viewModel.inputSettings.getFormattingModel();
    expect(cardNames(funnel)).toEqual(["canvas", "funnel", "outliers", "scatter", "lines", "x_axis", "y_axis", "download_options", "labels"]);

    const rendered = renderMisc();
    const model = rendered.visual.viewModel.inputSettings.getFormattingModel();
    expect(cardNames(model)).toEqual(["canvas", "funnel", "misc", "outliers", "scatter", "lines", "x_axis", "y_axis"]);
    const card = (name: string): Card | undefined => findBy(model.cards, "uid", `${name}_card_uid`);
    expect(sliceNames(card("misc"))).toEqual(["group", "lower", "upper", "bar_height", "unfavourable_label", "favourable_label"]);
    expect(sliceNames(card("outliers"))).toEqual([
      "improvement_direction", "process_flag_type", "three_sigma_colour_improvement", "three_sigma_colour_deterioration"
    ]);
    expect(must(card("scatter")).displayName).toBe("Bars");
    expect(sliceNames(card("scatter"))).toEqual(["colour", "opacity", "opacity_selected", "opacity_unselected"]);
    const lineSlices: string[] = [];
    const levels = ["target", "95", "99"];
    const properties = ["show", "width", "type", "colour", "opacity", "ttip_show", "ttip_label"];
    for (let i = 0; i < levels.length; i++) {
      for (let j = 0; j < properties.length; j++) {
        lineSlices.push(`${properties[j]}_${levels[i]}`);
      }
    }
    expect(sliceNames(card("lines"))).toEqual(lineSlices);
    const xAxis = must(card("x_axis"));
    expect(sliceNames({ ...xAxis, groups: xAxis.groups.slice(0, 2) })).toEqual([
      "xlimit_colour", "xlimit_ticks", "xlimit_tick_count", "xlimit_tick_font", "xlimit_tick_size", "xlimit_tick_colour"
    ]);
    expect(sliceNames({ ...xAxis, groups: xAxis.groups.slice(2) })).toEqual(expect.arrayContaining([
      "xlimit_label", "xlimit_label_font", "xlimit_label_size", "xlimit_label_colour"
    ]));
    expect(xAxis.groups).toHaveLength(3);
    expect(must(card("y_axis")).displayName).toBe("Indicator Labels");
    expect(sliceNames(card("y_axis"))).toEqual(["ylimit_tick_font", "ylimit_tick_size", "ylimit_tick_colour"]);

    rendered.visual.update({ dataViews: [buildDataView(data)], viewport: { width: 500, height: 500 }, type: 2 });
    expect(cardNames(rendered.visual.viewModel.inputSettings.getFormattingModel())).toEqual(cardNames(funnel));
  });
});
