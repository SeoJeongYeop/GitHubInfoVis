function renderRepoCards(selector, d) {
  const repoContainer = document.querySelector(selector);
  repoContainer.innerHTML +=
    `<div class="card mb-2">
    <div class="card-body overflow-hidden">
      <div class="card-title repo-header">
        <div class="fw-bold">
          ${d["repo"]}
        </div>
      </div>
      <div class="d-flex flex-column text-start">
        <div>
          <i class="bi bi-check-lg"></i> 
          Commits ${d["commit_count"]}
        </div>
        <div>
          <i class="bi bi-arrow-90deg-left"></i> 
          PRs ${d["pr_count"]}
        </div>
        <div>
          <i class="bi bi-exclamation-circle"></i>
          Issues ${d["issue_count"]}
        </div>
      </div>
    </div>
  </div>`;
}
