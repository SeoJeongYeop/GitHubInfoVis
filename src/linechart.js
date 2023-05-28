class Linechart {
  margin = {
    top: 10, right: 100, bottom: 40, left: 40
  }
  parseTime = d3.timeParse("%Y-%m-%d");

  constructor(svg, data, width = 400, height = 300) {
    this.svg = svg;
    this.data = data;
    this.width = width;
    this.height = height;
    this.handlers = {};
    this.data.forEach(d => d.date = this.parseTime(d.date));
    this.data.sort((a, b) => a.date - b.date);
  }

  setData(data) {
    this.data = data;
    this.data.forEach(d => d.date = this.parseTime(d.date));
    this.data.sort((a, b) => a.date - b.date);
  }

  initialize() {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append('g');
    this.xAxis = this.svg.append('g');
    this.yAxis = this.svg.append('g');
    this.legend = this.svg.append('g');
    this.xScale = d3.scaleTime();
    this.yScale = d3.scaleLinear();
    this.svg
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.container.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }

  update(xVar, yVar, username) {
    console.log("update linechart", this.data.length)
    this.username = username;
    this.xScale.domain(d3.extent(this.data, d => d[xVar])).range([0, this.width]);
    this.yScale.domain(d3.extent(this.data, d => d[yVar])).range([this.height, 0]);

    // X축 생성
    this.xAxis
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .attr("font-size", "0.5rem")
      .transition()
      .call(d3.axisBottom(this.xScale));

    // Y축 생성
    this.yAxis
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
      .attr("font-size", "0.5rem")
      .transition()
      .call(d3.axisLeft(this.yScale).tickFormat(d3.format(".2s")));

    // 라인 생성
    this.line = d3.line()
      .x(d => this.xScale(d[xVar]))
      .y(d => this.yScale(d[yVar]));

    this.container.selectAll("path")
      .data([this.data])
      .join("path")
      .attr("class", "line")
      .attr("d", this.line)
      .style("fill", "none")
      .style("stroke", "blue");
  }
}
