class Boxplot {
  margin = {
    top: 10, right: 40, bottom: 10, left: 40
  }

  constructor(svg, data, width = 400, height = 100) {
    this.svg = svg;
    this.data = data;
    this.width = width;
    this.height = height;
    this.handlers = {};
  }

  initialize() {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append("g");
    this.xAxis = this.svg.append("g");
    this.yAxis = this.svg.append("g");
    this.legend = this.svg.append("g");

    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleBand();

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
  }

  setData(updateData) {
    this.data = updateData;
  }

  update(category, username) {
    console.log("update box");
    this.username = username;
    this.userPos = this.data.find(d => d.username === username);
    console.log("user", this.username, this.userPos)
    this.xScale
      .domain([0, d3.max(this.data.map(d => d[category]))])
      .range([0, this.width]);

    this.yScale
      .domain(d3.range(5))
      .range([this.height, 0]);

    this.box = this.calculateQuartiles(this.data, category);

    console.log("render rect", this.box);
    this.container.selectAll("rect").remove();
    this.container.append("rect")
      .data([this.box])
      .join("rect")
      .attr("class", "box")
      .attr("x", this.xScale(this.box.q1))
      .attr("width", this.xScale(this.box.q3) - this.xScale(this.box.q1))
      .attr("y", this.yScale(2))
      .attr("height", this.yScale(2) - this.yScale(4))
      .attr("stroke", "black")
      .attr("fill", "white");

    // title
    this.container.append("text")
      .data([this.box])
      .join("text")
      .attr("transform", dim => `translate(${this.width / 2 - category.length * 7 / 2}, 0)`)
      .text(category)
      .attr("font-size", ".9rem")
    // Boxplot horizontal line
    this.container.append("rect")
      .data([this.box])
      .join("rect")
      .attr("class", "box")
      .attr("x", this.xScale(this.box.q3))
      .attr("width", this.xScale(this.box.boxMax) - this.xScale(this.box.q3))
      .attr("y", this.yScale(1))
      .attr("height", 0.1)
      .attr("stroke", "black")
      .attr("fill", "black");
    this.container.append("rect")
      .data([this.box])
      .join("rect")
      .attr("class", "box")
      .attr("x", this.xScale(this.box.boxMin))
      .attr("width", this.xScale(this.box.q1) - this.xScale(this.box.boxMin))
      .attr("y", this.yScale(1))
      .attr("height", 0.1)
      .attr("stroke", "black")
      .attr("fill", "black");
    // Boxplot min
    this.container.append("rect")
      .data([this.box])
      .join("rect")
      .attr("class", "box")
      .attr("x", d3.max([0, this.xScale(this.box.boxMin)]))
      .attr("width", 0.1)
      .attr("y", this.yScale(2))
      .attr("height", this.yScale(2) - this.yScale(4))
      .attr("stroke", "black")
      .attr("fill", "black");
    // Boxplot max
    this.container.append("rect")
      .data([this.box])
      .join("rect")
      .attr("x", d3.min([this.width, this.xScale(this.box.boxMax)]))
      .attr("width", 0.1)
      .attr("y", this.yScale(2))
      .attr("height", this.yScale(2) - this.yScale(4))
      .attr("stroke", "black")
      .attr("fill", "black");

    // Boxplot median
    this.container.append("rect")
      .data([this.box])
      .join("rect")
      .attr("x", d3.min([this.width, this.xScale(this.box.median)]))
      .attr("width", 0.1)
      .attr("y", this.yScale(2))
      .attr("height", this.yScale(2) - this.yScale(4))
      .attr("stroke", "black")
      .attr("fill", "black");

    // userPos
    if (this.userPos !== undefined) {
      this.container.append("rect")
        .data([this.box])
        .join("rect")
        .attr("x", this.xScale(this.userPos[category]))
        .attr("width", 0.1)
        .attr("y", this.yScale(2))
        .attr("height", this.yScale(2) - this.yScale(4))
        .attr("stroke", "red")
        .attr("fill", "red");
    }

    // outliers
    this.container.selectAll("circle")
      .data(this.box.outliers)
      .join("circle")
      .attr("cx", d => this.xScale(d))
      .attr("cy", d => this.yScale(1))
      .attr("fill", "black")
      .attr("opacity", 0.5)
      .attr("r", 3);
  }

  calculateQuartiles(data, key) {
    dist = []
    // split data array
    data.forEach(d => {
      dist.push(d[key]);
    });
    // sort data array
    dist.sort();

    // 데이터를 오름차순으로 정렬
    const sortedData = dist.sort((a, b) => a - b);
    const n = sortedData.length;

    // 1사분위수 (Q1)
    const q1Index = Math.floor(n * 0.25);
    const q1 = n % 2 === 0 ? (sortedData[q1Index] + sortedData[q1Index - 1]) / 2 : sortedData[q1Index];

    // 중앙값
    const medianIndex = Math.floor(n * 0.5);
    const median = sortedData[medianIndex];

    // 3사분위수 (Q3)
    const q3Index = Math.floor(n * 0.75);
    const q3 = n % 2 === 0 ? (sortedData[q3Index] + sortedData[q3Index - 1]) / 2 : sortedData[q3Index];

    // 사분위범위 (IQR)
    const iqr = q3 - q1;

    // Min Max
    const MUL = 1.5;
    let rangeMin = q1 - MUL * iqr;
    let boxMin = sortedData.find(d => rangeMin <= d)
    let rangeMax = q3 + MUL * iqr;
    let boxMax = sortedData.reverse().find(d => {
      // console.log("boxmax", d)
      return rangeMax >= d;
    });

    let outliers = sortedData.filter(d => {

      // console.log(d, boxMax, boxMin, (d > boxMax || d < boxMin));
      return (d > boxMax || d < boxMin);
    })
    console.log("outliers", outliers)
    return { q1, q3, iqr, boxMax, boxMin, median, outliers };
  }
}
