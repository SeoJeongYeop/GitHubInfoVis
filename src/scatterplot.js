class Scatterplot {
  margin = {
    top: 10, right: 10, bottom: 30, left: 30
  }

  constructor(svg, tooltip, data, width = 360, height = 360) {
    this.svg = svg;
    this.tooltip = tooltip;
    this.data = data;
    this.width = width;
    this.height = height;
    this.handlers = {};
  }

  initialize() {
    this.svg = d3.select(this.svg);
    this.tooltip = d3.select(this.tooltip);
    this.container = this.svg.append("g");
    this.xAxis = this.svg.append("g");
    this.yAxis = this.svg.append("g");
    this.legend = this.svg.append("g");

    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.zScale = d3.scaleOrdinal().range(d3.schemeCategory10)

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

    this.brush = d3.brush()
      .extent([[0, 0], [this.width, this.height]])
      .on("start brush", (event) => {
        this.brushCircles(event);
      })
  }
  setData(updateData) {
    this.data = updateData;
  }

  update(xVar, yVar, username) {
    this.xVar = xVar;
    this.yVar = yVar;
    this.username = username;
    this.xScale.domain(d3.extent(this.data, d => d[xVar])).range([0, this.width]);
    this.yScale.domain(d3.extent(this.data, d => d[yVar])).range([this.height, 0]);
    this.zScale.domain([...new Set(this.data.map(d => d.username === this.username))]);

    this.container.call(this.brush);
    this.circles = this.container.selectAll("circle")
      .data(this.data)
      .join("circle")
      .on("mouseover", (e, d) => {
        this.tooltip.select(".tooltip-inner")
          .html(`${d.username}
          <br />${this.xVar}: ${d[this.xVar]}
          <br />${this.yVar}: ${d[this.yVar]}`);

        Popper.createPopper(e.target, this.tooltip.node(), {
          placement: 'top',
          modifiers: [
            {
              name: 'arrow',
              options: {
                element: this.tooltip.select(".tooltip-arrow").node(),
              },
            },
          ],
        });
        this.tooltip.style("display", "block");
      })
      .on("mouseout", (d) => {
        this.tooltip.style("display", "none");
      });

    this.circles
      .transition()
      .attr("cx", d => this.xScale(d[xVar]))
      .attr("cy", d => this.yScale(d[yVar]))
      .attr("fill", d => this.zScale(d.username === this.username))
      .attr("r", 4)
      .attr("opacity", d => {
        if (d.username === this.username) return 1;
        else return 0.5;
      });
    // 유저의 원을 raise로 맨 앞으로 이동
    this.circles
      .filter(d => d.username === this.username)
      .raise();

    this.xAxis
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .transition()
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format(".2s")));

    this.yAxis
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
      .transition()
      .call(d3.axisLeft(this.yScale).tickFormat(d3.format(".2s")));
  }

  isBrushed(d, selection) {
    let [[x0, y0], [x1, y1]] = selection; // destructuring assignment
    let x = this.xScale(d[this.xVar]);
    let y = this.yScale(d[this.yVar]);

    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  // this method will be called each time the brush is updated.
  brushCircles(event) {
    let selection = event.selection;

    this.circles.classed("brushed", d => this.isBrushed(d, selection));

    if (this.handlers.brush)
      this.handlers.brush(this.data.filter(d => this.isBrushed(d, selection)));
  }

  on(eventType, handler) {
    this.handlers[eventType] = handler;
  }

  removeSelection() {
    d3.selectAll("rect.selection").remove();
  }
}