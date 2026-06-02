const devices = [
  { name: "DEMO01-CORE", ip: "192.168.1.1", site: "DEMO01", model: "Catalyst 9300", version: "17.9.5", status: "Up" },
  { name: "DEMO02-ACCESS", ip: "192.168.1.2", site: "DEMO02", model: "Catalyst 9200", version: "17.9.5", status: "Up" },
  { name: "DEMO03-EDGE", ip: "192.168.1.3", site: "DEMO03", model: "Catalyst 9500", version: "17.6.4", status: "Review" },
  { name: "DEMO04-LAB", ip: "192.168.1.4", site: "DEMO04", model: "Catalyst 1000", version: "17.9.5", status: "Up" }
];

const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const authButton = document.querySelector("#authButton");
const authNote = document.querySelector("#authNote");
const activeUser = document.querySelector("#activeUser");
let authMode = localStorage.getItem("mcc_demo_account") ? "signin" : "create";

function now() {
  return new Date().toLocaleString();
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
    username.placeholder = "Create a username";
    password.placeholder = "Create a password";
    password.autocomplete = "new-password";
    authButton.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create account';
    authNote.textContent = "Create your own demo password. It is saved only in this browser.";
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

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  viewTitle.textContent = viewName.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderInventory() {
  const rows = devices.map((device) => {
    const status = device.status === "Up" ? "up" : "review";
    return `
      <tr>
        <td>${device.name}</td>
        <td>${device.ip}</td>
        <td>${device.site}</td>
        <td>${device.model}</td>
        <td>${device.version}</td>
        <td><span class="badge ${status}">${device.status}</span></td>
      </tr>
    `;
  }).join("");

  document.querySelector("#inventoryRows").innerHTML = rows;
}

function renderSites() {
  document.querySelector("#siteGrid").innerHTML = ["DEMO01", "DEMO02", "DEMO03", "DEMO04"].map((site, index) => `
    <article class="site-card">
      <div>
        <span>Site</span>
        <strong>${site}</strong>
      </div>
      <div>
        <span>Management IP</span>
        <strong>192.168.1.${index + 1}</strong>
      </div>
      <span>${index === 2 ? "Version drift review" : "Healthy"}</span>
    </article>
  `).join("");
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
    activeUser.textContent = `User: ${username}`;
    loginView.classList.add("is-hidden");
    appView.classList.remove("is-hidden");
    setView("dashboard");
    return;
  }

  const account = JSON.parse(localStorage.getItem("mcc_demo_account") || "null");
  if (account && username === account.username && password === account.password) {
    activeUser.textContent = `User: ${username}`;
    loginView.classList.add("is-hidden");
    appView.classList.remove("is-hidden");
    setView("dashboard");
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

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (action === "analyze") {
      document.querySelector("#aiNotes").textContent =
        `[${now()}] AI demo analysis\n` +
        "Priority: review DEMO03 version drift.\n" +
        "Recommendation: align DEMO03 to 17.9.5 after backup validation.\n" +
        "Risk: low in demo mode. No production systems are connected.";
    }

    if (action === "refresh") {
      document.querySelector("#aiNotes").textContent =
        `[${now()}] Dashboard refreshed. Fleet health remains 92%.`;
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
      bar.style.width = "0%";
      document.querySelector("#upgradeLog").textContent = `[${now()}] Upgrade queued for demo devices.`;
      setTimeout(() => { bar.style.width = "42%"; }, 250);
      setTimeout(() => { bar.style.width = "76%"; }, 650);
      setTimeout(() => {
        bar.style.width = "100%";
        document.querySelector("#upgradeLog").textContent =
          `[${now()}] Upgrade simulation completed\n` +
          "192.168.1.1 -> demo-catalyst-image.bin\n" +
          "192.168.1.2 -> demo-catalyst-image.bin\n" +
          "Result: success";
      }, 1050);
    }

    if (action === "ping") {
      document.querySelector("#troubleLog").textContent =
        `[${now()}] Ping 192.168.1.1\n` +
        "Reply from 192.168.1.1: time=2ms\n" +
        "TCP 22: open\n" +
        "Result: reachable";
    }

    if (action === "export") {
      alert("Demo export prepared. No real data is downloaded.");
    }
  });
});

renderInventory();
renderSites();
setAuthMode(authMode);
