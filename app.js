// =============================================================
//  app.js – לוגיקה ורינדור של "שבעה שבועות"
//  בדרך כלל אין צורך לגעת בקובץ זה.
//  התכנים נמצאים ב-content.js
// =============================================================

// ----- הגדרת תאריך -----
// היום הראשון של ספירת העומר (ליל הסדר – מהשקיעה)
// פורמט: 'YYYY-MM-DDThh:mm:ss' – השעה קובעת מאיזה רגע השבוע נפתח
const OMER_START = new Date('2026-04-02T20:00:00');
const OMER_END = new Date('2026-05-22T00:00:00'); // שבועות תשפ"ו – אחרי זה הכל פתוח

// ===== STATE =====
let currentWeek = null;
let hasVisitedOnce = false;

// ===== OMER DATE LOGIC =====
function getTodayOmerDay() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('day')) return parseInt(params.get('day'));
  const now = new Date();
  const diff = now - OMER_START;
  if (diff < 0) return 0;
  return Math.floor(diff / 86400000) + 1;
}

function getUnlockedWeeks() {
  const now = new Date();
  if (now >= OMER_END) return [1,2,3,4,5,6,7]; // הספירה הסתיימה – הכל פתוח
  const omerDay = getTodayOmerDay();
  if (omerDay < 1) return [];
  return Array.from({ length: Math.min(Math.ceil(omerDay / 7), 7) }, (_, i) => i + 1);
}

function getWeekDayProgress(weekNum) {
  // כמה ימים של השבוע הזה עברו (1 = יום ראשון פתוח בלבד)
  const omerDay = getTodayOmerDay();
  const weekStart = (weekNum - 1) * 7 + 1;
  return omerDay - weekStart + 1;
}

// ===== HELPERS =====
function getWeekContent(weekNum) {
  return CONTENT
    .filter(item => item.week === weekNum)
    .sort((a, b) => a.day - b.day || (a.order || 1) - (b.order || 1));
}

// ===== RENDER: HEADER DOTS =====
function renderHeaderDots() {
  const unlocked = getUnlockedWeeks();
  const track = typeof currentBikkurimWeek !== 'undefined' && currentBikkurimWeek
    ? 'bikkurim'
    : (currentWeek ? 'mahalakh' : 'intro');

  document.getElementById('header-dots').innerHTML = WEEKS.map(w => {
    const isOpen = unlocked.includes(w.num);
    // בדף הבית – כדורים נעולים תמיד
    if (track === 'intro') {
      return `<a class="week-dot locked" data-week="${w.num}" title="${w.title}"
        href="#" onclick="return false">${w.num}</a>`;
    }
    const isActive = track === 'mahalakh'
      ? currentWeek === w.num
      : currentBikkurimWeek === w.num;
    const clickFn = track === 'mahalakh'
      ? `showWeek(${w.num})`
      : `showBikkurimWeek(${w.num})`;
    const cls = ['week-dot', !isOpen ? 'locked' : '', isActive ? 'active' : ''].filter(Boolean).join(' ');
    return `<a class="${cls}" data-week="${w.num}" title="${w.title}"
      href="#" onclick="${isOpen ? clickFn : 'return false'};return false">
      ${w.num}
    </a>`;
  }).join('');
}

// ===== אינדיקטור התקדמות =====
function renderProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  
  // חכה שה-bar יהיה גלוי
  const width = bar.getBoundingClientRect().width;
  if (width === 0) {
    setTimeout(renderProgressBar, 50);
    return;
  }
  
  const omerDay = Math.min(Math.max(getTodayOmerDay(), 0), 49);
  const weekGaps = 6 * 4;
  const brickGaps = 48 * 2;
  const brickWidth = Math.floor((width - weekGaps - brickGaps) / 49);

  bar.innerHTML = '';
  bar.style.cssText = 'display:flex;flex-direction:row;height:8px;width:100%;';
  
  for (let i = 1; i <= 49; i++) {
    const div = document.createElement('div');
    div.style.cssText = `width:${brickWidth}px;height:8px;border-radius:2px;flex-shrink:0;background:${i <= omerDay ? '#C8973A' : 'rgba(255,255,255,0.15)'};margin-left:${i % 7 === 0 ? '4px' : '2px'};`;
    bar.appendChild(div);
  }
}

// ===== שמור לאחר כך =====
function toggleSave(cardId) {
  const saved = JSON.parse(localStorage.getItem('saved_cards') || '[]');
  const idx = saved.indexOf(cardId);
  if (idx === -1) saved.push(cardId);
  else saved.splice(idx, 1);
  localStorage.setItem('saved_cards', JSON.stringify(saved));
  updateSaveButton(cardId);
}

function isSaved(cardId) {
  const saved = JSON.parse(localStorage.getItem('saved_cards') || '[]');
  return saved.includes(cardId);
}

function updateSaveButton(cardId) {
  const btn = document.getElementById('save-' + cardId);
  if (!btn) return;
  btn.textContent = isSaved(cardId) ? '★ שמור' : '☆ שמור';
  btn.style.color = isSaved(cardId) ? 'var(--gold)' : '';
}

// ===== RENDER: BOTTOM NAV =====
function renderWeeksNav() {
  const unlocked = getUnlockedWeeks();
  const nav = document.getElementById('weeks-nav');
  document.getElementById('weeks-nav-inner').innerHTML = WEEKS.map(w => {
    const isOpen = unlocked.includes(w.num);
    const isActive = currentWeek === w.num;
    const cls = ['week-tab', isActive ? 'active-tab' : '', !isOpen ? 'locked-tab' : ''].filter(Boolean).join(' ');
    return `<button class="${cls}" data-week="${w.num}"
      onclick="${isOpen ? `showWeek(${w.num})` : 'return'}"
      ${!isOpen ? 'disabled' : ''}>
      שבוע ${w.num}: ${w.title}
    </button>`;
  }).join('');
  nav.style.display = currentWeek ? 'block' : 'none';
}

function formatOmerCount(omerDay, week, dayInWeek) {
  const dayNums = ['','יום אחד','שני ימים','שלושה ימים','ארבעה ימים','חמישה ימים','שישה ימים','שבעה ימים'];
  const weekNums = ['','שבוע אחד','שני שבועות','שלושה שבועות','ארבעה שבועות','חמישה שבועות','ששה שבועות'];

  if (omerDay === 7 || (omerDay > 7 && dayInWeek === 7)) {
    // יום שבת בשבוע – שבועות שלמים
    return `היום <span>${omerDay} יום שהם ${weekNums[week]}</span> לעומר`;
  } else if (omerDay < 7) {
    // שבוע ראשון
    return `היום <span>${omerDay} ימים</span> לעומר`;
  } else {
    // שבועות + ימים
    return `היום <span>${omerDay} יום שהם ${weekNums[week-1]} ו${dayNums[dayInWeek]}</span> לעומר`;
  }
}

function getTodayCardId() {
  const omerDay = getTodayOmerDay();
  if (omerDay < 1 || omerDay > 49) return null;
  const week = Math.ceil(omerDay / 7);
  const dayInWeek = omerDay - (week - 1) * 7;
  // מצא את הפריט שנפתח היום או הכי קרוב אליו
  const weekItems = getWeekContent(week)
    .filter(item => item.day <= dayInWeek)
    .sort((a, b) => b.day - a.day); // הכי עדכני קודם
  return weekItems.length ? weekItems[0].id : null;
}

// ===== RENDER: INTRO PAGE =====
function showIntro() {
  currentWeek = null;
  localStorage.removeItem('shiva_visited');
  document.getElementById('intro-page').style.display = 'flex';
  document.getElementById('week-page').style.display = 'none';
  const bp = document.getElementById('bikkurim-page');
  if (bp) bp.style.display = 'none';
  const mobileBar = document.getElementById('mobile-day-bar');
  if (mobileBar) mobileBar.style.display = 'none';
  renderHeaderDots();
  renderWeeksNav();

  // כדורי שבועות מהלך
  const unlocked = getUnlockedWeeks();
  document.getElementById('weeks-preview-pills').innerHTML = WEEKS.map(w => {
    const locked = !unlocked.includes(w.num);
    return `<span class="week-pill" data-week="${w.num}"
      style="opacity:${locked ? 0.35 : 0.9};cursor:${locked ? 'default' : 'pointer'}"
      onclick="${!locked ? `showWeek(${w.num})` : ''}">
      ${w.title}${locked ? ' 🔒' : ''}
    </span>`;
  }).join('');

  // כדורי שבועות ביכורים
  const bpEl = document.getElementById('bikkurim-weeks-preview');
  if (bpEl && typeof BIKKURIM_CONTENT !== 'undefined') {
    const bWeekNums = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳'];
    bpEl.innerHTML = BIKKURIM_CONTENT.map((w, i) => {
      const isUnlocked = unlocked.includes(i + 1);
      return `<span class="bikkurim-week-pill ${!isUnlocked ? 'locked' : ''}"
        style="background:${w.color}${isUnlocked ? 'cc' : '44'};border-color:${w.color}66;color:white;"
        onclick="${isUnlocked ? `showBikkurimWeek(${i+1})` : ''}">
        ${w.title}${!isUnlocked ? ' 🔒' : ''}
      </span>`;
    }).join('');
  }

  // ספירה לאחור / מצב שוטף
  const omerDay = getTodayOmerDay();
  const ct = document.getElementById('countdown-text');
if (omerDay < 1) {
    const msLeft = OMER_START - new Date();
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (daysLeft <= 1) {
      ct.innerHTML = `הספירה מתחילה <span>הלילה</span> ✨`;
    } else {
      ct.innerHTML = `הספירה מתחילה בעוד <span>${daysLeft}</span> ימים`;
    }
  } else if (omerDay <= 49) {
    const week = Math.ceil(omerDay / 7);
    const dayInWeek = omerDay - (week - 1) * 7;
    const omerText = formatOmerCount(omerDay, week, dayInWeek);
    ct.innerHTML = omerText;
    // הצג כפתורי "היום" בכל עמודה
    const btnM = document.getElementById('today-btn-mahalakh');
    const btnB = document.getElementById('today-btn-bikkurim');
    if (btnM) { btnM.style.display = 'inline-block'; btnM.textContent = `← לתוכן היומי`; }
    if (btnB) { btnB.style.display = 'inline-block'; }
  } else {
    ct.innerHTML = `ספירת העומר הסתיימה – כל התכנים פתוחים`;
  }

  const _dayParam = new URLSearchParams(window.location.search).get('day');
  const _search = _dayParam ? `?day=${_dayParam}` : '';
  history.pushState({}, '', `${window.location.pathname}${_search}`);

  renderProgressBar();
document.getElementById('progress-bar').style.display = 'block';
  renderProgressBar();

}

// ===== RENDER: WEEK PAGE =====
function isItemVisible(item, dayProgress) {
  if (dayProgress >= 7 && item.day === 7) return true; // שבוע הסתיים – יום 7 תמיד פתוח
  if (dayProgress < item.day) return false;
  if (dayProgress > item.day) return true;
  // אותו יום – בדוק שעה אם מוגדרת
  if (item.hour) {
    return new Date().getHours() >= item.hour;
  }
  return true;
}

function showWeek(weekNum) {
  const unlocked = getUnlockedWeeks();
  if (!unlocked.includes(weekNum)) return;

  currentWeek = weekNum;
  const week = WEEKS[weekNum - 1];
  const dayProgress = getWeekDayProgress(weekNum);
  const isPastWeek = unlocked[unlocked.length - 1] >= weekNum && getWeekDayProgress(weekNum) >= 7;

  document.getElementById('intro-page').style.display = 'none';
  document.getElementById('week-page').style.display = 'block';

  // כותרת שבוע
  document.getElementById('week-number-label').textContent = `שבוע ${weekNum} מתוך 7`;
  document.getElementById('week-title-main').textContent = week.title;
  document.getElementById('week-title-main').style.color = week.color;
  document.getElementById('week-accent-bar').style.background = week.color;
  document.getElementById('week-tagline').textContent = week.tagline;
  document.getElementById('week-hero').style.background = week.color + '08';

  // כרטיסי תוכן
  const cards = getWeekContent(weekNum);
document.getElementById('content-cards').innerHTML = cards.map((item, i) => {
  const isVisible = isPastWeek || isItemVisible(item, dayProgress);
  return renderCard(item, week.color, isVisible, i);
}).join('');
// עדכן כפתורי שמירה אחרי שה-DOM מוכן
cards.forEach(item => updateSaveButton(item.id));

  renderHeaderDots();
  renderWeeksNav();

  // גלול לפריט היומי אם זה השבוע הנוכחי
  const omerDay = getTodayOmerDay();
  const todayWeek = Math.ceil(omerDay / 7);
  if (weekNum === todayWeek) {
    const cardId = getTodayCardId();
    if (cardId) {
      setTimeout(() => {
        const el = document.getElementById('card-' + cardId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const dayParam = new URLSearchParams(window.location.search).get('day');
  const search = dayParam ? `?day=${dayParam}` : '';
  history.pushState({ week: weekNum }, '', `${search}#שבוע-${weekNum}`);

  renderProgressBar();
document.getElementById('progress-bar').style.display = 'block';
  renderProgressBar();

  const mobileBar = document.getElementById('mobile-day-bar');
if (mobileBar) mobileBar.style.display = 'none';


}

// ===== RENDER: CARD =====
function getTypeIcon(type) {
  const icons = {
    'פתיחה':  '✦',
    'לקראת שבת':    '🕯',
    'שביעי של פסח':    '🕯',
    'יוצאים לימי המעשה':   '✶',
    'לימוד':  '📖',
    'זווית':  '↗',
    'העמקה':  '◎',
    'סיום':   '◇',
    'טקסט':   '◈',
    'שאלה':   '?',
    'וידאו':  '▶',
    'מקור':   '❝',
  };
  return icons[type] || '';
}

function formatText(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('<br><br>');
}

function renderCard(item, color, isVisible, index) {
  if (!isVisible) {
    return `<div class="content-card locked-card" style="animation-delay:${index * 0.06}s">
      <div class="locked-overlay">🔒 יפתח בהמשך השבוע</div>
    </div>`;
  }

  const isFeatured = item.type === 'פתיחה';
  const cardClass = `content-card${isFeatured ? ' card-featured' : ''}`;

const imageHtml = item.image
  ? `<img src="${item.image}" alt="${item.title}"
      style="width:100%;border-radius:8px;margin-bottom:16px;display:block;">`
  : '';

const videoHtml = item.videoId
  ? `<a href="https://youtube.com/watch?v=${item.videoId}" target="_blank"
      style="display:block;position:relative;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      <img src="https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg"
        style="width:100%;display:block;">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);">
        <div style="width:48px;height:48px;background:red;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <div style="width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-right:none;border-left:16px solid white;margin-right:-4px;"></div>
        </div>
      </div>
    </a>`
  : '';

  const questionHtml = item.question
    ? `<div class="card-question">${item.question}</div>`
    : '';

  const needsReadMore = !isFeatured && item.excerpt && item.excerpt.length > 120;
  const excerptHtml = needsReadMore
    ? `<div class="card-excerpt-wrap">
       <p class="card-excerpt collapsed" id="exc-${item.id}">${formatText(item.excerpt)}</p>       </div>
       <button class="read-more-btn" id="rmb-${item.id}"
         onclick="toggleReadMore('${item.id}')" style="color:${color}">קרא עוד ↓</button>`
      : `<p class="card-excerpt" style="margin-bottom:14px">${formatText(item.excerpt)}</p>`;
  // תגיות קשורות (לשימוש עתידי – מוצגות בשקט כ-data attributes)
  const tagsAttr = item.tags ? `data-tags="${item.tags.join(',')}"` : '';
  const relatedAttr = item.related ? `data-related="${item.related.join(',')}"` : '';

  return `<div class="${cardClass}" id="card-${item.id}"
    style="animation-delay:${index * 0.08}s"
    ${tagsAttr} ${relatedAttr}>
    <div class="card-top">
    <span class="card-type-badge" style="border-right:2px solid ${color}">${getTypeIcon(item.type)} ${item.type}</span>
    <h2 class="card-title">${item.title}</h2>
    </div>
    <div class="card-body">
      ${imageHtml}
      ${videoHtml}
      ${excerptHtml}
      ${questionHtml}
      <div class="card-meta">
  <span class="card-day">יום ${item.day} בשבוע</span>
  <div style="display:flex;gap:8px;">
    <button class="card-share-btn" id="save-${item.id}" 
      onclick="toggleSave('${item.id}')">☆ שמור</button>
    <button class="card-share-btn" onclick="shareCard('${item.id}')">שתף ↗</button>
  </div>
</div>
    </div>
  </div>`;
}

// ===== READ MORE =====
function toggleReadMore(id) {
  const exc = document.getElementById('exc-' + id);
  const btn = document.getElementById('rmb-' + id);
  if (!exc) return;
  const isCollapsed = exc.classList.contains('collapsed');
  exc.classList.toggle('collapsed', !isCollapsed);
  exc.classList.toggle('expanded', isCollapsed);
  btn.textContent = isCollapsed ? 'סגור ↑' : 'קרא עוד ↓';
}

// ===== PASUK TOGGLE =====
function togglePasuk(track) {
  const id = track || 'mahalakh';
  const txt = document.getElementById('pasuk-text-' + id);
  const btn = document.getElementById('pasuk-btn-' + id);
  if (!txt) return;
  const isOpen = txt.style.maxHeight && txt.style.maxHeight !== '0px';
  txt.style.maxHeight = isOpen ? '0' : '1400px';
  txt.style.opacity = isOpen ? '0' : '1';
  const icon = id === 'bikkurim' ? '📖' : '✦';
  btn.textContent = isOpen ? `${icon} יוצאים לדרך` : `${icon} סגור`;
}

// ===== SHARING =====
function shareCard(cardId) {
  const url = `${window.location.origin}${window.location.pathname}#${cardId}`;
  if (navigator.share) {
    navigator.share({ url });
  } else {
    navigator.clipboard.writeText(url).then(showToast);
  }
}

function showToast() {
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== ROUTING =====
function handleHash() {
  const hash = window.location.hash;
  const omerDay = getTodayOmerDay();
  const currentWeekNum = Math.ceil(omerDay / 7);

  if (hash) {
    const weekMatch = hash.match(/שבוע-(\d)/);
    if (weekMatch) { showWeek(parseInt(weekMatch[1])); return; }
  }

const dayParam = new URLSearchParams(window.location.search).get('day');
  if (dayParam && omerDay >= 1 && omerDay <= 49) {
    showWeek(currentWeekNum);
    return;
  }

  if (hasVisitedOnce && omerDay >= 1 && omerDay <= 49) {
    showWeek(currentWeekNum);
  } else {
    hasVisitedOnce = true;
    showIntro();
  }
}

function goHome() {
  hasVisitedOnce = false;
  currentWeek = null;
  if (typeof currentBikkurimWeek !== 'undefined') currentBikkurimWeek = null;
  window.location.hash = '';
  showIntro();
}

window.addEventListener('DOMContentLoaded', () => {
  handleHash();
});