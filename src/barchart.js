class RepoBarchart {
  margin = {
    top: 10, right: 10, bottom: 40, left: 40
  }

  constructor(svg, width = 250, height = 120) {
    this.svg = svg;
    this.width = width;
    this.height = height;
  }

  initialize() {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append("g");
    this.xAxis = this.svg.append("g");
    this.yAxis = this.svg.append("g");
    this.legend = this.svg.append("g");

    this.xScale = d3.scaleBand();
    this.yScale = d3.scaleLinear();
    this.zScale = d3.scaleOrdinal().range(d3.schemePastel1);

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
  }

  update(data, xVars, username) {
    const categories = [...new Set(xVars)]
    this.username = username;
    this.xScale.domain(categories).range([0, this.width]).padding(0.3);
    this.yScale.domain([0, d3.max(categories.map(c => data[c]))]).range([this.height, 0]);

    this.container.selectAll("rect")
      .data(categories)
      .join("rect")
      .attr("x", d => this.xScale(d))
      .attr("y", d => this.yScale(data[d]))
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => this.height - this.yScale(data[d]))
      .attr("fill", d => this.zScale(d));

    this.xAxis
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .call(d3.axisBottom(this.xScale));

    this.yAxis
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3.axisLeft(this.yScale));
  }
}