const STORAGE_KEY = "fatherEmpoweringLegacyPortal_" + CLIENT.name.replace(/\s+/g, "_").toLowerCase();

function setClientInfo() {
  document.getElementById("clientNameDisplay").textContent = CLIENT.name;
  document.getElementById("startDateDisplay").textContent = CLIENT.startDate;
}

function getPrivateFields() {
  return document.querySelectorAll("[data-private='true']");
}

function savePrivateVision() {
  const data = {};

  getPrivateFields().forEach((field) => {
    data[field.id] = field.value;
  });

  localStorage.setItem(STORAGE_KEY + "_privateVision", JSON.stringify(data));
  showStatus("visionStatus", "Vision & Standards saved on this device.");
}

function loadPrivateVision() {
  const raw = localStorage.getItem(STORAGE_KEY + "_privateVision");
  if (!raw) return;

  const data = JSON.parse(raw);

  getPrivateFields().forEach((field) => {
    if (data[field.id]) field.value = data[field.id];
  });
}

function downloadPrivateVision() {
  savePrivateVision();

  const fieldLabels = [];

  getPrivateFields().forEach((field) => {
    const label = document.querySelector("label[for='" + field.id + "']");
    const labelText = label ? label.innerText : field.id;
    fieldLabels.push(labelText + ":\n" + (field.value || "[Blank]"));
  });

  const output =
    "Father Empowering - Private Vision & Standards\n" +
    "Client: " + CLIENT.name + "\n" +
    "Start Date: " + CLIENT.startDate + "\n" +
    "Private Client Document\n" +
    "============================================\n\n" +
    fieldLabels.join("\n\n");

  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const safeName = CLIENT.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "client";

  const link = document.createElement("a");
  link.href = url;
  link.download = "vision-standards-" + safeName + ".txt";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function showStatus(id, message) {
  const status = document.getElementById(id);
  status.textContent = message;
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 4200);
}

window.addEventListener("load", () => {
  setClientInfo();
  loadPrivateVision();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-private='true']")) {
    savePrivateVision();
  }
});
