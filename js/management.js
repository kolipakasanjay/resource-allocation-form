/**
 * PMIPCC Portfolios & Persons Directory Management
 * Supports Add, Update, Delete, and Status toggling (Active, Inactive)
 */

(function () {
  let activeTab = "portfolios";
  let currentPortfolioFilter = "all";
  let currentPeopleStatusFilter = "all";
  let currentPeoplePortfolioFilter = "all";

  let editingPortfolioId = null;
  let editingPersonId = null;

  function initManagement() {
    setupTabSwitching();
    setupPortfolioFilters();
    setupPeopleFilters();
    setupModals();
    renderPortfoliosTable();
    renderPeopleTable();
    updateSummaryStats();

    window.addEventListener("app:portfolios-changed", () => {
      renderPortfoliosTable();
      renderPeopleTable();
      populatePortfolioSelectsInModals();
      updateSummaryStats();
    });

    window.addEventListener("app:people-changed", () => {
      renderPeopleTable();
      renderPortfoliosTable();
      updateSummaryStats();
    });
  }

  /* ========================================================
     TAB SWITCHING
     ======================================================== */
  function switchToPortfoliosTab() {
    activeTab = "portfolios";
    const tabPortfolios = document.getElementById("tab-manage-portfolios");
    const tabPeople = document.getElementById("tab-manage-people");
    const viewPortfolios = document.getElementById("manage-portfolios-view");
    const viewPeople = document.getElementById("manage-people-view");

    if (tabPortfolios) tabPortfolios.classList.add("active");
    if (tabPeople) tabPeople.classList.remove("active");
    if (viewPortfolios) viewPortfolios.style.display = "block";
    if (viewPeople) viewPeople.style.display = "none";
    renderPortfoliosTable();
    updateSummaryStats();
  }

  function switchToPeopleTab() {
    activeTab = "people";
    const tabPortfolios = document.getElementById("tab-manage-portfolios");
    const tabPeople = document.getElementById("tab-manage-people");
    const viewPortfolios = document.getElementById("manage-portfolios-view");
    const viewPeople = document.getElementById("manage-people-view");

    if (tabPeople) tabPeople.classList.add("active");
    if (tabPortfolios) tabPortfolios.classList.remove("active");
    if (viewPeople) viewPeople.style.display = "block";
    if (viewPortfolios) viewPortfolios.style.display = "none";
    renderPeopleTable();
    updateSummaryStats();
  }

  function setupTabSwitching() {
    const tabPortfolios = document.getElementById("tab-manage-portfolios");
    const tabPeople = document.getElementById("tab-manage-people");

    if (tabPortfolios) {
      tabPortfolios.addEventListener("click", () => {
        switchToPortfoliosTab();
      });
    }

    if (tabPeople) {
      tabPeople.addEventListener("click", () => {
        switchToPeopleTab();
      });
    }
  }

  /* ========================================================
     PORTFOLIOS TABLE & CRUD
     ======================================================== */
  function setupPortfolioFilters() {
    const filterSelect = document.getElementById("portfolio-status-filter");
    const searchInput = document.getElementById("portfolio-search-input");
    const addBtn = document.getElementById("btn-add-portfolio");

    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        currentPortfolioFilter = e.target.value;
        renderPortfoliosTable();
        updateSummaryStats();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderPortfoliosTable();
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        openPortfolioModal();
      });
    }
  }

  function renderPortfoliosTable() {
    const tbody = document.getElementById("portfolios-table-body");
    const searchInput = document.getElementById("portfolio-search-input");
    if (!tbody) return;

    let list = window.AppState.getPortfolios(currentPortfolioFilter);
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (query) {
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.leadPersonName && p.leadPersonName.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    if (list.length === 0) {
      const isInactiveOnly = currentPortfolioFilter === "inactive";
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 3rem 1.5rem; text-align: center;">
            <div style="max-width: 360px; margin: 0 auto; color: var(--text-muted);">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--surface-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; color: var(--text-muted); border: 1px dashed var(--border-medium);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--pmi-dark); margin-bottom: 0.25rem;">
                ${isInactiveOnly ? "No Inactive Portfolios Found" : "No Portfolios Found"}
              </div>
              <div style="font-size: 0.775rem; line-height: 1.45;">
                ${isInactiveOnly 
                  ? "All chapter portfolios are currently active. You can toggle any portfolio to 'Inactive' using the status dropdown in the table." 
                  : "No portfolios match your current search query or status filter."}
              </div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const allPeople = window.AppState.getPeople();

    tbody.innerHTML = list.map(portfolio => {
      const assignedPeople = allPeople.filter(p => p.portfolioId === portfolio.id);
      const lead = portfolio.leadPersonName || (assignedPeople[0] ? assignedPeople[0].name : "Unassigned");
      const initials = getInitials(lead);

      return `
        <tr>
          <td>
            <span class="portfolio-code-badge">
              ${escapeHtml(portfolio.code || "PCC")}
            </span>
          </td>
          <td>
            <div class="portfolio-info-cell">
              <div class="portfolio-info-name">
                <span>${escapeHtml(portfolio.name)}</span>
              </div>
              <div class="portfolio-info-desc">
                ${escapeHtml(portfolio.description || "Designated chapter executive portfolio.")}
              </div>
            </div>
          </td>
          <td>
            <div class="portfolio-lead-cell">
              <div class="portfolio-lead-avatar">${escapeHtml(initials)}</div>
              <div class="portfolio-lead-meta">
                <span class="portfolio-lead-name">${escapeHtml(lead)}</span>
                <span class="portfolio-lead-count">${assignedPeople.length > 0 ? `${assignedPeople.length} person(s) mapped` : "Chapter Wide"}</span>
              </div>
            </div>
          </td>
          <td style="white-space: nowrap; width: 145px;">
            <!-- Status Changer -->
            <select class="table-status-select ${portfolio.status === 'active' ? 'status-active' : 'status-inactive'} portfolio-status-select" data-id="${portfolio.id}" aria-label="Portfolio Status">
              <option value="active" ${portfolio.status === "active" ? "selected" : ""}>● Active</option>
              <option value="inactive" ${portfolio.status === "inactive" ? "selected" : ""}>○ Inactive</option>
            </select>
          </td>
          <td>
            <div class="portfolio-date-cell">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${portfolio.createdAt ? new Date(portfolio.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Official Chapter"}</span>
            </div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div class="portfolio-actions-cell" style="justify-content: flex-end; gap: 0.35rem;">
              <button type="button" class="btn-tbl-action add-action btn-add-person-to-port" data-portfolio-id="${portfolio.id}" data-portfolio-name="${escapeHtml(portfolio.name)}" title="Add Person to ${escapeHtml(portfolio.name)}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>+ Person</span>
              </button>
              <button type="button" class="btn-tbl-action edit-action btn-edit-portfolio" data-id="${portfolio.id}" title="Edit Portfolio Details">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-tbl-action delete-action btn-delete-portfolio" data-id="${portfolio.id}" title="Delete Portfolio">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Attach row events
    tbody.querySelectorAll(".portfolio-status-select").forEach(select => {
      select.addEventListener("change", (e) => {
        const id = select.getAttribute("data-id");
        const newStatus = e.target.value;
        if (newStatus === "active") {
          select.classList.add("status-active");
          select.classList.remove("status-inactive");
        } else {
          select.classList.add("status-inactive");
          select.classList.remove("status-active");
        }
        window.AppState.setPortfolioStatus(id, newStatus);
        window.AppNotifications?.toast(`Portfolio status updated to "${newStatus}"`, "info");
      });
    });

    tbody.querySelectorAll(".btn-add-person-to-port").forEach(btn => {
      btn.addEventListener("click", () => {
        const portId = btn.getAttribute("data-portfolio-id");
        openPersonModal(null, portId);
      });
    });

    tbody.querySelectorAll(".btn-edit-portfolio").forEach(btn => {
      btn.addEventListener("click", () => {
        openPortfolioModal(btn.getAttribute("data-id"));
      });
    });

    tbody.querySelectorAll(".btn-delete-portfolio").forEach(btn => {
      btn.addEventListener("click", () => {
        confirmDeletePortfolio(btn.getAttribute("data-id"));
      });
    });
  }

  function confirmDeletePortfolio(id) {
    const p = window.AppState.getPortfolioById(id);
    if (!p) return;

    if (confirm(`Delete portfolio "${p.name}" from the system and form dropdown? (Tip: You can set to "Inactive" instead).`)) {
      window.AppState.deletePortfolio(id);
      window.AppNotifications?.toast(`Portfolio "${p.name}" deleted.`, "info");
    }
  }

  /* ========================================================
     PEOPLE DIRECTORY TABLE & CRUD
     ======================================================== */
  function setupPeopleFilters() {
    const statusSelect = document.getElementById("people-status-filter");
    const portSelect = document.getElementById("people-portfolio-filter");
    const searchInput = document.getElementById("people-search-input");
    const addBtn = document.getElementById("btn-add-person");

    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        currentPeopleStatusFilter = e.target.value;
        renderPeopleTable();
        updateSummaryStats();
      });
    }

    if (portSelect) {
      portSelect.addEventListener("change", (e) => {
        currentPeoplePortfolioFilter = e.target.value;
        renderPeopleTable();
        updateSummaryStats();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderPeopleTable);
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const defaultPort = (currentPeoplePortfolioFilter && currentPeoplePortfolioFilter !== "all") ? currentPeoplePortfolioFilter : null;
        openPersonModal(null, defaultPort);
      });
    }
  }

  function renderPeopleTable() {
    const tbody = document.getElementById("people-table-body");
    const portFilterSelect = document.getElementById("people-portfolio-filter");
    const searchInput = document.getElementById("people-search-input");
    if (!tbody) return;

    // Refresh portfolio filter dropdown options
    if (portFilterSelect) {
      const currentSelected = portFilterSelect.value || currentPeoplePortfolioFilter || "all";
      const ports = window.AppState.getPortfolios();
      portFilterSelect.innerHTML = '<option value="all">All Portfolios</option>';
      ports.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.code || 'PCC'})`;
        portFilterSelect.appendChild(opt);
      });
      portFilterSelect.value = currentSelected;
    }

    let list = window.AppState.getPeople(currentPeoplePortfolioFilter, currentPeopleStatusFilter);
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (query) {
      list = list.filter(p => {
        const port = p.portfolioId ? window.AppState.getPortfolioById(p.portfolioId) : null;
        const portName = port ? port.name.toLowerCase() : "";
        const portCode = port && port.code ? port.code.toLowerCase() : "";
        return (
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.role && p.role.toLowerCase().includes(query)) ||
          (p.email && p.email.toLowerCase().includes(query)) ||
          portName.includes(query) ||
          portCode.includes(query)
        );
      });
    }

    if (list.length === 0) {
      const isInactiveOnly = currentPeopleStatusFilter === "inactive";
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
            <div style="max-width: 360px; margin: 0 auto;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--surface-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; color: var(--text-muted); border: 1px dashed var(--border-medium);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <div style="font-weight: 800; color: var(--pmi-dark); font-size: 0.95rem; margin-bottom: 0.25rem;">
                ${isInactiveOnly ? "No Inactive Persons Found" : "No Persons Found"}
              </div>
              <div style="font-size: 0.775rem; line-height: 1.45;">
                ${isInactiveOnly 
                  ? "All chapter persons are currently active. You can set any person to 'Inactive' using their status dropdown in the table, or set their parent portfolio to Inactive." 
                  : 'Click <b>"Add Person to Portfolio"</b> above to assign persons to chapter portfolios.'}
              </div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(person => {
      const assignedPort = person.portfolioId ? window.AppState.getPortfolioById(person.portfolioId) : null;
      const portDisplayName = assignedPort ? `${assignedPort.code ? assignedPort.code + ' - ' : ''}${assignedPort.name}` : "Chapter Wide / Unassigned";

      return `
        <tr>
          <!-- Person Column -->
          <td>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div class="person-avatar" style="width: 34px; height: 34px; font-size: 0.75rem; border-radius: 50%; background: linear-gradient(135deg, var(--pmi-dark), var(--pmi-blue)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;">
                ${escapeHtml(person.initials || getInitials(person.name))}
              </div>
              <div>
                <div style="font-weight: 800; color: var(--pmi-dark); font-size: 0.875rem;">${escapeHtml(person.name)}</div>
                <div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHtml(person.email || "No email registered")}</div>
              </div>
            </div>
          </td>

          <!-- Assigned Portfolio Column -->
          <td>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--pmi-blue); background: var(--pmi-blue-light); padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--pmi-blue-border); display: inline-flex; align-items: center; gap: 0.35rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>${escapeHtml(portDisplayName)}</span>
            </span>
          </td>

          <!-- Chapter Role Column -->
          <td style="font-weight: 600; color: var(--text-secondary); font-size: 0.825rem;">
            ${escapeHtml(person.role || "Chapter Volunteer")}
          </td>

          <!-- Status Column (Active / Inactive) -->
          <td style="white-space: nowrap; width: 145px;">
            <select class="table-status-select ${person.status === 'active' ? 'status-active' : 'status-inactive'} person-status-select" data-id="${person.id}" aria-label="Person Status">
              <option value="active" ${person.status === "active" ? "selected" : ""}>● Active</option>
              <option value="inactive" ${person.status === "inactive" ? "selected" : ""}>○ Inactive</option>
            </select>
          </td>

          <!-- Actions Column (Edit, Delete) -->
          <td style="text-align: right; white-space: nowrap;">
            <div class="portfolio-actions-cell" style="justify-content: flex-end; gap: 0.35rem;">
              <button type="button" class="btn-tbl-action edit-action btn-edit-person" data-id="${person.id}" title="Edit Person Details">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-tbl-action delete-action btn-delete-person" data-id="${person.id}" title="Delete Person">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".person-status-select").forEach(select => {
      select.addEventListener("change", (e) => {
        const id = select.getAttribute("data-id");
        const newStatus = e.target.value;
        if (newStatus === "active") {
          select.classList.add("status-active");
          select.classList.remove("status-inactive");
        } else {
          select.classList.add("status-inactive");
          select.classList.remove("status-active");
        }
        window.AppState.setPersonStatus(id, newStatus);
        window.AppNotifications?.toast(`Person status updated to "${newStatus}"`, "info");
      });
    });

    tbody.querySelectorAll(".btn-edit-person").forEach(btn => {
      btn.addEventListener("click", () => {
        openPersonModal(btn.getAttribute("data-id"));
      });
    });

    tbody.querySelectorAll(".btn-delete-person").forEach(btn => {
      btn.addEventListener("click", () => {
        confirmDeletePerson(btn.getAttribute("data-id"));
      });
    });
  }

  function confirmDeletePerson(id) {
    const p = window.AppState.getPersonById(id);
    if (!p) return;

    window.AppState.deletePerson(id);
    window.AppNotifications?.toast(`Person "${p.name}" removed from directory.`, "info");
  }

  /* ========================================================
     MODALS SETUP (ADD & UPDATE)
     ======================================================== */
  function setupModals() {
    const portModal = document.getElementById("portfolio-modal");
    const portForm = document.getElementById("portfolio-modal-form");
    const closePortBtn = document.getElementById("btn-close-portfolio-modal");
    const cancelPortBtn = document.getElementById("btn-cancel-portfolio-modal");

    const perModal = document.getElementById("person-modal");
    const perForm = document.getElementById("person-modal-form");
    const closePerBtn = document.getElementById("btn-close-person-modal");
    const cancelPerBtn = document.getElementById("btn-cancel-person-modal");

    [closePortBtn, cancelPortBtn].forEach(b => {
      if (b) b.addEventListener("click", closePortfolioModal);
    });

    [closePerBtn, cancelPerBtn].forEach(b => {
      if (b) b.addEventListener("click", closePersonModal);
    });

    if (portModal) {
      portModal.addEventListener("click", (e) => {
        if (e.target === portModal) closePortfolioModal();
      });
    }

    if (perModal) {
      perModal.addEventListener("click", (e) => {
        if (e.target === perModal) closePersonModal();
      });
    }

    if (portForm) {
      portForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("modal-port-name")?.value.trim();
        const code = document.getElementById("modal-port-code")?.value.trim();
        const lead = document.getElementById("modal-port-lead")?.value.trim() || "";
        const desc = document.getElementById("modal-port-desc")?.value.trim();
        const status = document.getElementById("modal-port-status")?.value || "active";

        if (!name) return alert("Portfolio name is required.");

        if (editingPortfolioId) {
          window.AppState.updatePortfolio(editingPortfolioId, { name, code, description: desc, status, leadPersonName: lead });
          window.AppNotifications?.toast(`Portfolio "${name}" updated.`, "success");
        } else {
          window.AppState.addPortfolio({ name, code, description: desc, status, leadPersonName: lead });
          window.AppNotifications?.toast(`Portfolio "${name}" created.`, "success");
        }
        closePortfolioModal();
      });
    }

    if (perForm) {
      perForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("modal-per-name")?.value.trim();
        const role = document.getElementById("modal-per-role")?.value.trim();
        const email = document.getElementById("modal-per-email")?.value.trim();
        const portId = document.getElementById("modal-per-portfolio")?.value || "";
        const status = document.getElementById("modal-per-status")?.value || "active";

        if (!name) return alert("Person name is required.");

        if (editingPersonId) {
          window.AppState.updatePerson(editingPersonId, { name, role, email, portfolioId: portId, status });
          window.AppNotifications?.toast(`Person "${name}" updated.`, "success");
        } else {
          window.AppState.addPerson({ name, role, email, portfolioId: portId, status });
          window.AppNotifications?.toast(`Person "${name}" added.`, "success");
        }
        closePersonModal();
      });
    }

    populatePortfolioSelectsInModals();
  }

  function populatePortfolioSelectsInModals() {
    const select = document.getElementById("modal-per-portfolio");
    if (!select) return;
    const ports = window.AppState.getPortfolios();
    select.innerHTML = '<option value="">-- No specific portfolio (Chapter Wide) --</option>';
    ports.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.status})`;
      select.appendChild(opt);
    });
  }

  function openPortfolioModal(id = null) {
    editingPortfolioId = id;
    const modal = document.getElementById("portfolio-modal");
    const title = document.getElementById("portfolio-modal-title");
    if (!modal) return;

    if (id) {
      const p = window.AppState.getPortfolioById(id);
      if (!p) return;
      if (title) title.textContent = "Update Portfolio";
      document.getElementById("modal-port-name").value = p.name || "";
      document.getElementById("modal-port-code").value = p.code || "";
      document.getElementById("modal-port-lead").value = p.leadPersonName || "";
      document.getElementById("modal-port-desc").value = p.description || "";
      document.getElementById("modal-port-status").value = p.status || "active";
    } else {
      if (title) title.textContent = "Add New Portfolio";
      document.getElementById("modal-port-name").value = "";
      document.getElementById("modal-port-code").value = "";
      document.getElementById("modal-port-lead").value = "";
      document.getElementById("modal-port-desc").value = "";
      document.getElementById("modal-port-status").value = "active";
    }

    modal.style.display = "flex";
  }

  function closePortfolioModal() {
    const modal = document.getElementById("portfolio-modal");
    if (modal) modal.style.display = "none";
    editingPortfolioId = null;
  }

  function openPersonModal(id = null, defaultPortfolioId = null) {
    editingPersonId = id;
    const modal = document.getElementById("person-modal");
    const title = document.getElementById("person-modal-title");
    populatePortfolioSelectsInModals();
    if (!modal) return;

    if (id) {
      const p = window.AppState.getPersonById(id);
      if (!p) return;
      if (title) title.textContent = "Edit Person";
      document.getElementById("modal-per-name").value = p.name || "";
      document.getElementById("modal-per-role").value = p.role || "";
      document.getElementById("modal-per-email").value = p.email || "";
      document.getElementById("modal-per-portfolio").value = p.portfolioId || "";
      document.getElementById("modal-per-status").value = p.status || "active";
    } else {
      const targetPort = defaultPortfolioId ? window.AppState.getPortfolioById(defaultPortfolioId) : null;
      if (title) {
        title.textContent = targetPort 
          ? `Add Person to Portfolio: ${targetPort.name}` 
          : "Add Person to Portfolio";
      }
      document.getElementById("modal-per-name").value = "";
      document.getElementById("modal-per-role").value = "";
      document.getElementById("modal-per-email").value = "";
      document.getElementById("modal-per-portfolio").value = defaultPortfolioId || "";
      document.getElementById("modal-per-status").value = "active";
    }

    modal.style.display = "flex";
  }

  function closePersonModal() {
    const modal = document.getElementById("person-modal");
    if (modal) modal.style.display = "none";
    editingPersonId = null;
  }

  function updateSummaryStats() {
    const el = document.getElementById("manage-stats-summary");
    if (!el) return;

    if (activeTab === "portfolios") {
      const portfolios = window.AppState.getPortfolios();
      const activePorts = portfolios.filter(p => (p.status || "").toLowerCase().trim() === "active").length;
      const inactivePorts = portfolios.length - activePorts;

      el.innerHTML = `
        <div class="mgmt-stats-grid">
          <div class="mgmt-stat-card stat-clickable ${currentPortfolioFilter === 'all' ? 'stat-active-selected' : ''}" id="stat-port-all" title="Click to show All Portfolios">
            <div class="mgmt-stat-icon-box stat-icon-blue">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div class="mgmt-stat-info">
              <span class="mgmt-stat-number">${portfolios.length}</span>
              <span class="mgmt-stat-label">Total Portfolios</span>
            </div>
          </div>

          <div class="mgmt-stat-card stat-clickable ${currentPortfolioFilter === 'active' ? 'stat-active-selected' : ''}" id="stat-port-active" title="Click to show Active Portfolios only">
            <div class="mgmt-stat-icon-box stat-icon-emerald">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div class="mgmt-stat-info">
              <span class="mgmt-stat-number">${activePorts}</span>
              <span class="mgmt-stat-label">Active</span>
            </div>
          </div>

          <div class="mgmt-stat-card stat-clickable ${currentPortfolioFilter === 'inactive' ? 'stat-active-selected' : ''}" id="stat-port-inactive" title="Click to show Inactive Portfolios only">
            <div class="mgmt-stat-icon-box stat-icon-slate">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
            </div>
            <div class="mgmt-stat-info">
              <span class="mgmt-stat-number">${inactivePorts}</span>
              <span class="mgmt-stat-label">Inactive</span>
            </div>
          </div>
        </div>
      `;

      document.getElementById("stat-port-all")?.addEventListener("click", () => {
        currentPortfolioFilter = "all";
        const sel = document.getElementById("portfolio-status-filter");
        if (sel) sel.value = "all";
        renderPortfoliosTable();
        updateSummaryStats();
      });

      document.getElementById("stat-port-active")?.addEventListener("click", () => {
        currentPortfolioFilter = "active";
        const sel = document.getElementById("portfolio-status-filter");
        if (sel) sel.value = "active";
        renderPortfoliosTable();
        updateSummaryStats();
      });

      document.getElementById("stat-port-inactive")?.addEventListener("click", () => {
        currentPortfolioFilter = "inactive";
        const sel = document.getElementById("portfolio-status-filter");
        if (sel) sel.value = "inactive";
        renderPortfoliosTable();
        updateSummaryStats();
      });

    } else {
      // Persons Tab Active
      const allPeople = window.AppState.getPeople(currentPeoplePortfolioFilter, "all");
      const activePeople = window.AppState.getPeople(currentPeoplePortfolioFilter, "active");
      const inactivePeople = window.AppState.getPeople(currentPeoplePortfolioFilter, "inactive");

      el.innerHTML = `
        <div class="mgmt-stats-grid">
          <div class="mgmt-stat-card stat-clickable ${currentPeopleStatusFilter === 'all' ? 'stat-active-selected' : ''}" id="stat-per-all" title="Click to show All Persons">
            <div class="mgmt-stat-icon-box stat-icon-blue">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
            <div class="mgmt-stat-info">
              <span class="mgmt-stat-number">${allPeople.length}</span>
              <span class="mgmt-stat-label">Total Persons</span>
            </div>
          </div>

          <div class="mgmt-stat-card stat-clickable ${currentPeopleStatusFilter === 'active' ? 'stat-active-selected' : ''}" id="stat-per-active" title="Click to show Active Persons only">
            <div class="mgmt-stat-icon-box stat-icon-emerald">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="mgmt-stat-info">
              <span class="mgmt-stat-number">${activePeople.length}</span>
              <span class="mgmt-stat-label">Active</span>
            </div>
          </div>

          <div class="mgmt-stat-card stat-clickable ${currentPeopleStatusFilter === 'inactive' ? 'stat-active-selected' : ''}" id="stat-per-inactive" title="Click to show Inactive Persons only">
            <div class="mgmt-stat-icon-box stat-icon-slate">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <div class="mgmt-stat-info">
              <span class="mgmt-stat-number">${inactivePeople.length}</span>
              <span class="mgmt-stat-label">Inactive</span>
            </div>
          </div>
        </div>
      `;

      document.getElementById("stat-per-all")?.addEventListener("click", () => {
        currentPeopleStatusFilter = "all";
        const sel = document.getElementById("people-status-filter");
        if (sel) sel.value = "all";
        renderPeopleTable();
        updateSummaryStats();
      });

      document.getElementById("stat-per-active")?.addEventListener("click", () => {
        currentPeopleStatusFilter = "active";
        const sel = document.getElementById("people-status-filter");
        if (sel) sel.value = "active";
        renderPeopleTable();
        updateSummaryStats();
      });

      document.getElementById("stat-per-inactive")?.addEventListener("click", () => {
        currentPeopleStatusFilter = "inactive";
        const sel = document.getElementById("people-status-filter");
        if (sel) sel.value = "inactive";
        renderPeopleTable();
        updateSummaryStats();
      });
    }
  }

  function getInitials(name) {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.ManagementController = {
    init: initManagement,
    renderPortfoliosTable,
    renderPeopleTable,
    updateSummaryStats,
    openPortfolioModal,
    openPersonModal,
    switchToPeopleTab,
    switchToPortfoliosTab
  };
})();

