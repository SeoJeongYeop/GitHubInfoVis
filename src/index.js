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
    console.log("yearRange", yearRange);
    setYearDropdown(yearRange);

    let sample = data.filter(d => d.username == "zypnwnqd");
    console.log(sample);
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
