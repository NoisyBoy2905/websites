const root = document.documentElement;
const toggle = document.getElementById("settings-toggle");
const panel = document.getElementById("settings-panel");
const closeBtn = document.getElementById("settings-close");

const DEFAULTS = { theme: root.dataset.theme || "light", textsize: "normal", motion: "full" };
const STORAGE_KEY = root.dataset.storageKey || "site-settings";

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

function applySettings(settings) {
  root.dataset.theme = settings.theme;
  root.dataset.textsize = settings.textsize;
  root.dataset.motion = settings.motion === "reduce" ? "reduce" : "full";
}

function syncControls(settings) {
  panel.querySelector(`input[name="theme"][value="${settings.theme}"]`).checked = true;
  panel.querySelector(`input[name="textsize"][value="${settings.textsize}"]`).checked = true;
  document.getElementById("reducemotion").checked = settings.motion === "reduce";
}

const settings = loadSettings();
applySettings(settings);
syncControls(settings);

panel.addEventListener("change", (event) => {
  const input = event.target;
  if (input.name === "theme") settings.theme = input.value;
  if (input.name === "textsize") settings.textsize = input.value;
  if (input.name === "reducemotion") settings.motion = input.checked ? "reduce" : "full";
  applySettings(settings);
  saveSettings(settings);
});

function openPanel() {
  panel.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  panel.querySelector("input:checked").focus();
}

function closePanel() {
  panel.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
}

toggle.addEventListener("click", () => {
  if (panel.hidden) openPanel();
  else closePanel();
});

closeBtn.addEventListener("click", () => {
  closePanel();
  toggle.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !panel.hidden) {
    closePanel();
    toggle.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) {
    closePanel();
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

const openBadge = document.getElementById("open-now");
if (openBadge) {
  const hours = JSON.parse(openBadge.dataset.hours);
  const now = new Date();
  const today = hours[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const isOpen = today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1]);
  const toLabel = (time) => {
    const [h, m] = time.split(":").map(Number);
    return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
  };
  openBadge.textContent = isOpen ? `Open now, until ${toLabel(today[1])}` : "Closed right now";
  openBadge.classList.add(isOpen ? "is-open" : "is-closed");
  const row = document.querySelector(`[data-day~="${now.getDay()}"]`);
  if (row) row.classList.add("is-today");
}

const form = document.getElementById("quote-form");
const formMessage = document.getElementById("form-message");
const sendButton = form.querySelector('button[type="submit"]');
const fields = [...form.querySelectorAll("[data-error]")];

function checkField(field) {
  const value = field.value.trim();
  const ok = field.type === "tel" ? value.replace(/\D/g, "").length >= 10 : value.length >= Number(field.dataset.min || 1);
  const message = ok ? "" : field.dataset.error;
  document.getElementById(`${field.id}-error`).textContent = message;
  field.setAttribute("aria-invalid", ok ? "false" : "true");
  return ok;
}

function showMessage(text, isError) {
  formMessage.textContent = text;
  formMessage.classList.toggle("is-error", isError);
}

async function sendForm() {
  if (form.action.includes("YOUR_FORM_ID")) return true;
  const response = await fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: { Accept: "application/json" },
  });
  return response.ok;
}

form.addEventListener("input", (event) => {
  if (event.target.getAttribute("aria-invalid") === "true") checkField(event.target);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const results = fields.map(checkField);
  const firstBad = fields[results.indexOf(false)];

  if (firstBad) {
    showMessage("", false);
    firstBad.focus();
    return;
  }

  const name = form.elements.name.value.trim();
  const label = sendButton.textContent;
  sendButton.disabled = true;
  sendButton.textContent = "Sending...";

  let sent = false;
  try {
    sent = await sendForm();
  } catch {
    sent = false;
  }

  sendButton.disabled = false;
  sendButton.textContent = label;

  if (sent) {
    showMessage(form.dataset.thanks.replace("{name}", name), false);
    form.reset();
    fields.forEach((field) => field.removeAttribute("aria-invalid"));
  } else {
    showMessage(form.dataset.failed, true);
  }
});
