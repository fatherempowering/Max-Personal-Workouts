const STORAGE_KEY = "fatherEmpoweringLegacyPortal_" + CLIENT.name.replace(/\s+/g, "_").toLowerCase();
const TRAINING_KEY = STORAGE_KEY + "_training";

/* ---------- Infos générales ---------- */

function setClientInfo() {
  document.getElementById("clientNameDisplay").textContent = CLIENT.name;
  document.getElementById("startDateDisplay").textContent = CLIENT.startDate;
}

/* ---------- Dates : semaine et jour en cours ---------- */

function parseLocalDate(str) {
  const p = str.split("-");
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

function getCurrentWeekNum() {
  const start = parseLocalDate(CLIENT.startDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((today - start) / 86400000);
  let w = Math.floor(days / 7) + 1;
  if (w < 1) w = 1;
  if (w > PROGRAM.weeks.length) w = PROGRAM.weeks.length;
  return w;
}

function getTodayIndex() {
  // Lundi = 0 ... Dimanche = 6
  return (new Date().getDay() + 6) % 7;
}

/* ---------- Rendu du programme ---------- */

function renderProgram() {
  const weeksList = document.getElementById("weeksList");
  if (!weeksList) return;
  weeksList.innerHTML = "";

  const currentWeek = getCurrentWeekNum();
  const todayIdx = getTodayIndex();

  PROGRAM.weeks.forEach((week) => {
    const isCurrent = week.num === currentWeek;

    const wk = document.createElement("details");
    wk.className = "week-block" + (week.race ? " race-week" : "") + (isCurrent ? " current-week" : "");
    if (isCurrent) wk.open = true;

    const badge = week.race
      ? '<span class="week-badge race-badge">🏁 Course</span>'
      : (isCurrent ? '<span class="week-badge">En cours</span>' : "");

    wk.innerHTML =
      '<summary class="week-summary">' +
        '<span class="week-num">Semaine ' + week.num + '</span>' +
        '<span class="week-title">' + week.title + '</span>' +
        badge +
        '<span class="week-progress" id="prog-w' + week.num + '">0/' + week.days.length + '</span>' +
      '</summary>';

    const daysWrap = document.createElement("div");
    daysWrap.className = "days-wrap";

    week.days.forEach((day, dIdx) => {
      const dayEl = document.createElement("details");
      dayEl.className = "day-block" + (day.race ? " race-day" : "");
      if (isCurrent && dIdx === todayIdx) dayEl.open = true;

      const doneId = "done-w" + week.num + "-d" + dIdx;

      let content = "";

      if (day.items) {
        day.items.forEach((item, eIdx) => {
          const inputId = "t-w" + week.num + "-d" + dIdx + "-e" + eIdx;
          content +=
            '<div class="ex-row">' +
              '<div class="ex-info">' +
                '<span class="ex-name">' + item[0] + '</span>' +
                '<span class="ex-detail">' + item[1] + '</span>' +
              '</div>' +
              '<input id="' + inputId + '" data-track="true" type="text" class="ex-log" placeholder="Charge x reps">' +
            '</div>';
        });
      }

      if (day.lines) {
        content += '<ul class="checklist day-lines">';
        day.lines.forEach((l) => { content += "<li>" + l + "</li>"; });
        content += "</ul>";
        const notesId = "n-w" + week.num + "-d" + dIdx;
        content +=
          '<input id="' + notesId + '" data-track="true" type="text" class="ex-log day-notes" placeholder="Notes : durée, RPE, sensations">';
      }

      content +=
        '<label class="done-row" for="' + doneId + '">' +
          '<input id="' + doneId + '" data-track="true" type="checkbox" class="done-check">' +
          '<span>Séance complétée</span>' +
        '</label>';

      dayEl.innerHTML =
        '<summary class="day-summary">' +
          '<span class="day-name">' + day.name + '</span>' +
          '<span class="day-title">' + day.title + '</span>' +
          '<span class="day-check" id="chk-' + doneId + '"></span>' +
        '</summary>' +
        '<div class="day-content">' + content + '</div>';

      daysWrap.appendChild(dayEl);
    });

    wk.appendChild(daysWrap);
    weeksList.appendChild(wk);
  });
}

/* ---------- Suivi : sauvegarde locale ---------- */

function saveTraining() {
  const data = {};
  document.querySelectorAll("[data-track='true']").forEach((field) => {
    data[field.id] = field.type === "checkbox" ? field.checked : field.value;
  });
  localStorage.setItem(TRAINING_KEY, JSON.stringify(data));
}

function loadTraining() {
  const raw = localStorage.getItem(TRAINING_KEY);
  if (!raw) return;

  const data = JSON.parse(raw);

  document.querySelectorAll("[data-track='true']").forEach((field) => {
    if (!(field.id in data)) return;
    if (field.type === "checkbox") {
      field.checked = data[field.id] === true;
      applyDayDone(field);
    } else if (data[field.id]) {
      field.value = data[field.id];
    }
  });

  updateAllProgress();
}

function applyDayDone(checkbox) {
  const day = checkbox.closest(".day-block");
  if (!day) return;
  day.classList.toggle("done", checkbox.checked);
  const mark = document.getElementById("chk-" + checkbox.id);
  if (mark) mark.textContent = checkbox.checked ? "✓" : "";
}

function updateAllProgress() {
  PROGRAM.weeks.forEach((week) => {
    const prog = document.getElementById("prog-w" + week.num);
    if (!prog) return;
    let done = 0;
    week.days.forEach((day, dIdx) => {
      const cb = document.getElementById("done-w" + week.num + "-d" + dIdx);
      if (cb && cb.checked) done++;
    });
    prog.textContent = done + "/" + week.days.length;
    prog.classList.toggle("week-complete", done === week.days.length);
  });
}

/* ---------- Vision & Standards (inchangé) ---------- */

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
  if (!status) return;
  status.textContent = message;
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 4200);
}

/* ---------- Init ---------- */

window.addEventListener("load", () => {
  setClientInfo();
  renderProgram();
  loadPrivateVision();
  loadTraining();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-private='true']")) {
    savePrivateVision();
  }

  if (event.target.matches("[data-track='true']")) {
    if (event.target.type === "checkbox") {
      applyDayDone(event.target);
      updateAllProgress();
    }
    saveTraining();
  }
});
