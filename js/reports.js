/**
 * PMIPCC Reports Controller: Detailed Allocation Register Table,
 * and Multi-Format Downloads (Excel, CSV, PDF/Print, JSON).
 */

(function () {
  let sortColumn = "submittedAt";
  let sortDirection = "desc";
  let filterPortfolio = "all";
  let filterYear = "all";
  let filterMonth = "all";
  let searchQuery = "";

  function getLogYear(log) {
    if (!log) return new Date().getFullYear();
    if (log.year) return parseInt(log.year, 10);
    if (log.submittedAt) {
      const y = new Date(log.submittedAt).getFullYear();
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  }

  function getAvailableYears() {
    const logs = window.AppState?.getLogs() || [];
    const yearSet = new Set();
    const currentYear = new Date().getFullYear();
    yearSet.add(currentYear);
    yearSet.add(currentYear - 1);
    yearSet.add(currentYear + 1);

    logs.forEach(l => {
      const y = getLogYear(l);
      if (y) yearSet.add(y);
    });

    return Array.from(yearSet).sort((a, b) => b - a);
  }

  function initReports() {
    setupTableSorting();
    setupReportsFilters();
    setupDownloadButtons();
    refreshFilterOptions();
    renderAllReports();

    window.addEventListener("app:logs-changed", () => {
      refreshFilterOptions();
      renderAllReports();
    });

    window.addEventListener("app:portfolios-changed", () => {
      refreshFilterOptions();
      renderAllReports();
    });
  }

  function setupTableSorting() {
    document.querySelectorAll(".sortable-th").forEach(th => {
      th.addEventListener("click", () => {
        const col = th.getAttribute("data-sort");
        if (sortColumn === col) {
          sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
          sortColumn = col;
          sortDirection = "asc";
        }
        renderTableOnly();
      });
    });
  }

  function setupReportsFilters() {
    const portSelect = document.getElementById("reports-portfolio-filter");
    const yearSelect = document.getElementById("reports-year-filter");
    const monthSelect = document.getElementById("reports-month-filter");
    const searchInput = document.getElementById("reports-search-input");
    const resetBtn = document.getElementById("btn-reports-reset-filter");

    function handleYearChange(newYear) {
      filterYear = newYear;
      if (yearSelect) yearSelect.value = newYear;
      updateResetButton();
      renderAllReports();
    }

    if (portSelect) {
      portSelect.addEventListener("change", (e) => {
        filterPortfolio = e.target.value;
        updateResetButton();
        renderAllReports();
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener("change", (e) => handleYearChange(e.target.value));
    }

    if (monthSelect) {
      monthSelect.addEventListener("change", (e) => {
        filterMonth = e.target.value;
        updateResetButton();
        renderAllReports();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = (e.target.value || "").toLowerCase().trim();
        updateResetButton();
        renderAllReports();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        filterPortfolio = "all";
        filterYear = "all";
        filterMonth = "all";
        searchQuery = "";
        if (portSelect) portSelect.value = "all";
        if (yearSelect) yearSelect.value = "all";
        if (monthSelect) monthSelect.value = "all";
        if (searchInput) searchInput.value = "";
        updateResetButton();
        renderAllReports();
      });
    }
  }

  function refreshFilterOptions() {
    const portSelect = document.getElementById("reports-portfolio-filter");
    const yearSelect = document.getElementById("reports-year-filter");
    const monthSelect = document.getElementById("reports-month-filter");

    if (portSelect) {
      const curPort = filterPortfolio;
      const portfolios = window.AppState.getPortfolios();
      let portHtml = '<option value="all">All Portfolios</option>';
      portfolios.forEach(p => {
        const selected = (p.id === curPort || p.name === curPort) ? "selected" : "";
        portHtml += `<option value="${escapeHtml(p.id)}" ${selected}>${escapeHtml(p.name)}</option>`;
      });
      portSelect.innerHTML = portHtml;
    }

    const years = getAvailableYears();
    let yearHtml = '<option value="all">All Years</option>';
    years.forEach(y => {
      const selected = String(y) === String(filterYear) ? "selected" : "";
      yearHtml += `<option value="${y}" ${selected}>${y}</option>`;
    });

    if (yearSelect) yearSelect.innerHTML = yearHtml;

    if (monthSelect) {
      const curMonth = filterMonth;
      const months = (window.INITIAL_DATA && window.INITIAL_DATA.months) || [
        "July", "August", "September", "October", "November", "December"
      ];
      let monthHtml = '<option value="all">All Months</option>';
      months.forEach(m => {
        const selected = (m === curMonth) ? "selected" : "";
        monthHtml += `<option value="${escapeHtml(m)}" ${selected}>${escapeHtml(m)}</option>`;
      });
      monthSelect.innerHTML = monthHtml;
    }
  }

  function updateResetButton() {
    const resetBtn = document.getElementById("btn-reports-reset-filter");
    if (!resetBtn) return;
    const isFiltered = (filterPortfolio !== "all") || (filterYear !== "all") || (filterMonth !== "all") || (searchQuery !== "");
    resetBtn.style.display = isFiltered ? "inline-flex" : "none";
  }

  function renderAllReports() {
    const logs = getFilteredAndSortedLogs();
    renderTable(logs);
  }

  function renderTableOnly() {
    const logs = getFilteredAndSortedLogs();
    renderTable(logs);
  }

  function getFilteredAndSortedLogs() {
    let logs = window.AppState.getLogs();

    if (filterPortfolio !== "all") {
      logs = logs.filter(l => (l.portfolioId === filterPortfolio || l.portfolioName === filterPortfolio));
    }

    if (filterYear !== "all") {
      logs = logs.filter(l => String(getLogYear(l)) === String(filterYear));
    }

    if (filterMonth !== "all") {
      logs = logs.filter(l => l.month === filterMonth);
    }

    if (searchQuery) {
      logs = logs.filter(l => {
        const pName = (l.personName || "").toLowerCase();
        const pRole = (l.personRole || "").toLowerCase();
        const portName = (l.portfolioName || "").toLowerCase();
        const comm = (l.comments || "").toLowerCase();
        const month = (l.month || "").toLowerCase();
        const yearStr = String(getLogYear(l));
        return pName.includes(searchQuery) ||
               pRole.includes(searchQuery) ||
               portName.includes(searchQuery) ||
               comm.includes(searchQuery) ||
               month.includes(searchQuery) ||
               yearStr.includes(searchQuery);
      });
    }

    logs.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (sortColumn === "hours") {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (sortColumn === "year") {
        valA = getLogYear(a);
        valB = getLogYear(b);
      } else if (sortColumn === "month") {
        const months = (window.INITIAL_DATA && window.INITIAL_DATA.months) || [];
        valA = months.indexOf(valA);
        valB = months.indexOf(valB);
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return logs;
  }

  function getInitials(name) {
    if (!name) return "PM";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function renderTable(logs) {
    const tbody = document.getElementById("reports-table-body");
    const countBadge = document.getElementById("report-count-badge");
    const filterIndicator = document.getElementById("reports-filter-indicator");
    if (!tbody) return;

    const allLogs = window.AppState.getLogs();
    if (countBadge) countBadge.textContent = `${logs.length} allocations`;

    if (filterIndicator) {
      if (logs.length < allLogs.length) {
        filterIndicator.textContent = `Showing ${logs.length} of ${allLogs.length} records`;
      } else {
        filterIndicator.textContent = `Showing all ${allLogs.length} records`;
      }
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="padding: 3rem 1rem; text-align: center;">
            <div style="max-width: 340px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; margin-bottom: 0.25rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--pmi-dark);">No allocation records found</div>
              <div style="font-size: 0.775rem; color: var(--text-muted); line-height: 1.4;">Try adjusting your search keywords, year selection, portfolio filter, or month.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const isPast3 = ["August", "September", "October"].includes(log.month);

      return `
        <tr id="row-${log.id}">
          <td style="font-size: 0.775rem; color: var(--text-secondary); white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${log.submittedAt ? formatDate(log.submittedAt) : "Chapter Record"}</span>
            </div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.775rem; color: var(--pmi-dark); background: #f1f5f9; padding: 0.15rem 0.5rem; border-radius: var(--radius-xs); border: 1px solid var(--border-light);">
              ${getLogYear(log)}
            </span>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--pmi-dark); font-size: 0.85rem;">${escapeHtml(log.portfolioName || "PMIPCC")}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <div class="portfolio-lead-avatar" style="width: 28px; height: 28px; font-size: 0.65rem;">${getInitials(log.personName)}</div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 700; font-size: 0.825rem; color: var(--pmi-dark); line-height: 1.2;">${escapeHtml(log.personName || "Person")}</span>
                <span style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(log.personRole || "Contributor")}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="status-pill ${isPast3 ? 'active' : 'inactive'}" style="${isPast3 ? 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; font-weight: 700; font-size: 0.725rem;' : 'font-size: 0.725rem;'}">
              ${log.month}
            </span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 800; font-size: 0.825rem; color: var(--pmi-dark); background: #f8fafc; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; display: inline-block;">
              ${(parseFloat(log.hours) || 0).toFixed(1)} <span style="font-size: 0.7rem; font-weight: 600; color: var(--text-muted);">hrs</span>
            </span>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 360px; line-height: 1.4;">
              ${log.comments ? escapeHtml(log.comments) : '<span style="color: var(--text-muted); font-style: italic;">No comments logged</span>'}
            </div>
          </td>
          <td style="text-align: right; white-space: nowrap;" class="no-print">
            <div class="portfolio-actions-cell">
              <button type="button" class="btn-tbl-action edit-action btn-edit-log" data-id="${log.id}" title="Edit Allocation Record">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-tbl-action delete-action btn-delete-log" data-id="${log.id}" title="Delete Record">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-delete-log").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Delete this allocation record?")) {
          window.AppState.deleteLog(id);
          window.AppNotifications?.toast("Record deleted.", "info");
        }
      });
    });

    tbody.querySelectorAll(".btn-edit-log").forEach(btn => {
      btn.addEventListener("click", () => {
        openEditLogModal(btn.getAttribute("data-id"));
      });
    });
  }

  function openEditLogModal(logId) {
    const logs = window.AppState.getLogs();
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    const modal = document.getElementById("edit-log-modal");
    if (!modal) return;

    document.getElementById("edit-log-id").value = log.id;
    document.getElementById("edit-log-portfolio-name").textContent = log.portfolioName;
    document.getElementById("edit-log-person-name").textContent = `${log.personName} (${log.personRole || "Person"})`;
    const yearElem = document.getElementById("edit-log-year");
    if (yearElem) yearElem.textContent = getLogYear(log);
    document.getElementById("edit-log-month").textContent = log.month;
    document.getElementById("edit-log-hours").value = log.hours;
    document.getElementById("edit-log-comments").value = log.comments || "";

    modal.style.display = "flex";
  }

  /* ========================================================
     DOWNLOADS: EXCEL, CSV, PRINT/PDF, JSON
     ======================================================== */
  function setupDownloadButtons() {
    document.getElementById("btn-download-excel")?.addEventListener("click", downloadExcel);
    document.getElementById("btn-download-csv")?.addEventListener("click", downloadCsv);
    document.getElementById("btn-download-pdf")?.addEventListener("click", downloadPdf);
    document.getElementById("btn-export-json")?.addEventListener("click", downloadJsonBackup);

    const fileInput = document.getElementById("import-json-file");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            window.AppState.importData(data);
            window.AppNotifications?.toast("PMIPCC database restored successfully!", "success");
            fileInput.value = "";
          } catch (err) {
            alert("Error importing JSON: " + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    const editLogForm = document.getElementById("edit-log-form");
    const closeEditLogBtn = document.getElementById("btn-close-edit-log-modal");
    const cancelEditLogBtn = document.getElementById("btn-cancel-edit-log-modal");
    const editLogModal = document.getElementById("edit-log-modal");

    [closeEditLogBtn, cancelEditLogBtn].forEach(b => {
      if (b) b.addEventListener("click", () => { if (editLogModal) editLogModal.style.display = "none"; });
    });

    if (editLogForm) {
      editLogForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-log-id").value;
        const hours = parseFloat(document.getElementById("edit-log-hours").value) || 0;
        const comments = document.getElementById("edit-log-comments").value;

        window.AppState.updateLog(id, { hours, comments });
        window.AppNotifications?.toast("Record updated.", "success");
        if (editLogModal) editLogModal.style.display = "none";
      });
    }
  }

  function downloadPdf() {
    const printSubtitle = document.getElementById("print-year-subtitle");
    if (printSubtitle) {
      printSubtitle.textContent = `Report Scope: ${filterYear !== "all" ? "Year " + filterYear : "All Years"}${filterPortfolio !== "all" ? " • " + filterPortfolio : ""}${filterMonth !== "all" ? " • " + filterMonth : ""}`;
    }
    window.print();
  }

  function downloadCsv() {
    const logs = getFilteredAndSortedLogs();
    if (logs.length === 0) return alert("No data available to export.");

    const headers = [
      "Submission Date",
      "Year",
      "Month",
      "Portfolio ID",
      "Portfolio Name",
      "Person ID",
      "Person Name",
      "Chapter Role",
      "Allocated Hours",
      "Comments / Deliverables"
    ];

    const rows = logs.map(l => [
      formatDate(l.submittedAt),
      getLogYear(l),
      l.month || "",
      l.portfolioId || "",
      sanitizeCsvField(l.portfolioName),
      l.personId || "",
      sanitizeCsvField(l.personName),
      sanitizeCsvField(l.personRole),
      l.hours !== undefined ? l.hours : 0,
      sanitizeCsvField(l.comments)
    ]);

    const totalHours = logs.reduce((sum, l) => sum + (parseFloat(l.hours) || 0), 0);
    const yearScope = filterYear !== "all" ? `Year ${filterYear}` : "All Years";
    rows.push([
      "TOTAL",
      yearScope,
      `${logs.length} Allocations`,
      "",
      "",
      "",
      "",
      "",
      totalHours.toFixed(1),
      `Exported from PMI Pearl City Chapter (PMIPCC) on ${new Date().toLocaleString()}`
    ]);

    let csvContent = "\uFEFF";
    csvContent += headers.map(escapeCsv).join(",") + "\r\n";
    rows.forEach(row => {
      csvContent += row.map(escapeCsv).join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const yearPart = filterYear !== "all" ? `_${filterYear}` : "";
    const filename = `PMIPCC_Resource_Report${yearPart}_${formatDateForFile(new Date())}.csv`;
    triggerFileDownload(blob, filename);

    window.AppNotifications?.toast(`Exported ${logs.length} records (${yearScope}) to ${filename}`, "success");
  }

  function downloadExcel() {
    const logs = getFilteredAndSortedLogs();
    if (logs.length === 0) return alert("No data available to export.");

    const totalHours = logs.reduce((sum, l) => sum + (parseFloat(l.hours) || 0), 0);
    const dateStr = new Date().toLocaleDateString();
    const yearScope = filterYear !== "all" ? `Year ${filterYear}` : "All Years";

    const excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>PMI Pearl City Chapter Hyderabad</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>PMI Pearl City Chapter</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#003366" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#FF610F"/>
   </Borders>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Color="#003366" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FF610F" ss:Bold="1"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#003366" ss:Bold="1"/>
   <Interior ss:Color="#EEF6FC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0065BD"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#FF610F"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalHours">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FF610F"/>
   <Interior ss:Color="#EEF6FC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0065BD"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#FF610F"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="PMIPCC Allocations">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="100"/>
   <Column ss:Width="65"/>
   <Column ss:Width="95"/>
   <Column ss:Width="190"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="300"/>
   
   <Row ss:Height="24">
    <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">PMI PEARL CITY CHAPTER HYDERABAD (PMIPCC)</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="7" ss:StyleID="SubTitle"><Data ss:Type="String">Resource Allocation Report • Scope: ${yearScope} • Exported on ${dateStr} • Total Hours: ${totalHours.toFixed(1)} hrs</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Submission Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Year</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Month</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Portfolio Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Person</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Chapter Role</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Hours</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Deliverables / Comments</Data></Cell>
   </Row>

   ${logs.map(l => `
   <Row ss:Height="20">
    <Cell><Data ss:Type="String">${escapeXml(formatDate(l.submittedAt))}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${getLogYear(l)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.month || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.portfolioName || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.personName || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.personRole || "")}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${parseFloat(l.hours) || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.comments || "")}</Data></Cell>
   </Row>
   `).join("")}

   <Row ss:Height="22">
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">TOTAL</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">${filterYear !== 'all' ? filterYear : 'All'}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">${logs.length} allocations</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalHours"><Data ss:Type="Number">${totalHours.toFixed(1)}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">Grand Total Hours</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([excelXml], { type: "application/vnd.ms-excel" });
    const yearPart = filterYear !== "all" ? `_${filterYear}` : "";
    const filename = `PMIPCC_Resource_Report${yearPart}_${formatDateForFile(new Date())}.xls`;
    triggerFileDownload(blob, filename);

    window.AppNotifications?.toast(`Exported Excel report (${yearScope}) to ${filename}`, "success");
  }

  function downloadJsonBackup() {
    const data = window.AppState.exportAllData();
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const filename = `PMIPCC_Database_Backup_${formatDateForFile(new Date())}.json`;
    triggerFileDownload(blob, filename);
    window.AppNotifications?.toast("JSON backup downloaded successfully!", "success");
  }

  function sanitizeCsvField(val) {
    if (val === undefined || val === null) return "";
    return String(val).trim();
  }

  function escapeCsv(val) {
    const s = String(val !== undefined && val !== null ? val : "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function escapeXml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    try {
      return new Date(isoStr).toLocaleDateString();
    } catch (e) {
      return isoStr;
    }
  }

  function formatDateForFile(date) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function triggerFileDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
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

  window.ReportsController = {
    init: initReports,
    renderAllReports,
    downloadCsv,
    downloadExcel
  };
})();

