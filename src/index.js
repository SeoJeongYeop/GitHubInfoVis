let data, sliderData, brushedData, lineChart, pieChart, repoCard, repoBarChart, scatterPlot, scatterPlotDetail, boxPlot;
let selectUsername;

function updateLineChart() {
  console.log("updateLineChart");
}

function updateScatterPlot() {
  console.log("updateScatterPlot");
  let xVar = d3.select("input[type=radio][name=x-encoding]:checked").property("value");
  let yVar = d3.select("input[type=radio][name=y-encoding]:checked").property("value");
  console.log("xVar", xVar);
  console.log("yVar", yVar);

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

    let data = csvData;
    let yearRange = [...new Set(data.map(d => formatYear(d.date)))].sort();
    let usernameRange = [...new Set(data.map(d => d.username))].sort();

    selectUsername = "zypnwnqd";
    console.log("yearRange", yearRange);
    setYearDropdown(yearRange);

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

    const innerRangeData = userSumData.filter((d) => {
      // 이상치 제거
      return (
        d.commit_count < commitUpperBoundary &&
        d.issue_count < issueUpperBoundary &&
        d.pr_count < prUpperBoundary &&
        d.total_additions < additionUpperBoundary &&
        d.total_deletions < deletionUpperBoundary
      );
    });
    console.log("userSumData", userSumData);
    console.log("innerRangeData", innerRangeData);


    // d3 visualization
    scatterPlot = new Scatterplot("#scatterplot", "#sc-tooltip", userSumData);
    scatterPlotDetail = new Scatterplot("#scatterplot-detail", "#sc-tooltip", innerRangeData);
    scatterPlot.initialize();
    scatterPlotDetail.initialize();
    updateScatterPlot();
    d3.selectAll("input[type=radio][name=x-encoding]").on("change", updateScatterPlot);
    d3.selectAll("input[type=radio][name=y-encoding]").on("change", updateScatterPlot);
    d3.selectAll("#use-color").on("change", updateScatterPlot);
    //TODO slider chaining

  });

function setYearDropdown(yearRange) {
  let maxYear = Math.max(...yearRange);
  console.log("maxYear", maxYear);
  let yearDropdown = document.getElementById("btn-drop-year");
  yearDropdown.innerText = maxYear;
  let yearItem = document.getElementById("li-year");
  yearRange.forEach(year => {
    yearItem.innerHTML += `<li><button class="dropdown-item year-item">${year}</button></li>`
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
  console.log("dist", dist)

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
