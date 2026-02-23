// =============================================================
//  bikkurim-app.js – לוגיקה של מסלול לימוד ביכורים
//  התכנים נמצאים ב-bikkurim-content.js
// =============================================================

const BIKKURIM_WEEK_NUMS_HE = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳'];
const BIKKURIM_DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שביעי'];

let currentBikkurimWeek = null;
let currentBikkurimDay = null;

// ===== HELPERS =====
function getBikkurimWeekDayProgress(weekNum) {
  const omerDay = getTodayOmerDay(); // מ-app.js
  const weekStart = (weekNum - 1) * 7 + 1;
  return omerDay - weekStart + 1;
}

function isBikkurimFocusVisible(focus, dayProgress) {
  if (dayProgress >= 7 && focus.day === 7) return true; // שבוע הסתיים – יום סיכום תמיד פתוח
  if (dayProgress < focus.day) return false;
  if (dayProgress > focus.day) return true;
  if (focus.hour) return new Date().getHours() >= focus.hour;
  return true;
}

// ===== ENTER TRACK =====
function enterTrack(track) {
  if (track === 'mahalakh') {
    // המסלול הקיים – נווט לשבוע הנוכחי
    const omerDay = getTodayOmerDay();
    const week = Math.min(Math.ceil(omerDay / 7), 7);
    if (omerDay >= 1) {
      showWeek(week); // מ-app.js
    } else {
      // לפני הספירה – פשוט הסתר intro והצג שבוע 1 בדמו
      showWeek(1);
    }
  } else if (track === 'bikkurim') {
    const omerDay = getTodayOmerDay();
    const week = Math.min(Math.ceil(omerDay / 7), 7);
    if (omerDay >= 1) {
      showBikkurimWeek(week);
    } else {
      showBikkurimWeek(1);
    }
  }
}

// ===== SHOW BIKKURIM WEEK =====
function showBikkurimWeek(weekNum) {
  const weekData = BIKKURIM_CONTENT.find(w => w.num === weekNum);
  if (!weekData) return;

  currentBikkurimWeek = weekNum;

  // הסתר את שאר הדפים
  document.getElementById('intro-page').style.display = 'none';
  document.getElementById('week-page').style.display = 'none';
  document.getElementById('bikkurim-page').style.display = 'block';
  document.getElementById('weeks-nav').style.display = 'none';

  // כותרת
  document.getElementById('bikkurim-week-label').textContent =
    `שבוע ${BIKKURIM_WEEK_NUMS_HE[weekNum-1]} – לימוד ביכורים`;
  document.getElementById('bikkurim-week-title').textContent = weekData.title;
  document.getElementById('bikkurim-week-source').textContent = weekData.source;

  // ניווט שבועות
  renderBikkurimNav(weekNum);
  renderHeaderDots(); // עדכן כדורים לפי מסלול ביכורים

  // קביעת היום הנוכחי
  const omerDay = getTodayOmerDay();
  const dayProgress = getBikkurimWeekDayProgress(weekNum);
  const isPastWeek = omerDay >= weekNum * 7;

  // פוקוס אחרון פתוח
  const visibleFocuses = weekData.focuses.filter(f =>
    isPastWeek || isBikkurimFocusVisible(f, dayProgress)
  );
  const todayFocus = visibleFocuses.length > 0
    ? visibleFocuses[visibleFocuses.length - 1]
    : weekData.focuses[0];
  currentBikkurimDay = todayFocus ? todayFocus.day : 1;

  renderBikkurimText(weekData, currentBikkurimDay);
  renderBikkurimFocus(weekData, isPastWeek ? 8 : dayProgress, currentBikkurimDay);
  scrollToHighlightedMishna();

  renderProgressBar(); // מ-app.js
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.pushState({ bikkurim: weekNum }, '', `#ביכורים-${weekNum}`);
}

// ===== NAV =====
function renderBikkurimNav(activeWeek) {
  const unlocked = getUnlockedWeeks(); // מ-app.js
  document.getElementById('bikkurim-nav').innerHTML =
    BIKKURIM_CONTENT.map((w, i) => {
      const wNum = i + 1;
      const isUnlocked = unlocked.includes(wNum);
      return `<button class="bikkurim-week-btn ${wNum === activeWeek ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}"
        onclick="${isUnlocked ? `showBikkurimWeek(${wNum})` : ''}">
        ${BIKKURIM_WEEK_NUMS_HE[i]}: ${w.title}
      </button>`;
    }).join('');
}

// ===== TEXT PANEL =====
function renderBikkurimText(weekData, highlightDay) {
  const focus = weekData.focuses.find(f => f.day === highlightDay);
  const highlightNums = focus ? focus.highlightNums : [];

  document.getElementById('bikkurim-text-panel').innerHTML =
    weekData.text.map(m => {
      const isHighlighted = highlightNums.includes(m.num);
      const isDimmed = highlightNums.length > 0 && !isHighlighted;
      return `<div class="mishna-block ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}">
        <span class="mishna-num">${m.label || 'משנה ' + m.num}</span>
        <p class="mishna-text">${m.text}</p>
      </div>`;
    }).join('');
}

// ===== FOCUS PANEL =====
function renderBikkurimFocus(weekData, dayProgress, activeFocusDay) {
  const panel = document.getElementById('bikkurim-focus-panel');

  const tabsHtml = `<div class="day-tabs">
    ${weekData.focuses.map(f => {
      const visible = isBikkurimFocusVisible(f, dayProgress);
      return `<button class="day-tab ${f.day === activeFocusDay ? 'active-tab' : ''} ${!visible ? 'locked-tab' : ''}"
        onclick="${visible ? `selectBikkurimDay(${f.day})` : ''}"
        title="${BIKKURIM_DAY_NAMES[f.day-1]}">${f.day}</button>`;
    }).join('')}
  </div>`;

  const focus = weekData.focuses.find(f => f.day === activeFocusDay);
  if (!focus || !isBikkurimFocusVisible(focus, dayProgress)) {
    panel.innerHTML = tabsHtml +
      `<div class="focus-card"><p style="color:rgba(245,240,232,0.4);font-size:0.85rem;">פוקוס זה עוד לא נפתח</p></div>`;
    return;
  }

  const sefaria = focus.sefaria
    ? `<a href="${focus.sefaria}" target="_blank"
        style="display:inline-block;margin-top:14px;font-size:0.75rem;color:rgba(245,240,232,0.35);text-decoration:underline;">
        פירושים בספריא ↗</a>`
    : '';

  panel.innerHTML = tabsHtml + `
    <div class="focus-card">
      <p class="focus-day-label">יום ${focus.day} – ${BIKKURIM_DAY_NAMES[focus.day-1]}</p>
      <h3 class="focus-title">${focus.title}</h3>
      <p class="focus-note">${focus.note}</p>
      <div class="focus-question">${focus.question}</div>
      ${sefaria}
    </div>`;
}

function scrollToHighlightedMishna() {
  setTimeout(() => {
    const el = document.querySelector('.mishna-block.highlighted');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

function selectBikkurimDay(day) {
  currentBikkurimDay = day;
  const weekData = BIKKURIM_CONTENT.find(w => w.num === currentBikkurimWeek);
  if (!weekData) return;

  const omerDay = getTodayOmerDay();
  const dayProgress = getBikkurimWeekDayProgress(currentBikkurimWeek);
  const isPastWeek = omerDay >= currentBikkurimWeek * 7;

  renderBikkurimText(weekData, day);
  renderBikkurimFocus(weekData, isPastWeek ? 8 : dayProgress, day);
  scrollToHighlightedMishna();
}

// ===== ROUTING – הרחבה לניתוב הקיים ב-app.js =====
// מוסיף טיפול ב-hash של ביכורים
const _originalHandleHash = window._originalHandleHash || null;

window.addEventListener('DOMContentLoaded', () => {
  // בדוק אם יש hash של ביכורים
  const hash = window.location.hash;
  if (hash) {
    const bikkurimMatch = hash.match(/ביכורים-(\d)/);
    if (bikkurimMatch) {
      showBikkurimWeek(parseInt(bikkurimMatch[1]));
    }
  }
});
