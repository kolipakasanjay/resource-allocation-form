/**
 * PMIPCC Resource Allocation Form Controller
 * - Section 1: Portfolio Selection (9 Portfolios)
 *              Dynamic Person Selection: Dropdown displays ONLY the 5 persons belonging to the selected portfolio
 * - Section 2: Monthly Resource Allocation & Deliverables:
 *              Filler directly selects month, hours, and deliverables (no forced 3 months)
 *              Dynamic support for adding/removing multiple month allocations per person
 */

(function () {
  let formState = {
    selectedPortfolioId: "",
    selectedPortfolioName: "",
    peopleData: {} // [personId]: { person, allocations: [ { id, month, hours, comments } ] }
  };

  function initForm() {
    formState = {
      selectedPortfolioId: "",
      selectedPortfolioName: "",
      peopleData: {}
    };

    // User requirement: Initially do NOT select any portfolio.
    // Ensure form starts completely fresh with no portfolio preselected and clear stale drafts.
    try {
      window.AppState?.clearDraft?.();
    } catch (e) {}

    setupPortfolioDropdown();
    setupPersonDropdown();
    setupEventListeners();
    renderAll();
  }

  /* ========================================================
     1. PORTFOLIO SELECTION DROPDOWN (SECTION 1)
     ======================================================== */
  function setupPortfolioDropdown() {
    const select = document.getElementById("portfolio-select-dropdown");
    if (!select) return;

    const portfolios = window.AppState.getActivePortfolios();

    // Verify current selection is still active
    if (formState.selectedPortfolioId) {
      const match = portfolios.find(p => p.id === formState.selectedPortfolioId);
      if (!match) {
        formState.selectedPortfolioId = "";
        formState.selectedPortfolioName = "";
      } else {
        formState.selectedPortfolioName = match.name;
      }
    }

    const hasSelection = Boolean(formState.selectedPortfolioId);
    select.innerHTML = `<option value="" ${!hasSelection ? "selected" : ""}>-- Select Chapter Portfolio --</option>`;

    portfolios.forEach(port => {
      const opt = document.createElement("option");
      opt.value = port.id;
      opt.textContent = `${port.name} (${port.code || port.id})`;
      if (hasSelection && formState.selectedPortfolioId === port.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.value = formState.selectedPortfolioId || "";
  }

  /* ========================================================
     2. DYNAMIC PERSON SELECTION: ONLY PERSONS OF SELECTED PORTFOLIO
     ======================================================== */
  function setupPersonDropdown() {
    const select = document.getElementById("person-select-dropdown");
    const chipsContainer = document.getElementById("selected-people-chips");
    const countBadge = document.getElementById("person-count-badge");
    const selectAllBtn = document.getElementById("btn-select-all-people");
    const hint = document.getElementById("person-select-hint");
    if (!select) return;

    const selectedPortId = formState.selectedPortfolioId;
    const selectedPort = selectedPortId ? window.AppState.getPortfolioById(selectedPortId) : null;
    const portName = selectedPort ? selectedPort.name : "";

    // 1. If NO portfolio is selected yet
    if (!selectedPortId) {
      select.disabled = true;
      select.innerHTML = '<option value="">-- Please Select a Portfolio in Section 1 First --</option>';
      if (countBadge) {
        countBadge.textContent = "0 Selected";
        countBadge.className = "status-pill inactive";
      }
      if (selectAllBtn) {
        selectAllBtn.textContent = "Select All Persons";
        selectAllBtn.disabled = true;
        selectAllBtn.style.opacity = "0.5";
        selectAllBtn.style.cursor = "not-allowed";
      }
      if (hint) {
        hint.textContent = "Please select a Chapter Portfolio above first to view and select its 5 persons.";
      }
      if (chipsContainer) {
        chipsContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Select a portfolio above to load its 5 chapter persons.</span>';
      }
      return;
    }

    // 2. Portfolio IS selected: fetch ONLY the 5 active people for this specific portfolio
    select.disabled = false;
    const people = window.AppState.getActivePeople(selectedPortId);
    const activeIds = new Set(people.map(p => p.id));

    if (selectAllBtn) {
      selectAllBtn.disabled = false;
      selectAllBtn.style.opacity = "1";
      selectAllBtn.style.cursor = "pointer";
      selectAllBtn.textContent = `Select All 5 ${portName} Persons`;
    }

    // Clean any person who doesn't belong to this portfolio
    let removedAny = false;
    Object.keys(formState.peopleData).forEach(id => {
      if (!activeIds.has(id)) {
        delete formState.peopleData[id];
        removedAny = true;
      }
    });

    if (removedAny) {
      saveDraftDebounced();
      renderPersonCards();
      updateFormSummary();
    }

    const selectedIds = Object.keys(formState.peopleData);

    if (countBadge) {
      countBadge.textContent = `${selectedIds.length} / ${people.length} Selected`;
      countBadge.className = selectedIds.length > 0 ? "status-pill active" : "status-pill inactive";
    }

    if (hint) {
      hint.textContent = `Showing 5 persons for "${portName}". Select one or more persons to allocate monthly resources.`;
    }

    // Populate dropdown with ONLY the persons for the selected portfolio
    select.innerHTML = `<option value="">-- Select a Person from ${escapeHtml(portName)} (${people.length} Persons) --</option>`;

    people.forEach(person => {
      const isSelected = !!formState.peopleData[person.id];
      const opt = document.createElement("option");
      opt.value = person.id;
      opt.textContent = `${person.name} — ${person.role || "Team Member"}${isSelected ? " (Already Added)" : ""}`;
      select.appendChild(opt);
    });

    // Render chips
    if (chipsContainer) {
      chipsContainer.innerHTML = "";
      if (selectedIds.length === 0) {
        chipsContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No persons selected yet. Select from the 5 ${escapeHtml(portName)} persons in the dropdown above, or click "Select All 5 ${escapeHtml(portName)} Persons".</span>`;
      } else {
        selectedIds.forEach((id, idx) => {
          const entry = formState.peopleData[id];
          if (!entry || !entry.person) return;

          const chip = document.createElement("div");
          chip.className = "person-tag-pill";
          chip.innerHTML = `
            <span class="tag-index">${idx + 1}</span>
            <span>${escapeHtml(entry.person.name)}</span>
            <span class="tag-role">(${escapeHtml(entry.person.role || "")})</span>
            <button type="button" class="tag-remove-btn" title="Remove ${escapeHtml(entry.person.name)}">
              &times;
            </button>
          `;
          chip.querySelector(".tag-remove-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            removePersonFromForm(id);
          });
          chipsContainer.appendChild(chip);
        });
      }
    }
  }

  /* ========================================================
     3. PERSON ACTIONS & ALLOCATION MANAGEMENT (SECTION 2)
     ======================================================== */
  function addPersonToForm(personId, showToast = true) {
    if (!personId) return;
    if (formState.peopleData[personId]) {
      if (showToast) {
        window.AppNotifications?.toast(`${window.AppState.getPersonById(personId)?.name || 'Person'} is already added.`, "info");
      }
      return;
    }

    const person = window.AppState.getPersonById(personId);
    if (!person) return;

    // Start with 1 clean allocation row for the filler to select month and enter details
    formState.peopleData[personId] = {
      person,
      allocations: [
        {
          id: "alloc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          month: "",
          hours: "",
          comments: ""
        }
      ]
    };

    saveDraftDebounced();
    renderAll();
    if (showToast) {
      window.AppNotifications?.toast(`Added ${person.name}. Select month and fill resource details below.`, "success");
    }
  }

  function removePersonFromForm(personId) {
    if (!formState.peopleData[personId]) return;
    const name = formState.peopleData[personId]?.person?.name;
    delete formState.peopleData[personId];
    saveDraftDebounced();
    renderAll();
    if (name) {
      window.AppNotifications?.toast(`Removed ${name} from allocations.`, "info");
    }
  }

  function addMonthAllocation(personId) {
    const entry = formState.peopleData[personId];
    if (!entry) return;

    if (!Array.isArray(entry.allocations)) {
      entry.allocations = [];
    }

    entry.allocations.push({
      id: "alloc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      month: "",
      hours: "",
      comments: ""
    });

    saveDraftDebounced();
    renderPersonCards();
    updateFormSummary();
  }

  function removeMonthAllocation(personId, allocId) {
    const entry = formState.peopleData[personId];
    if (!entry || !entry.allocations) return;

    entry.allocations = entry.allocations.filter(a => a.id !== allocId);
    if (entry.allocations.length === 0) {
      entry.allocations.push({
        id: "alloc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        month: "",
        hours: "",
        comments: ""
      });
    }

    saveDraftDebounced();
    renderPersonCards();
    updatePersonSubtotal(personId);
    updateFormSummary();
  }

  function updateAllocationField(personId, allocId, field, value) {
    const entry = formState.peopleData[personId];
    if (!entry || !entry.allocations) return;

    const alloc = entry.allocations.find(a => a.id === allocId);
    if (!alloc) return;

    if (field === "month") {
      alloc.month = value;
    } else if (field === "hours") {
      alloc.hours = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
    } else if (field === "comments") {
      alloc.comments = value;
    }

    saveDraftDebounced();
    updatePersonSubtotal(personId);
    updateFormSummary();
  }

  /* ========================================================
     4. RENDER DYNAMIC PERSON ALLOCATION CARDS (SECTION 2)
     ======================================================== */
  function renderPersonCards() {
    const container = document.getElementById("people-cards-container");
    const emptyState = document.getElementById("form-empty-people");
    if (!container) return;

    const personIds = Object.keys(formState.peopleData);

    if (personIds.length === 0) {
      container.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    container.innerHTML = "";

    const monthsList = window.INITIAL_DATA?.months || [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    personIds.forEach((personId, index) => {
      const entry = formState.peopleData[personId];
      if (!entry || !entry.person) return;

      const person = entry.person;
      const allocations = entry.allocations || [];

      // Calculate subtotal
      const subtotal = allocations.reduce((acc, a) => {
        const val = parseFloat(a.hours);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      const card = document.createElement("div");
      card.className = "person-work-card";
      card.id = `card-person-${personId}`;

      // Card Header
      const headerHtml = `
        <div class="person-card-header">
          <div class="person-card-title-box">
            <span class="person-badge-num">Person ${index + 1}</span>
            <div>
              <div class="person-card-name" style="font-weight: 800; font-size: 1rem; color: var(--pmi-dark);">
                ${escapeHtml(person.name)}
              </div>
              <div class="person-card-role" style="font-size: 0.775rem; color: var(--text-muted); font-weight: 600;">
                ${escapeHtml(person.role || "Board Member")}
              </div>
            </div>
          </div>
          
          <div class="person-card-actions" style="display: flex; align-items: center; gap: 0.75rem;">
            <span id="subtotal-${personId}" class="person-hours-subtotal">Total: ${subtotal.toFixed(1)} hrs</span>
            <button type="button" class="btn-remove-person" data-person-id="${personId}" style="background: none; border: none; color: #dc2626; cursor: pointer; padding: 0.35rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm);" title="Remove ${escapeHtml(person.name)}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;

      // Allocation rows
      const rowsHtml = allocations.map((alloc) => {
        const hoursVal = (alloc.hours !== undefined && alloc.hours !== null && alloc.hours !== "") ? alloc.hours : "";
        const canDelete = allocations.length > 1;

        return `
          <div class="alloc-row" data-alloc-id="${alloc.id}">
            <!-- 1. Month Dropdown -->
            <div class="alloc-field alloc-field-month">
              <label class="alloc-field-label">Month <span class="required-star">*</span></label>
              <select class="form-select alloc-month-select" data-person-id="${personId}" data-alloc-id="${alloc.id}">
                <option value="">-- Select Month --</option>
                ${monthsList.map(m => `
                  <option value="${m}" ${m === alloc.month ? "selected" : ""}>${m}</option>
                `).join("")}
              </select>
            </div>

            <!-- 2. Hours Input -->
            <div class="alloc-field alloc-field-hours">
              <label class="alloc-field-label">Hours <span class="required-star">*</span></label>
              <div class="hours-input-wrapper">
                <input type="number" 
                  class="form-control alloc-hours-input" 
                  min="0" max="744" step="0.5" 
                  value="${hoursVal}" 
                  placeholder="e.g. 40" 
                  data-person-id="${personId}" 
                  data-alloc-id="${alloc.id}">
                <span class="hours-unit">hrs</span>
              </div>
            </div>

            <!-- 3. Deliverables / Comments -->
            <div class="alloc-field alloc-field-comments">
              <label class="alloc-field-label">Deliverables, Activities &amp; Key Milestones</label>
              <input type="text" 
                class="form-control alloc-comments-input" 
                placeholder="Enter work details, deliverables, achievements for this month..." 
                value="${escapeHtml(alloc.comments || "")}" 
                data-person-id="${personId}" 
                data-alloc-id="${alloc.id}">
            </div>

            <!-- 4. Remove Row Action -->
            <div class="alloc-field alloc-field-action">
              ${canDelete ? `
                <button type="button" class="btn-remove-alloc" data-person-id="${personId}" data-alloc-id="${alloc.id}" title="Remove this month row" aria-label="Remove month row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ` : `
                <span class="alloc-action-placeholder"></span>
              `}
            </div>
          </div>
        `;
      }).join("");

      // Card Footer with "+ Add Another Month"
      const footerHtml = `
        <div class="person-card-footer">
          <button type="button" class="btn-add-alloc-month" data-person-id="${personId}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>+ Add Another Month for ${escapeHtml(person.name)}</span>
          </button>
        </div>
      `;

      card.innerHTML = headerHtml + `<div class="person-alloc-rows-container">${rowsHtml}</div>` + footerHtml;
      attachCardListeners(card, personId);
      container.appendChild(card);
    });

    updateFormSummary();
  }

  function attachCardListeners(card, personId) {
    // Remove person
    const removeBtn = card.querySelector(".btn-remove-person");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => removePersonFromForm(personId));
    }

    // Month selects
    card.querySelectorAll(".alloc-month-select").forEach(select => {
      select.addEventListener("change", (e) => {
        const allocId = select.getAttribute("data-alloc-id");
        updateAllocationField(personId, allocId, "month", e.target.value);
      });
    });

    // Hours inputs
    card.querySelectorAll(".alloc-hours-input").forEach(input => {
      input.addEventListener("input", (e) => {
        const allocId = input.getAttribute("data-alloc-id");
        updateAllocationField(personId, allocId, "hours", e.target.value);
      });
    });

    // Comments inputs
    card.querySelectorAll(".alloc-comments-input").forEach(input => {
      input.addEventListener("input", (e) => {
        const allocId = input.getAttribute("data-alloc-id");
        updateAllocationField(personId, allocId, "comments", e.target.value);
      });
    });

    // Remove single allocation month
    card.querySelectorAll(".btn-remove-alloc").forEach(btn => {
      btn.addEventListener("click", () => {
        const allocId = btn.getAttribute("data-alloc-id");
        removeMonthAllocation(personId, allocId);
      });
    });

    // Add another month button
    const addMonthBtn = card.querySelector(".btn-add-alloc-month");
    if (addMonthBtn) {
      addMonthBtn.addEventListener("click", () => {
        addMonthAllocation(personId);
      });
    }
  }

  function updatePersonSubtotal(personId) {
    const entry = formState.peopleData[personId];
    if (!entry) return;

    const subtotalEl = document.getElementById(`subtotal-${personId}`);
    if (!subtotalEl) return;

    const total = (entry.allocations || []).reduce((acc, a) => {
      const val = parseFloat(a.hours);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    subtotalEl.textContent = `Total: ${total.toFixed(1)} hrs`;
  }

  /* ========================================================
     5. FORM SUMMARY & STATS
     ======================================================== */
  function updateFormSummary() {
    const personIds = Object.keys(formState.peopleData);
    let totalMonthsLogged = 0;
    let grandTotalHours = 0;

    personIds.forEach(id => {
      const entry = formState.peopleData[id];
      if (!entry || !entry.allocations) return;
      entry.allocations.forEach(a => {
        if (a.month) {
          totalMonthsLogged++;
        }
        const val = parseFloat(a.hours);
        grandTotalHours += isNaN(val) ? 0 : val;
      });
    });

    const summaryPersonCount = document.getElementById("summary-person-count");
    const summaryMonthCount = document.getElementById("summary-month-count");

    if (summaryPersonCount) summaryPersonCount.textContent = personIds.length;
    if (summaryMonthCount) summaryMonthCount.textContent = totalMonthsLogged;
  }

  /* ========================================================
     6. SUBMISSION & DRAFT
     ======================================================== */
  function handleSubmit(e) {
    if (e) e.preventDefault();

    // 1. Validate portfolio selection
    const portfolioSelect = document.getElementById("portfolio-select-dropdown");
    if (!formState.selectedPortfolioId) {
      window.AppNotifications?.toast("Please select a Chapter Portfolio in Section 1.", "error");
      portfolioSelect?.focus?.();
      portfolioSelect?.classList.add("is-invalid");
      return;
    } else {
      portfolioSelect?.classList.remove("is-invalid");
    }

    const selectedPort = window.AppState.getPortfolioById(formState.selectedPortfolioId);
    const portfolioName = selectedPort ? selectedPort.name : formState.selectedPortfolioName || "Chapter Portfolio";

    // 2. Validate person selection
    const personIds = Object.keys(formState.peopleData);
    if (personIds.length === 0) {
      window.AppNotifications?.toast(`Please select at least one Person from ${portfolioName}.`, "error");
      document.getElementById("person-select-dropdown")?.focus?.();
      return;
    }

    // 3. Validate each person's allocations
    const entriesToSave = [];
    let missingMonthPerson = null;

    for (const pId of personIds) {
      const entry = formState.peopleData[pId];
      if (!entry) continue;

      const validAllocs = (entry.allocations || []).filter(a => a.month && a.month.trim() !== "");
      if (validAllocs.length === 0) {
        missingMonthPerson = entry.person.name;
        break;
      }

      validAllocs.forEach(alloc => {
        entriesToSave.push({
          portfolioId: formState.selectedPortfolioId,
          portfolioName: portfolioName,
          personId: entry.person.id,
          personName: entry.person.name,
          personRole: entry.person.role || "",
          month: alloc.month,
          hours: parseFloat(alloc.hours) || 0,
          comments: (alloc.comments || "").trim()
        });
      });
    }

    if (missingMonthPerson) {
      window.AppNotifications?.toast(`Please select a Month for ${missingMonthPerson}.`, "error");
      return;
    }

    if (entriesToSave.length === 0) {
      window.AppNotifications?.toast("No valid month entries found to save.", "error");
      return;
    }

    const saved = window.AppState.addLogs(entriesToSave);
    window.AppState.clearDraft();

    const totalHours = entriesToSave.reduce((sum, item) => sum + item.hours, 0);
    window.AppNotifications?.toast(
      `Successfully saved ${saved.length} allocation${saved.length > 1 ? 's' : ''} (${totalHours.toFixed(1)} total hours) for ${portfolioName}!`,
      "success"
    );

    showSubmissionSuccessModal(saved.length, portfolioName);
    resetForm(false);
  }

  function showSubmissionSuccessModal(count, portfolioName) {
    const modal = document.getElementById("submission-success-modal");
    if (!modal) return;
    const desc = document.getElementById("success-modal-desc");
    if (desc) {
      desc.textContent = `Logged ${count} resource allocation record${count > 1 ? 's' : ''} for "${portfolioName}". You can view, analyze, and download the full reports in the Reports tab.`;
    }
    modal.style.display = "flex";
  }

  function resetForm(confirmReset = true) {
    if (confirmReset && (formState.selectedPortfolioId || Object.keys(formState.peopleData).length > 0)) {
      if (!confirm("Are you sure you want to reset the form? All unsaved inputs will be cleared.")) {
        return;
      }
    }

    formState = {
      selectedPortfolioId: "",
      selectedPortfolioName: "",
      peopleData: {}
    };

    window.AppState.clearDraft();

    const portSelect = document.getElementById("portfolio-select-dropdown");
    if (portSelect) {
      portSelect.value = "";
      portSelect.classList.remove("is-invalid");
    }

    renderAll();
    if (confirmReset) {
      window.AppNotifications?.toast("Form has been reset.", "info");
    }
  }

  let draftTimeout = null;
  function saveDraftDebounced() {
    clearTimeout(draftTimeout);
    draftTimeout = setTimeout(() => {
      window.AppState.saveDraft(formState);
    }, 400);
  }

  function setupEventListeners() {
    // Portfolio dropdown listener: Changing portfolio filters persons to ONLY this portfolio's 5 persons
    const portSelect = document.getElementById("portfolio-select-dropdown");
    if (portSelect) {
      portSelect.addEventListener("change", (e) => {
        const newPortId = e.target.value;
        const oldPortId = formState.selectedPortfolioId;

        if (newPortId !== oldPortId) {
          formState.selectedPortfolioId = newPortId;
          const port = window.AppState.getPortfolioById(newPortId);
          formState.selectedPortfolioName = port ? port.name : "";

          // Clear previously selected people from other portfolio
          formState.peopleData = {};

          portSelect.classList.remove("is-invalid");
          saveDraftDebounced();
          renderAll();

          if (port) {
            window.AppNotifications?.toast(`Selected ${port.name}. Loaded 5 persons in Person dropdown.`, "info");
          }
        }
      });
    }

    // Dropdown selection for persons (auto-adds person on selection)
    const personSelect = document.getElementById("person-select-dropdown");
    if (personSelect) {
      personSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val) {
          addPersonToForm(val);
          e.target.value = "";
        }
      });
    }

    // Select all 5 persons for current portfolio
    const selectAllBtn = document.getElementById("btn-select-all-people");
    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => {
        if (!formState.selectedPortfolioId) {
          window.AppNotifications?.toast("Please select a Chapter Portfolio in Section 1 first.", "info");
          document.getElementById("portfolio-select-dropdown")?.focus?.();
          return;
        }

        const peopleInPort = window.AppState.getActivePeople(formState.selectedPortfolioId);
        let addedCount = 0;
        peopleInPort.forEach(p => {
          if (!formState.peopleData[p.id]) {
            addPersonToForm(p.id, false);
            addedCount++;
          }
        });

        saveDraftDebounced();
        renderAll();

        const portName = window.AppState.getPortfolioById(formState.selectedPortfolioId)?.name || "Portfolio";
        if (addedCount > 0) {
          window.AppNotifications?.toast(`All ${peopleInPort.length} persons for ${portName} added to the form.`, "success");
        } else {
          window.AppNotifications?.toast(`All ${peopleInPort.length} persons for ${portName} are already added.`, "info");
        }
      });
    }

    // Clear all people
    const clearBtn = document.getElementById("btn-clear-people");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        formState.peopleData = {};
        saveDraftDebounced();
        renderAll();
      });
    }

    const form = document.getElementById("timesheet-form");
    if (form) {
      form.addEventListener("submit", handleSubmit);
    }

    const resetBtn = document.getElementById("btn-reset-form");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => resetForm(true));
    }

    // Success modal buttons
    const closeSuccessBtn = document.getElementById("btn-close-success-modal");
    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener("click", () => {
        document.getElementById("submission-success-modal").style.display = "none";
      });
    }

    const viewReportsBtn = document.getElementById("btn-view-reports-from-modal");
    if (viewReportsBtn) {
      viewReportsBtn.addEventListener("click", () => {
        document.getElementById("submission-success-modal").style.display = "none";
        window.AppRouter?.navigate("reports");
      });
    }

    // Reactively refresh when people or portfolios change
    window.addEventListener("app:people-changed", () => {
      setupPersonDropdown();
      renderPersonCards();
      updateFormSummary();
    });

    window.addEventListener("app:portfolios-changed", () => {
      setupPortfolioDropdown();
      setupPersonDropdown();
    });

    window.addEventListener("app:state-reset", () => {
      resetForm(false);
    });
  }

  function renderAll() {
    setupPortfolioDropdown();
    setupPersonDropdown();
    renderPersonCards();
    updateFormSummary();
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

  window.FormController = {
    init: initForm,
    renderAll,
    resetForm
  };
})();
