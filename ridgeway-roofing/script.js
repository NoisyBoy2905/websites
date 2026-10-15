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

const nextSlot = document.getElementById("next-slot");
if (nextSlot) {
  const day = new Date();
  day.setDate(day.getDate() + 1);
  if (day.getDay() === 0) day.setDate(day.getDate() + 1);
  nextSlot.textContent = day.toLocaleDateString("en-GB", { weekday: "long" });
}

const form = document.getElementById("quote-form");
const formMessage = document.getElementById("form-message");
const sendButton = form.querySelector('button[type="submit"]');

const checks = {
  name: (value) => (value ? "" : "Please enter your name."),
  phone: (value) => (value.replace(/\D/g, "").length >= 10 ? "" : "Please enter a phone number we can call you back on."),
  job: (value) => (value ? "" : "Please tell us a bit about the job."),
};

function checkField(field) {
  const message = checks[field.name](field.value.trim());
  document.getElementById(`${field.name}-error`).textContent = message;
  field.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
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
  const fields = Object.keys(checks).map((name) => form.elements[name]);
  const results = fields.map(checkField);
  const firstBad = fields[results.indexOf(false)];

  if (firstBad) {
    showMessage("", false);
    firstBad.focus();
    return;
  }

  const name = form.elements.name.value.trim();
  sendButton.disabled = true;
  sendButton.textContent = "Sending...";

  let sent = false;
  try {
    sent = await sendForm();
  } catch {
    sent = false;
  }

  sendButton.disabled = false;
  sendButton.textContent = "Send";

  if (sent) {
    showMessage(form.dataset.thanks.replace("{name}", name), false);
    form.reset();
    fields.forEach((field) => field.removeAttribute("aria-invalid"));
  } else {
    showMessage(form.dataset.failed, true);
  }
});
