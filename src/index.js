let totalData, data, sliderData, brushedData, lineChart, pieChart, repoCard, repoBarChart, scatterPlot, scatterPlotDetail, boxPlot;
let selectUsername;

function updateYearData(val) {
  console.log("updateYearData", val);
  console.log("data before", data.length);

  if (val === "ALL") {
    data = totalData;
  }
  else {
    data = totalData.filter(d => {
      return formatYear(d.date) === String(val);
    });
  }
  console.log("data", data.length);

  updateVisData();
}

function updateVisData() {
  updateLineChart();
  let scatterData = getScatterPlotData();
  console.log("userSumData", scatterData["userSumData"].length);
  console.log("innerRangeData", scatterData["innerRangeData"].length);

  scatterPlot.setData(scatterData["userSumData"]);
  scatterPlotDetail.setData(scatterData["innerRangeData"]);

  updateScatterPlot();
}
function updateLineChart() {
  console.log("[update] LineChart");
}

function updateScatterPlot() {
  console.log("[update] ScatterPlot");
  let xVar = d3.select("input[type=radio][name=x-encoding]:checked").property("value");
  let yVar = d3.select("input[type=radio][name=y-encoding]:checked").property("value");
  scatterPlot.update(xVar, yVar, selectUsername);
  scatterPlotDetail.update(xVar, yVar, selectUsername);
}

let parseDate = (dateStr) => Date.parse(dateStr);
let formatYear = (date) => date.slice(0, 4);

d3.csv("https://raw.githubusercontent.com/SeoJeongYeop/GitHubInfoVis/main/github_repo_history.csv")
  .then(csvData => {
    csvData.forEach(d => {
      d["total_additions"] = parseInt(d["total_additions"]);
      d["total_deletions"] = parseInt(d["total_deletions"]);
      d["commit_count"] = parseInt(d["commit_count"]);
      d["pr_count"] = parseInt(d["pr_count"]);
      d["issue_count"] = parseInt(d["issue_count"]);
    });
    totalData = csvData;
    data = csvData;
    let dateRange = [...new Set(data.map(d => d.date))].sort();
    let yearRange = [...new Set(data.map(d => formatYear(d.date)))].sort();
    let usernameRange = [...new Set(data.map(d => d.username))].sort();

    selectUsername = "zypnwnqd";

    // 보조도구 설정
    setDateInputs(dateRange[0], dateRange[dateRange.length - 1]);
    let intvDate = getDateDiff(dateRange[0], dateRange[dateRange.length - 1])
    console.log("intvDate", intvDate);

    setYearDropdown(yearRange.reverse());
    setUserSelect(usernameRange);
    setDateRangeSlider(intvDate);

    let scatterData = getScatterPlotData();

    // d3 visualization
    scatterPlot = new Scatterplot("#scatterplot", "#sc-tooltip", scatterData["userSumData"]);
    scatterPlotDetail = new Scatterplot("#scatterplot-detail", "#sc-tooltip", scatterData["innerRangeData"]);
    scatterPlot.initialize();
    scatterPlotDetail.initialize();
    updateScatterPlot();
    d3.selectAll("input[type=radio][name=x-encoding]").on("change", updateScatterPlot);
    d3.selectAll("input[type=radio][name=y-encoding]").on("change", updateScatterPlot);
    d3.selectAll("#use-color").on("change", updateScatterPlot);
    //TODO slider chaining
  });

function setDateInputs(minDate, maxDate) {
  console.log("minDate", minDate, "maxDate", maxDate)
  let inputStart = document.getElementById("input-start");
  let inputEnd = document.getElementById("input-end");
  inputStart.value = minDate;
  inputStart.min = minDate;
  inputStart.max = maxDate;

  inputEnd.value = maxDate;
  inputEnd.min = minDate;
  inputEnd.max = maxDate;
  inputStart.addEventListener("input", () => {
    if (inputStart.value > inputEnd.value) {
      inputStart.value = inputEnd.value;
    }
  });
  inputEnd.addEventListener("input", () => {
    if (inputStart.value > inputEnd.value) {
      inputEnd.value = inputStart.value;
    }
  });
}

function getDateDiff(start, end) {
  let s = new Date(start);
  let e = new Date(end);
  let timeDiff = e.getTime() - s.getTime();
  let dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return dayDiff;
}

function setYearDropdown(yearRange) {
  let yearItem = document.getElementById("li-year");
  yearRange.forEach(year => {
    yearItem.innerHTML += `<li><button class="dropdown-item year-item" onclick="setYear(${year});">${year}</button></li>`
  });
}
function setYear(val) {
  let yearDropdown = document.getElementById("btn-drop-year");
  if (yearDropdown.innerText !== String(val)) {
    console.log("setYear");
    yearDropdown.innerText = val;
    updateYearData(val);
  }
}
function setDateRangeSlider(intvDate) {
  // source: mdaquibanwer/price-range-slider-with-min-max-input-price
  const rangeInputs = document.querySelectorAll(".range-input input");
  rangeInputs[0].min = 0;
  rangeInputs[0].max = intvDate;
  rangeInputs[0].value = 0;
  rangeInputs[1].min = 0;
  rangeInputs[1].max = intvDate;
  rangeInputs[1].value = intvDate;

  const progress = document.getElementsByClassName("progress")[0];
  rangeInputs.forEach(range => {
    range.addEventListener("input", (e) => {
      let start = parseInt(rangeInputs[0].value);
      let end = parseInt(rangeInputs[1].value);
      console.log("start", start, "end", end);

      let leftPercent = (start / rangeInputs[0].max) * 100;
      let rightPercent = (end / rangeInputs[1].max) * 100;

      if (end - start < 1) {
        if (e.target.className === "range-start")
          rangeInputs[0].value = end - 1;
        else if (e.target.className === "range-end")
          rangeInputs[1].value = start + 1;
      } else {
        progress.style.left = leftPercent + "%";
        progress.style.right = (100 - rightPercent) + "%";
      }
    })
  })
}

function setUserSelect(usernameRange) {
  let userSelect = document.getElementById("user-select");
  usernameRange.forEach((username) => {
    userSelect.innerHTML += `<option value="${username}">${username}</option>`;
  });

  new SlimSelect({
    select: "#user-select",
    events: {
      afterChange: (newVal) => {
        console.log(newVal)
        selectUsername = newVal;
      }
    }
  })
}

function calculateQuartiles(data, key) {
  dist = []
  // split data array
  data.forEach(d => {
    dist.push(d[key]);
  });
  // sort data array
  dist.sort();
  // console.log("dist", dist)

  // 데이터를 오름차순으로 정렬
  const sortedData = dist.sort((a, b) => a - b);
  const n = sortedData.length;

  // 1사분위수 (Q1)
  const q1Index = Math.floor(n * 0.25);
  const q1 = n % 2 === 0 ? (sortedData[q1Index] + sortedData[q1Index - 1]) / 2 : sortedData[q1Index];

  // 3사분위수 (Q3)
  const q3Index = Math.floor(n * 0.75);
  const q3 = n % 2 === 0 ? (sortedData[q3Index] + sortedData[q3Index - 1]) / 2 : sortedData[q3Index];

  // 사분위범위 (IQR)
  const iqr = q3 - q1;

  return { q1, q3, iqr };
}

function getScatterPlotData() {
  const userSumObj = {};
  data.forEach((d) => {
    if (!userSumObj[d.username]) {
      userSumObj[d.username] = {
        username: d.username,
        commit_count: 0,
        issue_count: 0,
        pr_count: 0,
        total_additions: 0,
        total_deletions: 0,
      };
    }
    userSumObj[d.username].commit_count += d.commit_count;
    userSumObj[d.username].issue_count += d.issue_count;
    userSumObj[d.username].pr_count += d.pr_count;
    userSumObj[d.username].total_additions += d.total_additions;
    userSumObj[d.username].total_deletions += d.total_deletions;
  });
  const MUL = 1.5;
  const userSumData = [...Object.values(userSumObj)];
  commitQuartiles = calculateQuartiles(userSumData, "commit_count");
  let commitUpperBoundary = commitQuartiles.q3 + MUL * commitQuartiles.iqr;
  issueQuartiles = calculateQuartiles(userSumData, "issue_count");
  let issueUpperBoundary = issueQuartiles.q3 + MUL * issueQuartiles.iqr
  prQuartiles = calculateQuartiles(userSumData, "pr_count");
  let prUpperBoundary = prQuartiles.q3 + MUL * prQuartiles.iqr
  additionQuartiles = calculateQuartiles(userSumData, "total_additions");
  let additionUpperBoundary = additionQuartiles.q3 + MUL * additionQuartiles.iqr
  deletionQuartiles = calculateQuartiles(userSumData, "total_deletions");
  let deletionUpperBoundary = deletionQuartiles.q3 + MUL * deletionQuartiles.iqr
  console.log(commitUpperBoundary, issueQuartiles, prQuartiles);
  const innerRangeData = userSumData.filter((d) => {
    // 이상치 제거
    return (
      d.commit_count <= commitUpperBoundary &&
      d.issue_count <= issueUpperBoundary &&
      d.pr_count <= prUpperBoundary &&
      d.total_additions <= additionUpperBoundary &&
      d.total_deletions <= deletionUpperBoundary
    );
  });

  return { "userSumData": userSumData, "innerRangeData": innerRangeData }
}
