/* The decisions behind each notification, kept apart from Firebase so they can be tested. */
'use strict';

const KINDS = ['dailyText', 'reading', 'planWeek', 'backup'];
/* how long after the chosen time a reminder can still go out, if a run was late */
const LATE_MINUTES = 90;

/* the date, minutes since midnight and weekday where the person lives */
function localParts(date, tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', {timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23'}).formatToParts(date);
  } catch (e) {
    return localParts(date, 'UTC');
  }
  const get = t => (parts.find(p => p.type === t) || {}).value;
  const hour = Number(get('hour')) % 24;
  return {
    key: get('year') + '-' + get('month') + '-' + get('day'),
    minutes: hour * 60 + Number(get('minute')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  };
}
function toMinutes(hm) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hm || ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
}
/* the Monday of the week a date is in, and of the week after */
function mondayOf(key, plusWeeks) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 7 * (plusWeeks || 0));
  return t.toISOString().slice(0, 10);
}
/* the reminder times a person chose, with defaults for anything not set */
function reminderTimes(notify) {
  const n = notify || {};
  return {
    dailyText: n.dailyText === undefined ? '07:00' : n.dailyText,
    reading: n.reading === undefined ? '20:00' : n.reading,
    planWeek: n.planWeek === false ? '' : '10:00',
    backup: n.backup === true ? '10:00' : ''
  };
}
/* which reminders are due for one person right now; each goes out at most once a day */
function dueReminders(person, now) {
  if (!person || !person.tokens || !Object.keys(person.tokens).length) return [];
  const local = localParts(now, person.tz);
  const times = reminderTimes(person.notify);
  const sent = person.sent || {};
  return KINDS.filter(kind => {
    const at = toMinutes(times[kind]);
    if (at < 0 || local.minutes < at || local.minutes >= at + LATE_MINUTES) return false;
    if (kind === 'planWeek' && local.weekday !== 6) return false;
    if (kind === 'backup' && !local.key.endsWith('-01')) return false;
    return sent[kind] !== local.key;
  }).map(kind => ({kind, date: local.key}));
}
/* reminders are skipped when the thing is already done */
function skipReminder(kind, ctx) {
  const day = ctx.day || {};
  if (kind === 'dailyText') return !!(day.text && day.text.done);
  if (kind === 'reading') return !!(day.bible && day.bible.done);
  if (kind === 'planWeek') {
    const w = ctx.nextWeek || {};
    return (!!ctx.path && ctx.path !== 'whole') || !!String(w.myReading || w.reading || '').trim();
  }
  return false;
}
function dtLine(d) {
  if (!d || !d.quote) return '';
  return d.quote + '—' + d.ref + (/[.!?]$/.test(d.ref || '') ? '' : '.');
}
function reminderMessage(kind, ctx) {
  const date = ctx.date;
  if (kind === 'dailyText') {
    return {title: 'Daily text', body: dtLine(ctx.dailyText) || "Take a few minutes with today's daily text.", link: './?open=text&date=' + date, tag: 'daily-text'};
  }
  if (kind === 'reading') {
    const w = ctx.week || {};
    const plan = String((ctx.path === 'workbook' ? w.reading : w.myReading) || '').trim();
    return {title: 'Bible reading', body: plan ? "Time for today's Bible reading. This week: " + plan + '.' : "Time for today's Bible reading.", link: './?open=bible&date=' + date, tag: 'bible-reading'};
  }
  if (kind === 'planWeek') {
    return {title: 'Plan next week', body: "Pick next week's Bible reading so each day is ready.", link: './?open=week', tag: 'plan-week'};
  }
  return {title: 'Back up your notes', body: 'It is the start of a new month. Save a backup from Settings.', link: './?open=settings', tag: 'backup'};
}
/* the people who added a heart in this change */
function heartsAdded(before, after) {
  const old = new Set((before && before.hearts) || []);
  return ((after && after.hearts) || []).filter(u => !old.has(u));
}
/* who hears about a reply: the person who wrote the post and everyone else who replied to it */
function replyRecipients(reply, earlier, members) {
  const out = new Set([reply.postUid]);
  (earlier || []).forEach(r => out.add(r.uid));
  out.delete(reply.uid);
  return Array.from(out).filter(u => u && (!members || members.indexOf(u) >= 0));
}
/* what each person allows: hearts and replies on, new comments in groups off, unless changed */
function allows(person, kind) {
  const n = (person && person.notify) || {};
  if (kind === 'hearts') return n.hearts !== false;
  if (kind === 'replies') return n.replies !== false;
  if (kind === 'groupPosts') return n.groupPosts === true;
  return true;
}
function names(list) {
  const a = list.filter(Boolean);
  if (a.length <= 1) return a[0] || 'Someone';
  if (a.length === 2) return a[0] + ' and ' + a[1];
  return a[0] + ', ' + a[1] + ' and ' + (a.length - 2) + ' more';
}
function cut(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

module.exports = {localParts, toMinutes, mondayOf, reminderTimes, dueReminders, skipReminder, reminderMessage,
  heartsAdded, replyRecipients, allows, names, cut, dtLine};
