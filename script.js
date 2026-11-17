'use strict';
const TOTAL = 82;
const START = new Date(2026, 10, 17);
const STATE_KEY = 'davinci-academy-v1'; // سازگار با نسخه ۱.۰؛ پیشرفت قبلی حفظ می‌شود.
const $ = id => document.getElementById(id);
const fa = n => new Intl.NumberFormat('fa-IR').format(n);
let state = {};
try { state = JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); } catch { state = {}; }
state.lessons = state.lessons && typeof state.lessons === 'object' ? state.lessons : {};
state.days = state.days && typeof state.days === 'object' ? state.days : {};

function trainingDate(day) {
  const d = new Date(START);
  d.setDate(d.getDate() + (day - 1) + Math.floor((day - 1) / 6));
  return d;
}
function dateFa(d) {
  return new Intl.DateTimeFormat('fa-IR', { year:'numeric', month:'long', day:'numeric' }).format(d);
}
function range(day) {
  const first = (day - 1) * 3 + 1;
  return [first, Math.min(first + 2, TOTAL)];
}
function dayData(day) {
  return state.days[day] || { p1:false, p2:false, p3:false, notes:'' };
}
function persist(showMessage=false) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  render();
  if (showMessage) toast('پیشرفتت با موفقیت ذخیره شد.');
}
let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
function render() {
  const count = Object.values(state.lessons).filter(Boolean).length;
  const pct = Math.round(count / TOTAL * 100);
  $('watched').textContent = fa(count);
  $('percent').textContent = fa(pct) + '٪';
  $('progressLabel').textContent = fa(count) + ' از ۸۲';
  $('progressBar').style.width = pct + '%';

  const completed = Array.from({length:28}, (_,i) => i+1).filter(day => {
    const [a,b] = range(day);
    return Array.from({length:b-a+1}, (_,j) => a+j).every(n => !!state.lessons[n]);
  }).length;
  $('streak').textContent = fa(completed);

  const day = Number($('daySelect').value || 1);
  const [a,b] = range(day);
  const dd = dayData(day);
  $('dateLabel').textContent = 'تاریخ برنامه: ' + dateFa(trainingDate(day));
  $('dayTitle').textContent = 'روز ' + fa(day);
  $('lessonRange').textContent = `درس‌های ${fa(a)} تا ${fa(b)}`;

  const list = $('lessonList');
  list.replaceChildren();
  for (let n=a; n<=b; n++) {
    const row = document.createElement('div');
    row.className = 'lesson';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = !!state.lessons[n]; cb.id = 'lesson-' + n;
    cb.setAttribute('aria-label', 'تکمیل ویدیوی ' + fa(n));
    cb.addEventListener('change', () => {
      state.lessons[n] = cb.checked;
      persist();
    });
    const label = document.createElement('label');
    label.htmlFor = cb.id;
    const strong = document.createElement('span');
    strong.textContent = 'ویدیوی شماره ' + fa(n);
    const small = document.createElement('small');
    small.textContent = 'تماشا + اجرای عملی در نرم‌افزار';
    label.append(strong, small);
    const number = document.createElement('span');
    number.className = 'lesson-number';
    number.textContent = String(n).padStart(2,'0');
    row.append(cb, label, number);
    list.append(row);
  }
  const done = Array.from({length:b-a+1}, (_,i) => a+i).filter(n => !!state.lessons[n]).length;
  $('dayCount').textContent = fa(done) + ' از ' + fa(b-a+1);
  $('dayBar').style.width = (done/(b-a+1)*100) + '%';
  $('dayStatus').textContent = done === b-a+1 ? 'درس‌های امروز کامل شد' : 'در حال انجام';

  ['p1','p2','p3'].forEach(k => $(k).checked = !!dd[k]);
  $('notesInput').value = dd.notes || '';

  const calendar = $('calendar');
  calendar.replaceChildren();
  for (let d=1; d<=28; d++) {
    const [x,y] = range(d);
    const ok = Array.from({length:y-x+1}, (_,i) => x+i).every(n => !!state.lessons[n]);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day' + (d===day ? ' active' : '') + (ok ? ' done' : '');
    btn.textContent = fa(d);
    btn.title = `روز ${d} · درس ${x} تا ${y}`;
    btn.setAttribute('aria-label', `انتخاب روز ${fa(d)}`);
    btn.addEventListener('click', () => { $('daySelect').value = d; render(); });
    calendar.append(btn);
    if (d%6===0 && d<28) {
      const rest = document.createElement('div');
      rest.className = 'day rest';
      rest.textContent = 'مرور';
      rest.setAttribute('aria-label','روز مرور');
      calendar.append(rest);
    }
  }
}

const select = $('daySelect');
for (let d=1; d<=28; d++) {
  const option = document.createElement('option');
  option.value = d;
  option.textContent = `روز ${fa(d)} — درس ${fa(range(d)[0])} تا ${fa(range(d)[1])}`;
  select.append(option);
}
select.addEventListener('change', render);

['p1','p2','p3'].forEach(k => $(k).addEventListener('change', () => {
  const d = select.value, dd = dayData(d);
  dd[k] = $(k).checked;
  state.days[d] = dd;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}));
$('notesInput').addEventListener('input', () => {
  const d = select.value, dd = dayData(d);
  dd.notes = $('notesInput').value;
  state.days[d] = dd;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
});
$('saveBtn').addEventListener('click', () => {
  const d = select.value, dd = dayData(d);
  ['p1','p2','p3'].forEach(k => dd[k] = $(k).checked);
  dd.notes = $('notesInput').value;
  state.days[d] = dd;
  persist(true);
});
$('resetDay').addEventListener('click', () => {
  if (!confirm('تیک درس‌ها، تمرین‌ها و یادداشت‌های این روز پاک شود؟')) return;
  const [a,b] = range(Number(select.value));
  for (let n=a; n<=b; n++) delete state.lessons[n];
  delete state.days[select.value];
  persist(true);
});
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'davinci-academy-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('فایل پشتیبان آماده شد.');
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || typeof imported !== 'object' || Array.isArray(imported) ||
        !imported.lessons || typeof imported.lessons !== 'object' ||
        !imported.days || typeof imported.days !== 'object') {
      throw new Error('ساختار نامعتبر');
    }
    if (!confirm('اطلاعات فعلی با اطلاعات فایل پشتیبان جایگزین شود؟')) return;
    state = imported;
    state.lessons = state.lessons || {};
    state.days = state.days || {};
    persist(true);
  } catch {
    toast('فایل پشتیبان معتبر نیست.');
  } finally {
    event.target.value = '';
  }
});

const now = new Date();
$('headerDate').textContent = new Intl.DateTimeFormat('fa-IR', {weekday:'long', day:'numeric', month:'long'}).format(now);
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
