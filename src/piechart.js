class Piechart {
  margin = {
    top: 40, right: 180, bottom: 40, left: 40
  }

  preprocess() {
    this.data.forEach(d => d.contr = d.commit_count + d.issue_count + d.pr_count);
    this.data.sort((a, b) => b.contr - a.contr);
    // 리포지토리가 많을 때 상위 6개 슬라이싱하고 나머지 합치기
    if (this.data.length > 6) {
      let etc = this.data.slice(6, this.data.length)
      let etcObj = JSON.parse(JSON.stringify(this.data[0]));
      etcObj.repo = `other ${etc.length} repo`, etcObj.commit_count = 0, etcObj.pr_count = 0, etcObj.issue_count = 0, etcObj.total_additions = 0, etcObj.total_deletions = 0;
      etc.forEach(obj => {
        etcObj.commit_count += obj.commit_count;
        etcObj.pr_count += obj.pr_count;
        etcObj.issue_count += obj.issue_count;
        etcObj.total_additions += obj.total_additions;
        etcObj.total_deletions += obj.total_deletions;
      })
      this.data = this.data.slice(0, 6);
      this.data.push(etcObj);
    }
  }

  constructor(svg, data, width = 150, height = 150) {
    this.svg = svg;
    this.data = data;
    this.width = width;
    this.height = height;
    this.radius = width / 2;
    this.preprocess();
  }

  setData(data) {
    this.data = data;
    this.preprocess();
  }

  initialize() {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append('g');
    this.legend = this.svg.append('g');
    this.zScale = d3.scaleOrdinal().range(d3.schemeCategory10);
    this.svg
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.container.attr('transform', `translate(${this.margin.left + this.radius}, ${this.margin.top + this.radius})`);
  }
  update(category, value, username) {
    this.username = username;
    this.zScale.domain([...new Set(this.data.map(d => d[category]))]);

    this.pie = d3.pie()
      .value(d => d[value]);
    this.arc = d3.arc()
      .innerRadius(0)
      .outerRadius(this.radius);
    this.pieData = this.pie(this.data);

    this.container.selectAll("path")
      .data(this.pieData)
      .join("path")
      .transition()
      .attr("d", this.arc)
      .attr("fill", d => this.zScale(d.data[category]));

    // legend 추가
    this.legend
      .style("display", "inline")
      .style("font-size", ".6rem")
      .attr("transform", `translate(${this.width + this.margin.left + 10}, ${this.height / 3})`)
      .call(d3.legendColor().scale(this.zScale));
  }
}
