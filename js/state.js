/**
 * PMIPCC State Management & LocalStorage Persistence
 * Reactive event dispatcher for portfolios, persons/people, and allocation logs.
 */

(function () {
  const STORAGE_KEYS = {
    PORTFOLIOS: "pmipcc_portfolios_v5",
    PEOPLE: "pmipcc_people_v5",
    LOGS: "pmipcc_logs_v3",
    DRAFT: "pmipcc_form_draft_v5"
  };

  class StateManager {
    constructor() {
      this.init();
    }

    getApiUrl(endpoint) {
      if (typeof window === "undefined") return endpoint;
      const loc = window.location;
      // If loaded over HTTP or HTTPS from a web server
      if (loc.protocol === "http:" || loc.protocol === "https:") {
        // If loaded via VS Code Live Server on port 5500, forward API to port 3000
        if (loc.port === "5500") {
          const host = (loc.hostname && loc.hostname !== "") ? loc.hostname : "127.0.0.1";
          return `http://${host}:3000${endpoint}`;
        }
        // For port 3000, dev tunnels, mobile LAN IPs, custom ports: clean relative URL
        return endpoint;
      }
      // If loaded via file:///
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
      const host = isMobile ? "192.168.1.9" : "127.0.0.1";
      return `http://${host}:3000${endpoint}`;
    }

    init() {
      // Clear older version sample logs and stale form drafts so no portfolio is preselected on start
      try {
        localStorage.removeItem("pmipcc_logs_v2");
        localStorage.removeItem("pmipcc_logs");
        localStorage.removeItem(STORAGE_KEYS.DRAFT);
        localStorage.removeItem("pmipcc_security_logs_v1");
        localStorage.removeItem("pmipcc_active_security_session_v1");
      } catch (e) {}

      // Seed with PMIPCC board members & portfolios if empty
      const existingPorts = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
      let parsedPorts = [];
      try { parsedPorts = existingPorts ? JSON.parse(existingPorts) : []; } catch (e) { parsedPorts = []; }
      if (!Array.isArray(parsedPorts) || parsedPorts.length === 0) {
        this.savePortfolios(window.INITIAL_DATA.portfolios);
      }

      const existingPeople = localStorage.getItem(STORAGE_KEYS.PEOPLE);
      let parsedPeople = [];
      try { parsedPeople = existingPeople ? JSON.parse(existingPeople) : []; } catch (e) { parsedPeople = []; }
      if (!Array.isArray(parsedPeople) || parsedPeople.length === 0) {
        this.savePeople(window.INITIAL_DATA.people);
      }

      // Self-heal / synchronize: ensure people match portfolio status
      try {
        const ports = this.getPortfolios();
        const people = this.getPeople();
        let modified = false;

        ports.forEach(port => {
          const portActive = (port.status || "").toLowerCase().trim() === "active";
          // Find all people mapped to this portfolio
          const mappedPeople = people.filter(p => p.portfolioId === port.id);

          if (mappedPeople.length > 0 && !portActive) {
            // If portfolio is not active, ensure all mapped people are also inactive
            mappedPeople.forEach(p => {
              if ((p.status || "").toLowerCase().trim() === "active") {
                p.status = port.status || "inactive";
                modified = true;
              }
            });
          }
        });

        if (modified) {
          localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
        }
      } catch (e) {
        console.error("Error synchronizing portfolios and people", e);
      }

      // Seed with chapter allocation records if empty
      const existingLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      let parsedLogs = [];
      try { parsedLogs = existingLogs ? JSON.parse(existingLogs) : []; } catch (e) { parsedLogs = []; }
      if (!Array.isArray(parsedLogs) || parsedLogs.length === 0) {
        if (window.INITIAL_DATA && Array.isArray(window.INITIAL_DATA.logs) && window.INITIAL_DATA.logs.length > 0) {
          this.saveLogs(window.INITIAL_DATA.logs);
        } else {
          this.saveLogs([]);
        }
      }

      // Initial two-way synchronization with central server across mobile & laptop
      this.syncWithServer();

      // Periodic real-time background sync (every 2 seconds, on focus, and on online)
      if (typeof window !== "undefined") {
        setInterval(() => {
          this.syncWithServer();
        }, 2000);

        window.addEventListener("focus", () => {
          this.syncWithServer();
        });

        window.addEventListener("online", () => {
          this.syncWithServer();
        });
      }
    }

    resetToPmipccDefaults() {
      this.savePortfolios(window.INITIAL_DATA.portfolios);
      this.savePeople(window.INITIAL_DATA.people);
      this.saveLogs([]);
      this.clearDraft();
      this.dispatch("state-reset");
    }

    /* ========================================================
       PORTFOLIOS CRUD
       ======================================================== */
    getPortfolios(statusFilter = null) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
        const list = raw ? JSON.parse(raw) : [];
        if (statusFilter && statusFilter !== "all") {
          const normFilter = statusFilter.toLowerCase().trim();
          return list.filter(p => (p.status || "active").toLowerCase().trim() === normFilter);
        }
        return list;
      } catch (e) {
        console.error("Error reading portfolios", e);
        return [];
      }
    }

    getActivePortfolios() {
      return this.getPortfolios().filter(p => (p.status || "").toLowerCase().trim() === "active");
    }

    getPortfolioById(id) {
      return this.getPortfolios().find(p => p.id === id) || null;
    }

    savePortfolios(portfolios) {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
      this.dispatch("portfolios-changed", { portfolios });
    }

    addPortfolio({ name, code, description, status = "active", leadPersonName = "" }) {
      const portfolios = this.getPortfolios();
      const newPortfolio = {
        id: "port-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        code: (code || "").trim().toUpperCase(),
        description: (description || "").trim(),
        status: status || "active",
        leadPersonName: leadPersonName.trim(),
        createdAt: new Date().toISOString()
      };
      portfolios.push(newPortfolio);
      this.savePortfolios(portfolios);

      // Instantly synchronize with central server
      try {
        fetch(this.getApiUrl("/api/portfolios"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPortfolio)
        }).catch(() => {});
      } catch (e) {}

      // Automatically register the person into people directory so they appear in Person Dropdown
      const personName = (leadPersonName || "").trim() || name.trim();
      if (personName) {
        const people = this.getPeople();
        const existingIdx = people.findIndex(p => 
          p.portfolioId === newPortfolio.id || 
          (p.name || "").toLowerCase().trim() === personName.toLowerCase().trim()
        );

        if (existingIdx !== -1) {
          people[existingIdx].portfolioId = newPortfolio.id;
          people[existingIdx].status = newPortfolio.status;
          this.savePeople(people);
        } else {
          this.addPerson({
            name: personName,
            role: leadPersonName.trim() ? `${name.trim()} Lead` : `${name.trim()} Member`,
            email: `${(code || name).toLowerCase().replace(/[^a-z0-9]/g, "")}@pmi-pcc.org`,
            portfolioId: newPortfolio.id,
            status: newPortfolio.status
          });
        }
      }

      this.dispatch("portfolios-changed", { portfolios: this.getPortfolios() });
      this.dispatch("people-changed", { people: this.getPeople() });
      return newPortfolio;
    }

    updatePortfolio(id, data) {
      const portfolios = this.getPortfolios();
      const index = portfolios.findIndex(p => p.id === id);
      if (index === -1) return null;

      const oldPort = { ...portfolios[index] };

      portfolios[index] = {
        ...portfolios[index],
        ...data,
        name: data.name !== undefined ? data.name.trim() : portfolios[index].name,
        code: data.code !== undefined ? data.code.trim().toUpperCase() : portfolios[index].code,
        description: data.description !== undefined ? data.description.trim() : portfolios[index].description,
        status: data.status !== undefined ? data.status : portfolios[index].status,
        leadPersonName: data.leadPersonName !== undefined ? data.leadPersonName.trim() : portfolios[index].leadPersonName,
        updatedAt: new Date().toISOString()
      };

      const updatedPort = portfolios[index];
      this.savePortfolios(portfolios);

      // Cascade status changes & update people
      const people = this.getPeople();
      let modified = false;

      // 1. If status is updated, cascade to all people belonging to this portfolio
      if (data.status !== undefined) {
        people.forEach(p => {
          if (
            p.portfolioId === id ||
            (oldPort.leadPersonName && (p.name || "").toLowerCase().trim() === oldPort.leadPersonName.toLowerCase().trim()) ||
            (oldPort.name && (p.name || "").toLowerCase().trim() === oldPort.name.toLowerCase().trim())
          ) {
            p.status = data.status;
            modified = true;
          }
        });
      }

      // 2. If leadPersonName is updated
      if (data.leadPersonName !== undefined && data.leadPersonName.trim()) {
        const leadName = data.leadPersonName.trim();
        const mapped = people.find(p => p.portfolioId === id);
        if (mapped) {
          mapped.name = leadName;
          mapped.initials = leadName.split(/\s+/).map(p => p[0]).join("").toUpperCase().substring(0, 3);
          if (data.status !== undefined) mapped.status = data.status;
          modified = true;
        } else {
          this.addPerson({
            name: leadName,
            role: `${updatedPort.name} Lead`,
            portfolioId: id,
            status: updatedPort.status
          });
        }
      }

      if (modified) {
        this.savePeople(people);
      }

      this.dispatch("portfolios-changed", { portfolios: this.getPortfolios() });
      this.dispatch("people-changed", { people: this.getPeople() });

      // Instantly synchronize with central server
      try {
        fetch(this.getApiUrl(`/api/portfolios/${encodeURIComponent(id)}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).catch(() => {});
      } catch (e) {}

      return updatedPort;
    }

    setPortfolioStatus(id, newStatus) {
      return this.updatePortfolio(id, { status: newStatus });
    }

    deletePortfolio(id) {
      const portfolios = this.getPortfolios();
      const filtered = portfolios.filter(p => p.id !== id);
      this.savePortfolios(filtered);

      const people = this.getPeople();
      const remaining = people.filter(p => p.portfolioId !== id);
      this.savePeople(remaining);

      // Instantly synchronize with central server
      try {
        fetch(this.getApiUrl(`/api/portfolios/${encodeURIComponent(id)}`), {
          method: "DELETE"
        }).catch(() => {});
      } catch (e) {}

      this.dispatch("portfolios-changed", { portfolios: filtered });
      this.dispatch("people-changed", { people: remaining });
      return true;
    }

    /* ========================================================
       PEOPLE / PERSONS CRUD
       ======================================================== */
    getPeople(portfolioId = null, statusFilter = null) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PEOPLE);
        let list = raw ? JSON.parse(raw) : [];
        if (portfolioId && portfolioId !== "all") {
          list = list.filter(p => p.portfolioId === portfolioId);
        }
        if (statusFilter && statusFilter !== "all") {
          const normStatus = statusFilter.toLowerCase().trim();
          const allPorts = this.getPortfolios();
          const inactivePortIds = new Set(allPorts.filter(port => (port.status || "").toLowerCase().trim() === "inactive").map(port => port.id));

          if (normStatus === "inactive") {
            // A person is inactive if their own status is inactive OR their assigned portfolio is inactive
            list = list.filter(p => {
              const pStatus = (p.status || "active").toLowerCase().trim();
              return pStatus === "inactive" || (p.portfolioId && inactivePortIds.has(p.portfolioId));
            });
          } else if (normStatus === "active") {
            // A person is active only if their own status is active AND their portfolio is not inactive
            list = list.filter(p => {
              const pStatus = (p.status || "active").toLowerCase().trim();
              return pStatus === "active" && (!p.portfolioId || !inactivePortIds.has(p.portfolioId));
            });
          }
        }
        return list;
      } catch (e) {
        console.error("Error reading people", e);
        return [];
      }
    }

    getActivePeople(portfolioId = null) {
      const allPortfolios = this.getPortfolios();
      const activePortfolios = allPortfolios.filter(p => (p.status || "").toLowerCase().trim() === "active");
      const activePortIds = new Set(activePortfolios.map(p => p.id));

      const inactivePortfolios = allPortfolios.filter(p => (p.status || "").toLowerCase().trim() !== "active");
      const inactivePortIds = new Set(inactivePortfolios.map(p => p.id));
      const inactivePortNames = new Set(inactivePortfolios.map(p => (p.name || "").toLowerCase().trim()));
      const inactiveLeadNames = new Set(
        inactivePortfolios
          .map(p => (p.leadPersonName || "").toLowerCase().trim())
          .filter(Boolean)
      );

      return this.getPeople(portfolioId).filter(p => {
        const pStatus = (p.status || "").toLowerCase().trim();
        // 1. Person status must be active
        if (pStatus !== "active") return false;

        // 2. If assigned to a portfolio, that portfolio must not be inactive
        if (p.portfolioId && inactivePortIds.has(p.portfolioId)) return false;

        // 3. If assigned to a portfolio, that portfolio must be in activePortIds
        if (p.portfolioId && !activePortIds.has(p.portfolioId)) return false;

        // 4. If person matches inactive portfolio lead or name
        const pName = (p.name || "").toLowerCase().trim();
        if (inactiveLeadNames.has(pName)) return false;
        if (inactivePortNames.has(pName)) return false;

        return true;
      });
    }

    getPersonById(id) {
      return this.getPeople().find(p => p.id === id) || null;
    }

    savePeople(people) {
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
      this.dispatch("people-changed", { people });
    }

    addPerson({ name, role, email, portfolioId = "", status = "active" }) {
      const people = this.getPeople();
      const initials = name.trim().split(/\s+/).map(p => p[0]).join("").toUpperCase().substring(0, 3);
      const newPerson = {
        id: "per-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        role: (role || "Chapter Volunteer").trim(),
        email: (email || "").trim(),
        portfolioId: portfolioId || "",
        status: status || "active",
        initials,
        createdAt: new Date().toISOString()
      };
      people.push(newPerson);
      this.savePeople(people);

      // Instantly synchronize with central server
      try {
        fetch(this.getApiUrl("/api/people"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPerson)
        }).catch(() => {});
      } catch (e) {}

      return newPerson;
    }

    updatePerson(id, data) {
      const people = this.getPeople();
      const index = people.findIndex(p => p.id === id);
      if (index === -1) return null;

      people[index] = {
        ...people[index],
        ...data,
        name: data.name !== undefined ? data.name.trim() : people[index].name,
        role: data.role !== undefined ? data.role.trim() : people[index].role,
        email: data.email !== undefined ? data.email.trim() : people[index].email,
        portfolioId: data.portfolioId !== undefined ? data.portfolioId : people[index].portfolioId,
        status: data.status !== undefined ? data.status : people[index].status,
        updatedAt: new Date().toISOString()
      };

      this.savePeople(people);

      // Instantly synchronize with central server
      try {
        fetch(this.getApiUrl(`/api/people/${encodeURIComponent(id)}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).catch(() => {});
      } catch (e) {}

      return people[index];
    }

    setPersonStatus(id, newStatus) {
      const updated = this.updatePerson(id, { status: newStatus });
      this.dispatch("people-changed", { people: this.getPeople() });
      this.dispatch("portfolios-changed", { portfolios: this.getPortfolios() });
      return updated;
    }

    deletePerson(id) {
      const people = this.getPeople();
      const filtered = people.filter(p => p.id !== id);
      this.savePeople(filtered);

      // Instantly synchronize with central server
      try {
        fetch(this.getApiUrl(`/api/people/${encodeURIComponent(id)}`), {
          method: "DELETE"
        }).catch(() => {});
      } catch (e) {}

      this.dispatch("people-changed", { people: filtered });
      this.dispatch("portfolios-changed", { portfolios: this.getPortfolios() });
      return true;
    }

    /* ========================================================
       TIMESHEET / ALLOCATION LOGS
       ======================================================== */
    getLogs(filters = {}) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
        let list = raw ? JSON.parse(raw) : [];

        if (filters.portfolioId && filters.portfolioId !== "all") {
          list = list.filter(l => l.portfolioId === filters.portfolioId);
        }
        if (filters.personId && filters.personId !== "all") {
          list = list.filter(l => l.personId === filters.personId);
        }
        if (filters.month && filters.month !== "all") {
          list = list.filter(l => l.month && l.month.toLowerCase() === filters.month.toLowerCase());
        }
        if (filters.query && filters.query.trim()) {
          const q = filters.query.toLowerCase().trim();
          list = list.filter(l =>
            (l.personName && l.personName.toLowerCase().includes(q)) ||
            (l.portfolioName && l.portfolioName.toLowerCase().includes(q)) ||
            (l.month && l.month.toLowerCase().includes(q)) ||
            (l.comments && l.comments.toLowerCase().includes(q))
          );
        }
        return list;
      } catch (e) {
        console.error("Error reading logs", e);
        return [];
      }
    }

    saveLogs(logs) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      this.dispatch("logs-changed", { logs });
    }

    addLogs(entries) {
      const current = this.getLogs();
      const now = new Date().toISOString();
      const batchId = "batch-" + Date.now();

      const currentYear = new Date().getFullYear();
      const newEntries = entries.map((entry, idx) => ({
        id: "log-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 5),
        batchId,
        portfolioId: entry.portfolioId,
        portfolioName: entry.portfolioName,
        personId: entry.personId,
        personName: entry.personName,
        personRole: entry.personRole || "",
        year: entry.year ? parseInt(entry.year, 10) : (entry.submittedAt ? new Date(entry.submittedAt).getFullYear() : currentYear),
        month: entry.month,
        hours: parseFloat(entry.hours) || 0,
        comments: (entry.comments || "").trim(),
        submittedAt: entry.submittedAt || now,
        _synced: false
      }));

      const updated = [...newEntries, ...current];
      this.saveLogs(updated);

      // Immediately push to server in background
      this.pushLogsToServer(newEntries);

      return newEntries;
    }

    async pushLogsToServer(entries) {
      if (!Array.isArray(entries) || entries.length === 0) return;
      try {
        const url = this.getApiUrl("/api/logs");
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entries),
          cache: "no-store"
        });
        if (res.ok) {
          const result = await res.json();
          if (result && Array.isArray(result.logs)) {
            const serverLogs = result.logs;
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(serverLogs));
            this.dispatch("logs-changed", { logs: serverLogs });
          }
        }
      } catch (e) {
        // Will be retried on next syncWithServer cycle
      }
    }

    updateLog(id, updateData) {
      const logs = this.getLogs();
      const idx = logs.findIndex(l => l.id === id);
      if (idx === -1) return null;

      logs[idx] = {
        ...logs[idx],
        ...updateData,
        year: updateData.year !== undefined ? parseInt(updateData.year, 10) : (logs[idx].year || (logs[idx].submittedAt ? new Date(logs[idx].submittedAt).getFullYear() : new Date().getFullYear())),
        hours: updateData.hours !== undefined ? parseFloat(updateData.hours) || 0 : logs[idx].hours,
        comments: updateData.comments !== undefined ? (updateData.comments || "").trim() : logs[idx].comments,
        updatedAt: new Date().toISOString()
      };

      this.saveLogs(logs);

      try {
        const url = this.getApiUrl(`/api/logs/${encodeURIComponent(id)}`);
        fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
          cache: "no-store"
        }).catch(() => {});
      } catch (e) {}

      return logs[idx];
    }

    deleteLog(id) {
      const logs = this.getLogs();
      const filtered = logs.filter(l => l.id !== id);
      this.saveLogs(filtered);

      try {
        const url = this.getApiUrl(`/api/logs/${encodeURIComponent(id)}`);
        fetch(url, { method: "DELETE", cache: "no-store" }).catch(() => {});
      } catch (e) {}

      return true;
    }

    /* ========================================================
       DRAFT PERSISTENCE
       ======================================================== */
    saveDraft(formData) {
      try {
        localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(formData));
      } catch (e) {
        console.error("Error saving draft", e);
      }
    }

    getDraft() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    // Two-Way Cross-Device Server Synchronization Pipeline (Mobile + Laptop + Tablet)
    async syncWithServer() {
      if (this._isSyncing) return;
      this._isSyncing = true;
      try {
        const url = this.getApiUrl("/api/sync");
        const localLogs = this.getLogs();
        const unsyncedLogs = localLogs.filter(l => l && l._synced === false);

        let res;
        if (unsyncedLogs.length > 0) {
          // Push any pending unsynced records to the central server
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ logs: unsyncedLogs }),
            cache: "no-store"
          });
        } else {
          res = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
          });
        }

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object") {
            // 1. Two-Way Sync Allocation Records
            if (Array.isArray(data.logs)) {
              const serverLogs = data.logs;
              serverLogs.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));

              // Retain any pending unsynced local records not yet received by the server
              const serverIdSet = new Set(serverLogs.map(l => l.id));
              const pendingUnsynced = this.getLogs().filter(l => l && l._synced === false && !serverIdSet.has(l.id));
              const combinedLogs = [...pendingUnsynced, ...serverLogs];

              const curLogs = this.getLogs();
              const serverFingerprint = combinedLogs.map(l => `${l.id}:${l.hours}:${l.month}`).join("|");
              const localFingerprint = curLogs.map(l => `${l.id}:${l.hours}:${l.month}`).join("|");

              if (serverFingerprint !== localFingerprint || combinedLogs.length !== curLogs.length) {
                localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(combinedLogs));
                this.dispatch("logs-changed", { logs: combinedLogs });
              }
            }

            // 2. Sync Portfolios
            if (Array.isArray(data.portfolios) && data.portfolios.length > 0) {
              const localPorts = this.getPortfolios();
              const serverPortFingerprint = data.portfolios.map(p => `${p.id}:${p.status}:${p.leadPersonName}:${p.name}`).join("|");
              const localPortFingerprint = localPorts.map(p => `${p.id}:${p.status}:${p.leadPersonName}:${p.name}`).join("|");

              if (serverPortFingerprint !== localPortFingerprint || data.portfolios.length !== localPorts.length) {
                localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(data.portfolios));
                this.dispatch("portfolios-changed", { portfolios: data.portfolios });
              }
            }

            // 3. Sync People
            if (Array.isArray(data.people) && data.people.length > 0) {
              const localPeople = this.getPeople();
              const serverPeopleFingerprint = data.people.map(p => `${p.id}:${p.status}:${p.role}:${p.name}`).join("|");
              const localPeopleFingerprint = localPeople.map(p => `${p.id}:${p.status}:${p.role}:${p.name}`).join("|");

              if (serverPeopleFingerprint !== localPeopleFingerprint || data.people.length !== localPeople.length) {
                localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(data.people));
                this.dispatch("people-changed", { people: data.people });
              }
            }
          }
        }
      } catch (e) {
        // Fallback to local offline state when server is unavailable
      } finally {
        this._isSyncing = false;
      }
    }

    clearDraft() {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    }

    exportAllData() {
      return {
        chapter: "PMI Pearl City Chapter Hyderabad",
        portfolios: this.getPortfolios(),
        people: this.getPeople(),
        logs: this.getLogs(),
        exportedAt: new Date().toISOString(),
        version: "2.0-pmipcc"
      };
    }

    importData(data) {
      if (!data || typeof data !== "object") throw new Error("Invalid import payload");
      if (Array.isArray(data.portfolios)) this.savePortfolios(data.portfolios);
      if (Array.isArray(data.people)) this.savePeople(data.people);
      if (Array.isArray(data.logs)) this.saveLogs(data.logs);
      this.dispatch("state-imported");
    }

    dispatch(eventName, detail = {}) {
      window.dispatchEvent(new CustomEvent(`app:${eventName}`, { detail }));
    }
  }

  window.AppState = new StateManager();
})();

