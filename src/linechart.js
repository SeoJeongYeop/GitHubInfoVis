class Linechart {
  margin = {
    top: 40, right: 100, bottom: 40, left: 40
  }
  parseTime = d3.timeParse("%Y-%m-%d");

  constructor(svg, data, width = 450, height = 300) {
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
    this.zScale = d3.scaleOrdinal().range(d3.schemeCategory10)
    this.svg
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.container.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }
  update(xVar, yVars, username) {
    if (typeof yVars === "string")
      yVars = [yVars];
    console.log("update linechart", this.data.length)
    this.username = username;
    this.xScale.domain(d3.extent(this.data, d => d[xVar])).range([0, this.width]);
    this.yScales = (d) => {
      let maxVar = 0;
      yVars.forEach((v) => {
        if (d[v] > maxVar) {
          maxVar = d[v];
        }
      });
      return maxVar;
    };
    this.yScale.domain(d3.extent(this.data, d => this.yScales(d))).range([this.height, 0]);
    this.zScale.domain(yVars);

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

    // yVar에 따라 달라지는 line 함수
    this.lines = (v) => {
      return d3.line()
        .x(d => this.xScale(d[xVar]))
        .y(d => this.yScale(d[v]));
    }
    // 라인 삭제 후 다시 추가
    this.container.selectAll("path").remove();
    yVars.forEach(v => {
      this.container.append("path")
        .datum(this.data)
        .attr("d", this.lines(v))
        .attr("fill", "none")
        .attr("stroke", this.zScale(v));
    });
    // legend 추가
    this.legend
      .style("display", "inline")
      .style("font-size", ".6em")
      .attr("transform", `translate(${this.width + this.margin.left + 10}, ${this.height / 4})`)
      .call(d3.legendColor().scale(this.zScale));
  }
}
