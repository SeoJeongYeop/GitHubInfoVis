let totalData, data, sliderData, brushedData, lineChart, pieChart, repoCard, repoBarCharts, scatterPlot, scatterPlotDetail, boxPlot;
let selectUsername = "zypnwnqd", startDate;
// selectUsername의 초기설정은 로그인 사용자로 가정
function updateYearData(val) {
  console.log("updateYearData", val);
  console.log("data before", data.length);

  if (val === "ALL")
    data = JSON.parse(JSON.stringify(totalData));
  else {
    data = JSON.parse(JSON.stringify(totalData));
    console.log("else", data[0].date, typeof (data[0].date));
    data = data.filter(d => formatYear(d.date) === String(val));
  }
  if (data.length === 0) {
    alert("해당 연도에는 데이터가 없습니다.");
    return;
  }
  console.log("data", data.length, "val", val);
  let userData = data.filter(obj => obj.username === selectUsername);
  let repoData = getUserRepoSum(userData);
  userData = getUserDateSum(userData);
  let dateRange = [...new Set(userData.map(d => d.date))].sort();
  setDateInputs(dateRange[0], dateRange[dateRange.length - 1]);
  startDate = dateRange[0];
  let intvDate = getDateDiff(dateRange[0], dateRange[dateRange.length - 1])
  console.log("intvDate", intvDate);
  const progress = document.getElementsByClassName("progress")[0];
  progress.style.left = "0%";
  progress.style.right = "0%";
  setDateRangeSlider(intvDate);

  updateVisData();
}
function getUserDateSum(userData) {
  const dateSumObj = {};
  userData.forEach((d) => {
    if (!dateSumObj[d.date]) {
      dateSumObj[d.date] = {
        username: d.username,
        commit_count: 0,
        issue_count: 0,
        pr_count: 0,
        total_additions: 0,
        total_deletions: 0,
        date: d.date
      };
    }
    dateSumObj[d.date].commit_count += d.commit_count;
    dateSumObj[d.date].issue_count += d.issue_count;
    dateSumObj[d.date].pr_count += d.pr_count;
    dateSumObj[d.date].total_additions += d.total_additions;
    dateSumObj[d.date].total_deletions += d.total_deletions;
  });
  return [...Object.values(dateSumObj)];
}
function getUserRepoSum(userData) {
  const repoSumObj = {};

  userData.forEach((d) => {
    let repo = `${d.repo_owner}/${d.repo_name}`;

    if (!repoSumObj[repo]) {
      repoSumObj[repo] = {
        username: d.username,
        repo_owner: d.repo_owner,
        repo_name: d.repo_name,
        repo: `${d.repo_owner}/${d.repo_name}`,
        commit_count: 0,
        issue_count: 0,
        pr_count: 0,
        total_additions: 0,
        total_deletions: 0,
        contr: 0
      };
    }
    repoSumObj[repo].commit_count += d.commit_count;
    repoSumObj[repo].issue_count += d.issue_count;
    repoSumObj[repo].pr_count += d.pr_count;
    repoSumObj[repo].total_additions += d.total_additions;
    repoSumObj[repo].total_deletions += d.total_deletions;
  });
  return [...Object.values(repoSumObj)];
}

function fillZeroUserPeriodData(start, end, userData) {
  userData.sort((a, b) => {
    if (a.date < b.date) return -1;
    else return 1;
  });
  const startDate = new Date(start);
  const endDate = new Date(end);
  const currentDate = new Date(startDate);
  let offset = 0;
  let cnt = 0;
  while (currentDate <= endDate) {
    cnt += 1;
    let cur = currentDate.toISOString().split('T')[0];
    if (cur === userData[offset].date) {
      currentDate.setDate(currentDate.getDate() + 1);
      offset += 1;
    }
    else {
      let temp = JSON.parse(JSON.stringify(userData[offset]));
      temp.repo_name = "", temp.date = cur;
      temp.commit_count = 0, temp.issue_count = 0, temp.pr_count = 0, temp.total_additions = 0, temp.total_deletions = 0;
      userData.push(temp);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  console.log("fillZeroUserPeriodData", cnt, offset, userData.length);
  return userData;
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
  if (userData.length === 0) {
    alert("해당 기간에 유저의 기여내역이 없습니다.");
    return;
  }
  let repoData = getUserRepoSum(userData);
  userData = getUserDateSum(userData);
  userData = fillZeroUserPeriodData(start, end, userData)
  return { "user": userData, "repo": repoData };
}
/**
 * 연도 변경시 모든 데이터 범위를 조정하고 차트 업데이트
 */
function updateVisData() {
  let userPeriodData = getUserPeriodData();
  let userData = userPeriodData['user'];
  let repoData = userPeriodData['repo'];

  // 1. line chart
  lineChart.setData(userData);
  updateLineChart();
  // 2. repo chart
  pieChart.setData(repoData);
  updatePieChart();
  let repoBestData = repoData.slice(0, 5);
  for (let i = 0; i < 5; i++) {
    let obj = null;
    if (repoBestData.length > i) obj = repoBestData[i];
    renderRepoCards(`#repo-info-${i + 1} div`, obj);
    updateBarChart(repoBarCharts[i], obj);
  }

  // 3. scatter chart
  let scatterData = getScatterPlotData();
  console.log("userSumData", scatterData["userSumData"].length);
  console.log("innerRangeData", scatterData["innerRangeData"].length);
  scatterPlot.setData(scatterData["userSumData"]);
  scatterPlotDetail.setData(scatterData["innerRangeData"]);
  updateScatterPlot();
  // 4. boxplot
  let keys = ["commit_count", "pr_count", "issue_count", "total_additions", "total_deletions"];
  keys.forEach((key, i) => {
    boxPlots[i].setData(scatterData["userSumData"]);
    updateBoxPlot(boxPlots[i], key);
  });
}
/**
 * 라인차트 업데이트
 */
function updateLineChart() {
  lineChart.update("date", ["commit_count", "issue_count", "pr_count"], selectUsername);
}
/**
 * 파이차트 업데이트
 */
function updatePieChart() {
  pieChart.update("repo", "contr", selectUsername);
}
/**
 * Repo bar 차트 업데이트
 */
function updateBarChart(chart, repoObj) {
  if (repoObj === null)
    chart.delete();
  else
    chart.update(repoObj, ["total_additions", "total_deletions"], selectUsername);
}
/**
 * 산점도 업데이트
 */
function updateScatterPlot() {
  let xVar = d3.select("input[type=radio][name=x-encoding]:checked").property("value");
  let yVar = d3.select("input[type=radio][name=y-encoding]:checked").property("value");
  scatterPlot.update(xVar, yVar, selectUsername);
  scatterPlotDetail.update(xVar, yVar, selectUsername);
}
/**
 * 박스플롯 업데이트
 */
function updateBoxPlot(chart, key) {
  chart.update(key, selectUsername);
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

    // 보조도구 설정
    setYearDropdown(yearRange.reverse());
    setUserSelect(usernameRange);
    let userData = data.filter(obj => obj.username === selectUsername);
    let dateRange = [...new Set(userData.map(d => d.date))].sort();
    setDateInputs(dateRange[0], dateRange[dateRange.length - 1]);
    startDate = dateRange[0];
    let intvDate = getDateDiff(dateRange[0], dateRange[dateRange.length - 1])
    let repoData = getUserRepoSum(userData);
    userData = getUserDateSum(userData);
    userData = fillZeroUserPeriodData(dateRange[0], dateRange[dateRange.length - 1], userData)
    setDateRangeSlider(intvDate);

    // d3 visualization
    // 1. Line Chart
    lineChart = new Linechart("#line-chart", userData);
    lineChart.initialize();
    updateLineChart();
    // 2. Repo Chart
    pieChart = new Piechart("#pie-chart", "#pie-tooltip", repoData);
    pieChart.initialize();
    let repoBestData = repoData.slice(0, 5);
    updatePieChart();
    repoBarCharts = repoBestData.map((obj, i) => {
      renderRepoCards(`#repo-info-${i + 1} div`, obj);
      repoBarChart = new RepoBarchart(`#repo-info-${i + 1} svg`);
      repoBarChart.initialize();
      updateBarChart(repoBarChart, obj);
      return repoBarChart;
    });

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

    scatterPlot.on("brush", (brushedItems) => {
      if (brushedItems.length !== 0)
        brushedData = brushedItems;
      else
        brushedData = scatterData["userSumData"];
      let keys = ["commit_count", "pr_count", "issue_count", "total_additions", "total_deletions"];
      keys.forEach((key, i) => {
        boxPlots[i].setData(brushedData);
        updateBoxPlot(boxPlots[i], key);
      });
    });

    scatterPlotDetail.on("brush", (brushedItems) => {
      if (brushedItems.length !== 0)
        brushedData = brushedItems;
      else
        brushedData = scatterData["userSumData"];
      let keys = ["commit_count", "pr_count", "issue_count", "total_additions", "total_deletions"];
      keys.forEach((key, i) => {
        boxPlots[i].setData(brushedData);
        updateBoxPlot(boxPlots[i], key);
      });
    });

    //4. Box plot
    boxPlots = []
    let keys = ["commit_count", "pr_count", "issue_count", "total_additions", "total_deletions"];
    keys.forEach(key => {
      let boxPlot = new Boxplot(`#boxplot-${key}`, scatterData["userSumData"]);
      boxPlot.initialize();
      updateBoxPlot(boxPlot, key);
      boxPlots.push(boxPlot);
    });
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
  }
  updateYearData(val);
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
    if (selectUsername === username)
      userSelect.innerHTML += `<option value="${username}" selected>${username}</option>`;
    else userSelect.innerHTML += `<option value="${username}">${username}</option>`;
  });

  new SlimSelect({
    select: "#user-select",
    events: {
      afterChange: (newVal) => {
        console.log("newVal", newVal)
        selectUsername = newVal[0].value;
        let yearBtn = document.getElementById("btn-drop-year");
        console.log(yearBtn.innerText, selectUsername);
        setYear(yearBtn.innerText);
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
  // console.log(commitUpperBoundary, issueQuartiles, prQuartiles);
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
