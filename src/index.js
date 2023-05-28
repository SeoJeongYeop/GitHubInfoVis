let totalData, data, sliderData, brushedData, lineChart, pieChart, repoCard, repoBarChart, scatterPlot, scatterPlotDetail, boxPlot;
let selectUsername, startDate;

function updateYearData(val) {
  console.log("updateYearData", val);
  console.log("data before", data.length);

  if (val === "ALL")
    data = totalData;
  else
    data = totalData.filter(d => formatYear(d.date) === String(val));
  console.log("data", data.length);
  updateVisData();
}

function getUserPeriodData() {
  data = JSON.parse(JSON.stringify(totalData));
  let start = document.getElementById("input-start").value;
  let end = document.getElementById("input-end").value;
  let userData = data.filter(obj => {
    return (obj.username === selectUsername
      && obj.date >= start
      && obj.date <= end)
  });
  return userData;
}
/**
 * 연도 변경시 모든 데이터 범위를 조정하고 차트 업데이트
 */
function updateVisData() {
  userData = getUserPeriodData();
  lineChart.setData(userData);
  updateLineChart();
  let scatterData = getScatterPlotData();
  console.log("userSumData", scatterData["userSumData"].length);
  console.log("innerRangeData", scatterData["innerRangeData"].length);

  scatterPlot.setData(scatterData["userSumData"]);
  scatterPlotDetail.setData(scatterData["innerRangeData"]);

  updateScatterPlot();
}
/**
 * 라인차트 업데이트
 */
function updateLineChart() {
  console.log("[update] LineChart");
  lineChart.update("date", "commit_count", selectUsername);
}
/**
 * 산점도 업데이트
 */
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
    totalData = JSON.parse(JSON.stringify(csvData));
    data = csvData;
    let yearRange = [...new Set(data.map(d => formatYear(d.date)))].sort();
    let usernameRange = [...new Set(data.map(d => d.username))].sort();

    selectUsername = "zypnwnqd";

    // 보조도구 설정
    setYearDropdown(yearRange.reverse());
    setUserSelect(usernameRange);
    let userData = data.filter(obj => obj.username === selectUsername);
    console.log("userData", userData.length);
    let dateRange = [...new Set(userData.map(d => d.date))].sort();
    setDateInputs(dateRange[0], dateRange[dateRange.length - 1]);
    startDate = dateRange[0];
    let intvDate = getDateDiff(dateRange[0], dateRange[dateRange.length - 1])
    console.log("intvDate", intvDate);

    setDateRangeSlider(intvDate);

    // d3 visualization
    // 1. Line Chart
    lineChart = new Linechart("#line-chart", userData);
    lineChart.initialize();
    updateLineChart();
    // 3. Scatter plot
    let scatterData = getScatterPlotData();
    scatterPlot = new Scatterplot("#scatterplot", "#sc-tooltip", scatterData["userSumData"]);
    scatterPlotDetail = new Scatterplot("#scatterplot-detail", "#sc-tooltip", scatterData["innerRangeData"]);
    scatterPlot.initialize();
    scatterPlotDetail.initialize();
    updateScatterPlot();
    d3.selectAll("input[type=radio][name=x-encoding]").on("change", updateScatterPlot);
    d3.selectAll("input[type=radio][name=y-encoding]").on("change", updateScatterPlot);
    d3.selectAll("#use-color").on("change", updateScatterPlot);
    d3.selectAll(".range-input input").on("change", updateVisData);
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

function getDayToDate(day) {
  let startDateStamp = new Date(startDate);
  let target = new Date(startDateStamp.getTime() + day * 24 * 60 * 60 * 1000);
  let yyyy = target.getFullYear();
  let mm = String(target.getMonth() + 1).padStart(2, '0');
  let dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function setDateRangeSlider(intvDate) {
  // source: mdaquibanwer/price-range-slider-with-min-max-input-price
  const rangeInputs = document.querySelectorAll(".range-input input");
  const dateStartInput = document.getElementById("input-start");
  const dateEndInput = document.getElementById("input-end");

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

      let leftPercent = (start / rangeInputs[0].max) * 100;
      let rightPercent = (end / rangeInputs[1].max) * 100;

      if (end - start < 1) {
        if (e.target.className === "range-start") {
          rangeInputs[0].value = end - 1;
          dateStartInput.value = getDayToDate(end - 1);
        }
        else if (e.target.className === "range-end") {
          rangeInputs[1].value = start + 1;
          dateEndInput.value = getDayToDate(start + 1);
        }
      } else {
        dateStartInput.value = getDayToDate(start);
        dateEndInput.value = getDayToDate(end);

        progress.style.left = leftPercent + "%";
        progress.style.right = (100 - rightPercent) + "%";
      }
    })
  });
  [dateStartInput, dateEndInput].forEach(dateInput => {
    dateInput.addEventListener("input", (e) => {
      let start = getDateDiff(startDate, dateStartInput.value);
      let end = getDateDiff(startDate, dateEndInput.value);
      let leftPercent = (start / rangeInputs[0].max) * 100;
      let rightPercent = (end / rangeInputs[1].max) * 100;
      if (start < 0) {
        rangeInputs[0].value = rangeInputs[0].min;
        progress.style.left = rangeInputs[0].min / rangeInputs[0].max + "%";
      }
      else if (end > rangeInputs[1].max) {
        rangeInputs[1].value = rangeInputs[1].max;
        progress.style.right = rangeInputs[1].max / rangeInputs[1].max + "%";
      }
      else if (end - start < 1) {
        if (e.target.id === "input-start") {
          rangeInputs[0].value = end - 1;
          progress.style.left = ((end - 1) / rangeInputs[0].max) * 100 + "%";
        }
        else if (e.target.id === "input-end") {
          rangeInputs[1].value = start + 1;
          progress.style.right = (100 - ((start + 1) / rangeInputs[1].max) * 100) + "%";
        }
      } else {
        rangeInputs[0].value = start;
        rangeInputs[1].value = end;
        progress.style.left = leftPercent + "%";
        progress.style.right = (100 - rightPercent) + "%";
      }
    });
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
  let start = document.getElementById("input-start").value;
  let end = document.getElementById("input-end").value;
  const userSumObj = {};
  data = JSON.parse(JSON.stringify(totalData));
  data.forEach((d) => {
    if (start < d.date && d.date < end) {
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
    }
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
