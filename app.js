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
  const now = new Date();
  const diff = now - OMER_START;
  if (diff < 0) return 0; // לפני הספירה
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
    .sort((a, b) => a.day - b.day);
}

// ===== RENDER: HEADER DOTS =====
function renderHeaderDots() {
  const unlocked = getUnlockedWeeks();
  document.getElementById('header-dots').innerHTML = WEEKS.map(w => {
    const isOpen = unlocked.includes(w.num);
    const isActive = currentWeek === w.num;
    const cls = ['week-dot', !isOpen ? 'locked' : '', isActive ? 'active' : ''].filter(Boolean).join(' ');
    return `<a class="${cls}" data-week="${w.num}" title="${w.title}"
      href="#" onclick="${isOpen ? `showWeek(${w.num})` : 'return false'};return false">
      ${w.num}
    </a>`;
  }).join('');
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
  renderHeaderDots();
  renderWeeksNav();

  // כדורי שבועות
  const unlocked = getUnlockedWeeks();
  document.getElementById('weeks-preview-pills').innerHTML = WEEKS.map(w => {
    const locked = !unlocked.includes(w.num);
    return `<span class="week-pill" data-week="${w.num}"
      style="opacity:${locked ? 0.35 : 0.9};cursor:${locked ? 'default' : 'pointer'}"
      onclick="${!locked ? `showWeek(${w.num})` : ''}">
      ${w.title}${locked ? ' 🔒' : ''}
    </span>`;
  }).join('');

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
    ct.innerHTML = `${omerText} — <a href="#" onclick="showWeek(${week});return false;" 
      style="color:var(--gold-light);text-decoration:underline;text-underline-offset:3px;">
      לתכנים של היום ←</a>`;
  } else {
    ct.innerHTML = `ספירת העומר הסתיימה – כל התכנים פתוחים`;
  }

  history.pushState({}, '', window.location.pathname);
}

// ===== RENDER: WEEK PAGE =====
function isItemVisible(item, dayProgress) {
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
  const isPastWeek = unlocked[unlocked.length - 1] > weekNum;

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
  history.pushState({ week: weekNum }, '', `#שבוע-${weekNum}`);
}

// ===== RENDER: CARD =====
function getTypeIcon(type) {
  const icons = {
    'פתיחה':  '✦',
    'שבת':    '🕯',
    'מוצש':   '✶',
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

function renderCard(item, color, isVisible, index) {
  if (!isVisible) {
    return `<div class="content-card locked-card" style="animation-delay:${index * 0.06}s">
      <div class="locked-overlay">🔒 יפתח בהמשך השבוע</div>
    </div>`;
  }

  const isFeatured = item.type === 'פתיחה';
  const cardClass = `content-card${isFeatured ? ' card-featured' : ''}`;

  const videoHtml = item.videoId
    ? `<div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${item.videoId}"
          title="${item.title}" allowfullscreen loading="lazy"></iframe>
       </div>`
    : '';

  const questionHtml = item.question
    ? `<div class="card-question">${item.question}</div>`
    : '';

  const needsReadMore = !isFeatured && item.excerpt && item.excerpt.length > 120;
  const excerptHtml = needsReadMore
    ? `<div class="card-excerpt-wrap">
        <p class="card-excerpt collapsed" id="exc-${item.id}">${item.excerpt}</p>
       </div>
       <button class="read-more-btn" id="rmb-${item.id}"
         onclick="toggleReadMore('${item.id}')" style="color:${color}">קרא עוד ↓</button>`
    : `<p class="card-excerpt" style="margin-bottom:14px">${item.excerpt}</p>`;

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
      ${videoHtml}
      ${excerptHtml}
      ${questionHtml}
      <div class="card-meta">
        <span class="card-day">יום ${item.day} בשבוע</span>
        <button class="card-share-btn" onclick="shareCard('${item.id}')">שתף ↗</button>
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
function togglePasuk() {
  const txt = document.getElementById('pasuk-text');
  const btn = document.getElementById('pasuk-btn');
  const isOpen = txt.style.maxHeight && txt.style.maxHeight !== '0px';
  txt.style.maxHeight = isOpen ? '0' : '1200px';
  txt.style.opacity = isOpen ? '0' : '1';
  btn.textContent = isOpen ? '✦ יוצאים לדרך' : '✦ סגור';
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

if (hasVisitedOnce && omerDay >= 1 && omerDay <= 49) {
  showWeek(currentWeekNum);
  } else {
    hasVisitedOnce = true;
    showIntro();
  }
}

function goHome() {
  console.log('goHome called, hasVisitedOnce:', hasVisitedOnce);

  hasVisitedOnce = false;  currentWeek = null;
  window.location.hash = '';
  showIntro();
}

window.addEventListener('DOMContentLoaded', handleHash);
