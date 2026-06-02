const defaultDevices = [
  { name: "DEMO01-CORE", ip: "192.168.1.1", site: "DEMO01", role: "Core", model: "Catalyst 9300", version: "17.9.5", status: "Up" },
  { name: "DEMO01-DIST-A", ip: "192.168.1.2", site: "DEMO01", role: "Distribution", model: "Catalyst 9300", version: "17.9.5", status: "Up" },
  { name: "DEMO02-ACCESS-A", ip: "192.168.1.3", site: "DEMO02", role: "Access", model: "Catalyst 9200", version: "17.9.5", status: "Up" },
  { name: "DEMO02-ACCESS-B", ip: "192.168.1.4", site: "DEMO02", role: "Access", model: "Catalyst 9200", version: "17.9.5", status: "Up" },
  { name: "DEMO03-EDGE", ip: "192.168.1.5", site: "DEMO03", role: "Edge", model: "Catalyst 9500", version: "17.6.4", status: "Review" },
  { name: "DEMO03-ACCESS-A", ip: "192.168.1.6", site: "DEMO03", role: "Access", model: "Catalyst 9200", version: "17.6.4", status: "Review" },
  { name: "DEMO04-LAB", ip: "192.168.1.7", site: "DEMO04", role: "Lab", model: "Catalyst 1000", version: "17.9.5", status: "Up" },
  { name: "DEMO04-AP-CTRL", ip: "192.168.1.8", site: "DEMO04", role: "Wireless", model: "Controller", version: "8.10", status: "Up" }
];

const commandTemplates = [
  "show interfaces status",
  "show version",
  "show inventory",
  "show ip interface brief",
  "show logging | include ERROR",
  "show running-config"
];

let devices = JSON.parse(localStorage.getItem("mcc_devices") || "null") || defaultDevices;
let sites = JSON.parse(localStorage.getItem("mcc_sites") || "null") || ["DEMO01", "DEMO02", "DEMO03", "DEMO04"];

const events = [
  { level: "info", title: "Inventory sync completed", detail: "8 demo devices were normalized into the inventory table." },
  { level: "warn", title: "Version drift detected", detail: "DEMO03 has two devices running 17.6.4." },
  { level: "ok", title: "Backup policy healthy", detail: "Latest configuration backup completed for DEMO01." },
  { level: "info", title: "Topology cache refreshed", detail: "Fabric links were recalculated for demo topology." }
];

const assurance = [
  { title: "Version Alignment", score: "78%", state: "review", detail: "DEMO03 should be aligned to 17.9.5." },
  { title: "Backup Coverage", score: "100%", state: "ok", detail: "All demo devices have recent backups." },
  { title: "Access Hygiene", score: "92%", state: "ok", detail: "No fixed demo password is published." },
  { title: "Topology Health", score: "95%", state: "ok", detail: "All core links are represented." }
];

const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const authButton = document.querySelector("#authButton");
const authNote = document.querySelector("#authNote");
const activeUser = document.querySelector("#activeUser");
const globalSearch = document.querySelector("#globalSearch");
const siteFilter = document.querySelector("#siteFilter");
const deviceSite = document.querySelector("#deviceSite");
const commandTemplate = document.querySelector("#commandTemplate");
let authMode = localStorage.getItem("mcc_demo_account") ? "signin" : "create";

function now() {
  return new Date().toLocaleString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });

  const hasAccount = Boolean(localStorage.getItem("mcc_demo_account"));
  const username = document.querySelector("#username");
  const password = document.querySelector("#password");

  if (mode === "create") {
    username.value = "";
    password.value = "";
    username.placeholder = "Choose a username";
    password.placeholder = "Choose a password";
    password.autocomplete = "new-password";
    authButton.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create demo workspace';
    authNote.textContent = "No fixed password is published. Your demo access is stored only in this browser.";
  } else {
    const account = hasAccount ? JSON.parse(localStorage.getItem("mcc_demo_account")) : null;
    username.value = account ? account.username : "";
    password.value = "";
    username.placeholder = "Username";
    password.placeholder = "Password";
    password.autocomplete = "current-password";
    authButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign in';
    authNote.textContent = hasAccount ? "Use the demo account you created in this browser." : "No demo account exists yet. Create one first.";
  }
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewName);
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  viewTitle.textContent = viewName.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function filteredDevices() {
  const query = (globalSearch.value || "").toLowerCase().trim();
  const site = siteFilter ? siteFilter.value : "all";
  return devices.filter((device) => {
    const haystack = `${device.name} ${device.ip} ${device.site} ${device.role} ${device.model} ${device.version}`.toLowerCase();
    return (!query || haystack.includes(query)) && (site === "all" || device.site === site);
  });
}

function saveWorkspace() {
  localStorage.setItem("mcc_devices", JSON.stringify(devices));
  localStorage.setItem("mcc_sites", JSON.stringify(sites));
}

function renderInventory() {
  const rows = filteredDevices().map((device) => {
    const status = device.status === "Up" ? "up" : "review";
    return `
      <tr>
        <td><input type="radio" name="selectedDevice" value="${escapeHtml(device.ip)}" aria-label="Select ${escapeHtml(device.name)}"></td>
        <td>${escapeHtml(device.name)}</td>
        <td>${escapeHtml(device.ip)}</td>
        <td>${escapeHtml(device.site)}</td>
        <td>${escapeHtml(device.role)}</td>
        <td>${escapeHtml(device.model)}</td>
        <td>${escapeHtml(device.version)}</td>
        <td><span class="badge ${status}">${escapeHtml(device.status)}</span></td>
      </tr>
    `;
  }).join("");

  document.querySelector("#inventoryRows").innerHTML = rows || '<tr><td colspan="8">No demo devices match the current filter.</td></tr>';
}

function renderFilters() {
  const normalizedSites = [...new Set([...sites, ...devices.map((device) => device.site)])];
  sites = normalizedSites;
  siteFilter.innerHTML = '<option value="all">All sites</option>' + sites.map((site) => `<option value="${site}">${site}</option>`).join("");
  deviceSite.innerHTML = sites.map((site) => `<option value="${site}">${site}</option>`).join("");
  document.querySelector("#commandTarget").innerHTML = devices.map((device) => `<option value="${device.ip}">${device.name} - ${device.ip}</option>`).join("");
  commandTemplate.innerHTML = commandTemplates.map((command) => `<option value="${escapeHtml(command)}">${escapeHtml(command)}</option>`).join("");
}

function renderSites() {
  document.querySelector("#siteGrid").innerHTML = sites.map((site) => {
    const siteDevices = devices.filter((device) => device.site === site);
    const reviewCount = siteDevices.filter((device) => device.status !== "Up").length;
    return `
      <article class="site-card">
        <div><span>Site</span><strong>${site}</strong></div>
        <div><span>Devices</span><strong>${siteDevices.length}</strong></div>
        <span>${reviewCount ? `${reviewCount} review item` : "Healthy"}</span>
      </article>
    `;
  }).join("");
}

function renderUpgradeSwitches() {
  document.querySelector("#upgradeSwitches").innerHTML = devices.map((device, index) => `
    <label class="switch-choice">
      <input type="checkbox" value="${device.ip}" ${index < 2 ? "checked" : ""}>
      <span>${escapeHtml(device.name)}</span>
      <small>${escapeHtml(device.ip)} - ${escapeHtml(device.version)}</small>
    </label>
  `).join("");
}

function renderTimeline() {
  document.querySelector("#timelineList").innerHTML = events.map((event) => `
    <div class="timeline-item ${event.level}">
      <span></span>
      <div><strong>${event.title}</strong><small>${event.detail}</small></div>
    </div>
  `).join("");

  document.querySelector("#alertsList").innerHTML = events.filter((event) => event.level === "warn").map((event) => `
    <div class="event-row warn"><strong>${event.title}</strong><span>${event.detail}</span></div>
  `).join("") || '<div class="event-row"><strong>No active alerts</strong><span>Demo environment is clean.</span></div>';
}

function renderAssurance() {
  document.querySelector("#assuranceCards").innerHTML = assurance.map((item) => `
    <article class="mini-card ${item.state}">
      <span>${item.title}</span>
      <strong>${item.score}</strong>
      <small>${item.detail}</small>
    </article>
  `).join("");
}

function renderBackups() {
  document.querySelector("#backupCards").innerHTML = devices.slice(0, 4).map((device, index) => `
    <article class="mini-card ok">
      <span>${device.name}</span>
      <strong>${18 - index}:00</strong>
      <small>backup_${device.site}_${device.ip.replaceAll(".", "_")}.txt</small>
    </article>
  `).join("");
}

function renderAiPlan() {
  document.querySelector("#aiPlan").innerHTML = [
    ["Assess", "Review DEMO03 version drift and confirm maintenance window."],
    ["Protect", "Keep credentials out of repository files and use browser-created demo access."],
    ["Operate", "Run backup, port check, and image workflow simulations from the console."],
    ["Document", "Use the repository runbooks as portfolio-ready operating evidence."]
  ].map(([title, detail]) => `
    <article class="mini-card">
      <span>${title}</span>
      <strong>${title.slice(0, 2).toUpperCase()}</strong>
      <small>${detail}</small>
    </article>
  `).join("");
}

function renderJobs(extra = "") {
  const jobs = [
    ["Completed", "Inventory sync", "8 devices normalized"],
    ["Completed", "Backup sweep", "4 configs saved"],
    ["Waiting", "Upgrade review", "DEMO03 pending approval"]
  ];
  if (extra) jobs.unshift(["Queued", extra, "Demo task added"]);
  document.querySelector("#jobsList").innerHTML = jobs.map(([state, title, detail]) => `
    <div class="event-row"><strong>${state}: ${title}</strong><span>${detail}</span></div>
  `).join("");
}

function bootWorkspace(username) {
  activeUser.textContent = `User: ${username}`;
  loginView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  setView("dashboard");
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value.trim();

  if (!username || password.length < 6) {
    alert("Choose a username and a password with at least 6 characters.");
    return;
  }

  if (authMode === "create") {
    localStorage.setItem("mcc_demo_account", JSON.stringify({ username, password }));
    bootWorkspace(username);
    return;
  }

  const account = JSON.parse(localStorage.getItem("mcc_demo_account") || "null");
  if (account && username === account.username && password === account.password) {
    bootWorkspace(username);
    return;
  }

  alert("The username or password does not match the demo account stored in this browser.");
});

logoutButton.addEventListener("click", () => {
  appView.classList.add("is-hidden");
  loginView.classList.remove("is-hidden");
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-auth-mode]").forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});

globalSearch.addEventListener("input", () => {
  renderInventory();
  if (!document.querySelector("#inventory").classList.contains("active")) setView("inventory");
});

siteFilter.addEventListener("change", renderInventory);

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    const action = button.dataset.action;

    if (action === "analyze" || action === "ai-plan") {
      document.querySelector("#aiNotes").textContent =
        `[${now()}] AI demo analysis\n` +
        "Priority: review DEMO03 version drift.\n" +
        "Recommendation: align DEMO03 to 17.9.5 after backup validation.\n" +
        "Evidence: inventory, backups, topology, and assurance all agree.\n" +
        "Risk: low in demo mode. No production systems are connected.";
      setView(action === "ai-plan" ? "ai-center" : "dashboard");
    }

    if (action === "refresh" || action === "discover") {
      document.querySelector("#aiNotes").textContent = `[${now()}] Demo data refreshed. Fleet health remains 92%.`;
    }

    if (action === "backup") {
      document.querySelector("#backupLog").textContent =
        `[${now()}] Starting backup for 192.168.1.1\n` +
        "show running-config\n" +
        "Saved backup_DEMO01_CORE_demo.txt\n" +
        "Result: success";
    }

    if (action === "upgrade") {
      const bar = document.querySelector("#upgradeBar");
      const selected = [...document.querySelectorAll("#upgradeSwitches input:checked")].map((item) => item.value);
      if (!selected.length) {
        alert("Select at least one switch to upgrade.");
        return;
      }
      document.querySelector("#upgradeTargets").value = selected.join("\n");
      bar.style.width = "0%";
      document.querySelector("#upgradeLog").textContent = `[${now()}] Upgrade queued for demo devices.`;
      setTimeout(() => { bar.style.width = "42%"; }, 250);
      setTimeout(() => { bar.style.width = "76%"; }, 650);
      setTimeout(() => {
        bar.style.width = "100%";
        document.querySelector("#upgradeLog").textContent =
          `[${now()}] Upgrade simulation completed\n` +
          `${selected.join("\n")}\n` +
          `${document.querySelector("#upgradeImage").value}\n` +
          "Result: success";
      }, 1050);
      try {
        await postJson("/api/upgrade", { targets: selected, image: document.querySelector("#upgradeImage").value.trim() });
      } catch (error) {
        // GitHub Pages has no backend. The local Linux server handles this endpoint.
      }
    }

    if (action === "ping") {
      const host = document.querySelector("#troubleHost").value.trim() || "192.168.1.1";
      const port = document.querySelector("#troublePort").value.trim() || "22";
      document.querySelector("#troubleLog").textContent =
        `[${now()}] Ping ${host}\n` +
        `Reply from ${host}: time=2ms\n` +
        `TCP ${port}: open\n` +
        "Result: reachable";
    }

    if (action === "run-command") {
      const target = document.querySelector("#commandTarget").value;
      const command = document.querySelector("#commandInput").value.trim();
      try {
        const result = await postJson("/api/command", { target, command });
        document.querySelector("#commandLog").textContent =
          `[${now()}] ${result.target}\n${result.command}\n${result.output || result.error || "No output"}`;
      } catch (error) {
        document.querySelector("#commandLog").textContent =
          `[${now()}] ${target}\n` +
          `${command}\n` +
          "Gi1/0/1 connected demo-uplink\n" +
          "Gi1/0/2 connected demo-access\n" +
          "Result: simulated output";
      }
    }

    if (action === "add-site") {
      const siteName = document.querySelector("#newSiteName").value.trim().toUpperCase();
      const siteIp = document.querySelector("#newSiteIp").value.trim();
      if (!siteName) return alert("Enter a site name.");
      if (!sites.includes(siteName)) sites.push(siteName);
      devices.push({ name: `${siteName}-CORE`, ip: siteIp || "192.168.1.1", site: siteName, role: "Core", model: "Catalyst", version: "17.9.5", status: "Up" });
      saveWorkspace();
      renderFilters(); renderInventory(); renderSites(); renderBackups(); renderUpgradeSwitches();
      setView("sites");
    }

    if (action === "add-device") {
      const name = document.querySelector("#deviceName").value.trim().toUpperCase();
      const ip = document.querySelector("#deviceIp").value.trim();
      const site = document.querySelector("#deviceSite").value;
      const role = document.querySelector("#deviceRole").value.trim() || "Access";
      if (!name || !ip) return alert("Enter device hostname and IP address.");
      devices.push({ name, ip, site, role, model: "Catalyst", version: "17.9.5", status: "Up" });
      saveWorkspace();
      renderFilters(); renderInventory(); renderSites(); renderBackups(); renderUpgradeSwitches();
      setView("inventory");
    }

    if (action === "delete-device") {
      const selected = document.querySelector("input[name='selectedDevice']:checked");
      if (!selected) return alert("Select a device first.");
      devices = devices.filter((device) => device.ip !== selected.value);
      saveWorkspace();
      renderFilters(); renderInventory(); renderSites(); renderBackups(); renderUpgradeSwitches();
    }

    if (action === "reset-demo") {
      if (!confirm("Remove custom data and restore the clean demo workspace?")) return;
      devices = [...defaultDevices];
      sites = ["DEMO01", "DEMO02", "DEMO03", "DEMO04"];
      saveWorkspace();
      renderFilters(); renderInventory(); renderSites(); renderBackups(); renderUpgradeSwitches();
    }

    if (action === "export") alert("Demo export prepared. No real data is downloaded.");
    if (action === "ack-alerts") document.querySelector("#alertsList").innerHTML = '<div class="event-row ok"><strong>Alerts acknowledged</strong><span>Demo state updated locally.</span></div>';
    if (action === "new-job") renderJobs("Manual demo task");
  });
});

renderFilters();
renderInventory();
renderSites();
renderUpgradeSwitches();
renderTimeline();
renderAssurance();
renderBackups();
renderAiPlan();
renderJobs();
setAuthMode(authMode);

commandTemplate.addEventListener("change", () => {
  document.querySelector("#commandInput").value = commandTemplate.value;
});
