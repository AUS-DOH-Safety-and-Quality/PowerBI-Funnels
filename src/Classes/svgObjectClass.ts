import * as d3 from "d3";

type SelectionSVG = d3.Selection<SVGElement, any, any, any>;
type SelectionSVGG = d3.Selection<SVGGElement, any, any, any>;

class svgObjectClass {
  listeningRect: SelectionSVG;
  tooltipLineGroup: SelectionSVG;
  lineGroup: SelectionSVG;
  dotGroup: SelectionSVG;
  xAxisGroup: SelectionSVGG;
  xAxisLabels: d3.Selection<SVGTextElement, any, any, any>;
  yAxisGroup: SelectionSVGG;
  yAxisLabels: d3.Selection<SVGTextElement, any, any, any>;

  constructor(svg: SelectionSVG) {
    this.tooltipLineGroup = svg.append("g");
    this.listeningRect = svg.append("g");
    this.lineGroup = svg.append("g");
    this.dotGroup = svg.append("g");
    this.xAxisGroup = svg.append("g");
    this.yAxisGroup = svg.append("g");
    
    this.xAxisLabels = svg.append("text");
    this.yAxisLabels = svg.append("text");
    
  }
}

export default svgObjectClass
