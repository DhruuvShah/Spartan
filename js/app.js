/* ============================================================
   SPARTAN — Application Logic
   Sections:
   1. PWA Initialization
   2. Constants
   3. State
   4. Date Helpers
   5. Data Persistence
   6. Meal Logging
   7. Workout Logging
   8. Bodyweight Logging
   9. Logger UI Renderer
   10. Theme Engine
   11. Navigation & Mobile Menu
   12. Charts (Chart.js)
   ============================================================ */

/* ---- 1. PWA Initialization (runs immediately) ------------- */
(function initPWA() {
  const iconSVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjExMiIgZmlsbD0iIzBhODRmZiIvPjxwYXRoIGQ9Ik0zMzYuNCAxNTIuNUMzMTEuMyAxMzIuNCAyNzUuNSAxMjggMjQxLjEgMTI4Yy00OS40IDAtMTA0IDcuOC0xMTIuOCA1OS03LjYgNDQuMyAyOC43IDYwLjUgNjQgNzAuOCA0MS4xIDExLjggNjMuMyAxMy43IDYxLjIgMzYuNi0xLjcgMTgtMjYuOCAzMy4zLTY1LjQgMjIuMS0xNi41LTQuOC00My0xNi4xLTQ4LjEtMzEuNi0xMS43IDUuNS0yOS40IDIxLjItMzYuMyAzNy4xIDIyLjEgMjEuOSA1NiA0MiA5OC4zIDQyIDUzIDAgMTE1LjQtOSAxMjQuNi02My41IDEwLjQtNjIuOS00Ni03Ni04My04Ni43LTMxLjUtOS4yLTUxLjEtMTQuOC00Ni45LTM1LjggMy43LTE4LjggMzUuNi0yMS40IDU4LjktMTIuOSAxOS42IDcuMSAzMiAxOCAyOS4yIDI2LjhsMzIuNy0zOS40eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==`;

  const manifest = {
    name: "Spartan Protocol",
    short_name: "Spartan",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    start_url: window.location.pathname || "/",
    icons: [{ src: iconSVG, sizes: "192x192 512x512", type: "image/svg+xml" }],
  };

  const manifestBlob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  });
  document.getElementById("manifest-link").href =
    URL.createObjectURL(manifestBlob);

  if ("serviceWorker" in navigator) {
    const swCode = `
            self.addEventListener('install', (e) => self.skipWaiting());
            self.addEventListener('activate', (e) => self.clients.claim());
            self.addEventListener('fetch', (e) => {});
        `;
    const swBlob = new Blob([swCode], { type: "application/javascript" });
    navigator.serviceWorker
      .register(URL.createObjectURL(swBlob))
      .catch(() => {});
  }
})();

/* ---- Main Application (DOM ready) ------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* ---- 2. Constants ------------------------------------- */
  const TARGET_CALS = 2800;
  const TARGET_PRO = 175;

  /* ---- 3. State ----------------------------------------- */
  let appData = JSON.parse(localStorage.getItem("spartanLogs")) || {};
  let currentDateObj = new Date();

  /* ---- 4. Date Helpers ---------------------------------- */
  function getLocalDateStr(d) {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d - offset).toISOString().split("T")[0];
  }

  let viewDateStr = getLocalDateStr(currentDateObj);

  function initDayData(dateStr) {
    if (!appData[dateStr]) {
      appData[dateStr] = {
        meals: [],
        workouts: [],
        bw: appData.latestBW || "",
      };
    } else {
      if (!Array.isArray(appData[dateStr].meals)) appData[dateStr].meals = [];
      if (!Array.isArray(appData[dateStr].workouts))
        appData[dateStr].workouts = [];
    }
  }

  /* Exposed globally — called from inline onclick in HTML */
  window.changeLogDate = function (days) {
    currentDateObj.setDate(currentDateObj.getDate() + days);
    viewDateStr = getLocalDateStr(currentDateObj);
    initDayData(viewDateStr);
    updateLoggerUI();
  };

  /* ---- 5. Data Persistence ------------------------------ */
  function saveLogs() {
    localStorage.setItem("spartanLogs", JSON.stringify(appData));
    updateLoggerUI();
  }

  /* ---- 6. Meal Logging ---------------------------------- */
  window.logMeal = function () {
    const name = document.getElementById("food-name").value.trim();
    const type = document.getElementById("food-type").value;
    const cals = parseInt(document.getElementById("food-cals").value) || 0;
    const pro = parseInt(document.getElementById("food-pro").value) || 0;

    if (!name || cals <= 0) return alert("Enter food name and valid calories.");

    appData[viewDateStr].meals.push({ name, type, cals, pro, id: Date.now() });

    document.getElementById("food-name").value = "";
    document.getElementById("food-cals").value = "";
    document.getElementById("food-pro").value = "";
    saveLogs();
  };

  window.deleteMeal = function (id) {
    appData[viewDateStr].meals = appData[viewDateStr].meals.filter(
      (m) => m.id !== id,
    );
    saveLogs();
  };

  /* ---- 7. Workout Logging ------------------------------- */
  window.logWorkout = function () {
    const name = document.getElementById("exercise-name").value.trim();
    const sets = parseInt(document.getElementById("workout-sets").value) || 0;
    const reps = parseInt(document.getElementById("workout-reps").value) || 0;
    const weight =
      parseFloat(document.getElementById("workout-weight").value) || 0;

    if (!name || sets <= 0 || reps <= 0)
      return alert("Enter exercise name, sets, and reps.");

    appData[viewDateStr].workouts.push({
      name,
      sets,
      reps,
      weight,
      id: Date.now(),
    });

    document.getElementById("workout-sets").value = "";
    document.getElementById("workout-reps").value = "";
    document.getElementById("workout-weight").value = "";
    saveLogs();
  };

  window.deleteWorkout = function (id) {
    appData[viewDateStr].workouts = appData[viewDateStr].workouts.filter(
      (w) => w.id !== id,
    );
    saveLogs();
  };

  /* ---- 8. Bodyweight Logging ---------------------------- */
  window.logBodyweight = function () {
    const bw = document.getElementById("bw-input").value;
    if (bw) {
      appData[viewDateStr].bw = bw;
      appData.latestBW = bw;
      const displayEl = document.getElementById("display-current-bw");
      if (displayEl) displayEl.textContent = `${bw} kg`;
      saveLogs();
    }
  };

  /* ---- 9. Logger UI Renderer ---------------------------- */
  function getMealTypeColor(type) {
    const colorMap = {
      Breakfast: "text-amber-500",
      Lunch: "text-orange-500",
      Dinner: "text-indigo-500",
    };
    return colorMap[type] || "text-yellow-600";
  }

  function renderMealItem(m) {
    const typeColor = getMealTypeColor(m.type);
    return `
            <div class="flex justify-between items-center py-3 px-4 border-b border-[var(--divider)] last:border-0 hover:bg-[var(--hover-bg)] transition-colors group select-none">
                <div>
                    <div class="text-[13px] md:text-sm font-semibold text-apple-text">${m.name}</div>
                    <div class="text-[10px] md:text-[11px] ${typeColor} font-medium tracking-wide uppercase">${m.type}</div>
                </div>
                <div class="flex items-center gap-2 md:gap-4">
                    <div class="text-right">
                        <div class="text-[13px] md:text-sm font-mono text-apple-text">${m.cals} <span class="text-[10px] md:text-xs text-apple-secondary">kcal</span></div>
                        <div class="text-[11px] md:text-xs font-mono text-apple-blue">${m.pro} <span class="text-[9px] md:text-[10px]">g pro</span></div>
                    </div>
                    <button onclick="deleteMeal(${m.id})" class="text-apple-red/50 hover:text-apple-red transition-colors p-2 md:p-1 md:opacity-0 md:group-hover:opacity-100 ios-btn">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
  }

  function renderWorkoutItem(w, index) {
    return `
            <div class="flex justify-between items-center py-3 px-4 border-b border-[var(--divider)] last:border-0 hover:bg-[var(--hover-bg)] transition-colors group select-none">
                <div class="flex items-center gap-3 w-[60%]">
                    <span class="text-[10px] md:text-xs font-bold text-apple-secondary bg-[var(--active-bg)] w-5 h-5 flex items-center justify-center rounded-full shrink-0">${index + 1}</span>
                    <span class="text-[13px] md:text-sm font-semibold text-apple-text truncate">${w.name}</span>
                </div>
                <div class="flex items-center gap-2 md:gap-4 shrink-0">
                    <div class="text-[11px] md:text-[13px] font-mono text-apple-secondary bg-[var(--active-bg)] px-2 py-1 rounded">
                        ${w.sets}x${w.reps} <span class="text-apple-text">@ ${w.weight}</span>
                    </div>
                    <button onclick="deleteWorkout(${w.id})" class="text-apple-red/50 hover:text-apple-red transition-colors p-2 md:p-1 md:opacity-0 md:group-hover:opacity-100 ios-btn">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
  }

  function updateLoggerUI() {
    const dayData = appData[viewDateStr];

    /* Date display */
    const displayDate = currentDateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    document.getElementById("current-date-display").textContent = displayDate;

    /* Totals */
    let totalCals = 0;
    let totalPro = 0;
    dayData.meals.forEach((m) => {
      totalCals += m.cals;
      totalPro += m.pro;
    });

    document.getElementById("cal-count").textContent = totalCals;
    document.getElementById("pro-count").textContent = totalPro;

    /* Progress bars */
    const calPct = Math.min((totalCals / TARGET_CALS) * 100, 100);
    const proPct = Math.min((totalPro / TARGET_PRO) * 100, 100);
    document.getElementById("cal-bar").style.width = `${calPct}%`;
    document.getElementById("pro-bar").style.width = `${proPct}%`;

    /* Meal list */
    const mealContainer = document.getElementById("meal-log-container");
    mealContainer.innerHTML =
      dayData.meals.length === 0
        ? `<div class="text-center text-apple-secondary text-sm p-4">No meals logged.</div>`
        : dayData.meals.map(renderMealItem).join("");

    /* Workout list */
    const workoutContainer = document.getElementById("workout-log-container");
    workoutContainer.innerHTML =
      dayData.workouts.length === 0
        ? `<div class="text-center text-apple-secondary text-sm p-4">No sets logged.</div>`
        : dayData.workouts.map(renderWorkoutItem).join("");

    /* Bodyweight input */
    document.getElementById("bw-input").value = dayData.bw || "";
  }

  /* ---- Boot sequence ------------------------------------ */
  initDayData(viewDateStr);

  const displayEl = document.getElementById("display-current-bw");
  if (appData.latestBW && displayEl)
    displayEl.textContent = `${appData.latestBW} kg`;

  updateLoggerUI();

  /* ---- 10. Theme Engine --------------------------------- */
  const html = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  function applyTheme(isDark) {
    if (isDark) {
      html.classList.add("dark");
      themeIcon.className = "ph-fill ph-sun text-xl text-amber-500";
      themeText.textContent = "Light Mode";
    } else {
      html.classList.remove("dark");
      themeIcon.className = "ph ph-moon text-xl";
      themeText.textContent = "Dark Mode";
    }
    if (window.weightChartInstance) updateChartsTheme(isDark);
  }

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialIsDark = savedTheme === "dark" || (!savedTheme && prefersDark);
  applyTheme(initialIsDark);

  themeToggle.addEventListener("click", () => {
    const isNowDark = !html.classList.contains("dark");
    localStorage.setItem("theme", isNowDark ? "dark" : "light");
    applyTheme(isNowDark);
  });

  /* ---- 11. Navigation & Mobile Menu --------------------- */
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section-container");
  const sidebar = document.getElementById("sidebar");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileOverlay = document.getElementById("mobile-overlay");
  const mobileLogo = document.getElementById("mobile-logo");
  const desktopLogo = document.getElementById("desktop-logo");

  function toggleMobileMenu() {
    const isClosed = sidebar.classList.contains("-translate-x-full");
    if (isClosed) {
      sidebar.classList.remove("-translate-x-full");
      mobileOverlay.classList.remove("hidden");
      setTimeout(() => mobileOverlay.classList.remove("opacity-0"), 10);
    } else {
      sidebar.classList.add("-translate-x-full");
      mobileOverlay.classList.add("opacity-0");
      setTimeout(() => mobileOverlay.classList.add("hidden"), 300);
    }
  }

  function switchSection(targetId) {
    navItems.forEach((item) =>
      item.classList.toggle("active", item.dataset.target === targetId),
    );
    sections.forEach((section) =>
      section.classList.toggle("active", section.id === targetId),
    );

    if (
      window.innerWidth < 768 &&
      !sidebar.classList.contains("-translate-x-full")
    ) {
      toggleMobileMenu();
    }

    document
      .getElementById("main-content")
      .scrollTo({ top: 0, behavior: "smooth" });
    initChartsIfVisible();
  }

  navItems.forEach((item) =>
    item.addEventListener("click", () => switchSection(item.dataset.target)),
  );
  mobileMenuBtn.addEventListener("click", toggleMobileMenu);
  mobileOverlay.addEventListener("click", toggleMobileMenu);
  if (mobileLogo)
    mobileLogo.addEventListener("click", () => switchSection("s14"));
  if (desktopLogo)
    desktopLogo.addEventListener("click", () => switchSection("s14"));

  /* ---- 12. Charts (Chart.js) ---------------------------- */
  Chart.defaults.font.family = "'Inter', sans-serif";

  function getChartThemeColors(isDark) {
    return {
      gridColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      tooltipBg: isDark ? "#2c2c2e" : "rgba(255,255,255,0.95)",
      tooltipText: isDark ? "#ffffff" : "#1d1d1f",
      tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    };
  }

  function applyTooltipTheme(chart, colors) {
    chart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
    chart.options.plugins.tooltip.titleColor = colors.tooltipText;
    chart.options.plugins.tooltip.bodyColor = colors.tooltipText;
    chart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
  }

  function updateChartsTheme(isDark) {
    const colors = getChartThemeColors(isDark);
    Chart.defaults.color = "#86868b";
    Chart.defaults.scale.grid.color = colors.gridColor;

    if (window.weightChartInstance) {
      applyTooltipTheme(window.weightChartInstance, colors);
      window.weightChartInstance.options.scales.x.grid.color = colors.gridColor;
      window.weightChartInstance.options.scales.y.grid.color = colors.gridColor;
      window.weightChartInstance.update();
    }

    if (window.macroChartInstance) {
      applyTooltipTheme(window.macroChartInstance, colors);
      window.macroChartInstance.update();
    }
  }

  function initWeightChart(isDark) {
    const colors = getChartThemeColors(isDark);
    const ctx = document.getElementById("weightChart").getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(10, 132, 255, 0.2)");
    gradient.addColorStop(1, "rgba(10, 132, 255, 0)");

    window.weightChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["M0", "M3", "M6", "M9", "M12"],
        datasets: [
          {
            label: "Lean Mass (kg)",
            data: [64, 65.5, 67, 68.5, 70],
            borderColor: "#0a84ff",
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#0a84ff",
            pointBorderWidth: 2,
            pointRadius: window.innerWidth < 768 ? 3 : 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            borderRadius: 12,
          },
        },
        scales: {
          y: {
            min: 63,
            max: 71,
            border: { display: false },
            grid: { color: colors.gridColor },
            ticks: { padding: 8 },
          },
          x: {
            grid: { display: false, color: colors.gridColor },
            border: { display: false },
          },
        },
        interaction: { intersect: false, mode: "index" },
      },
    });
  }

  function initMacroChart(isDark) {
    const colors = getChartThemeColors(isDark);
    const ctx = document.getElementById("macroChart").getContext("2d");

    window.macroChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Carbs", "Protein", "Fats"],
        datasets: [
          {
            data: [350, 175, 78],
            backgroundColor: ["#e5e5ea", "#0a84ff", "#30d158"],
            borderWidth: 0,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 15, usePointStyle: true, boxWidth: 8 },
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            borderRadius: 12,
          },
        },
        cutout: "75%",
      },
    });
  }

  function initChartsIfVisible() {
    const isDark = html.classList.contains("dark");

    const s1 = document.getElementById("s1");
    if (s1 && s1.classList.contains("active") && !window.weightChartInstance) {
      initWeightChart(isDark);
    }

    const s6 = document.getElementById("s6");
    if (s6 && s6.classList.contains("active") && !window.macroChartInstance) {
      initMacroChart(isDark);
    }

    updateChartsTheme(isDark);
  }

  initChartsIfVisible();
});
