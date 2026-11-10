const {test} = require('node:test');
const assert = require('node:assert');
const L = require('../logic');

const person = (o) => Object.assign({tz: 'America/Chicago', tokens: {a: {token: 't'}}}, o);
/* 7:05 AM in Chicago on Tuesday, November 10, 2026 (13:05 UTC) */
const tue705 = new Date('2026-11-10T13:05:00Z');

test('local time in the person\'s time zone', () => {
  assert.deepStrictEqual(L.localParts(tue705, 'America/Chicago'), {key: '2026-11-10', minutes: 7 * 60 + 5, weekday: 2});
  assert.strictEqual(L.localParts(new Date('2026-11-11T02:30:00Z'), 'America/Chicago').key, '2026-11-10');
  assert.strictEqual(L.localParts(tue705, 'Not/AZone').key, '2026-11-10');
});

test('daily text reminder at the chosen time, once a day', () => {
  assert.deepStrictEqual(L.dueReminders(person({}), tue705), [{kind: 'dailyText', date: '2026-11-10'}]);
  assert.deepStrictEqual(L.dueReminders(person({sent: {dailyText: '2026-11-10'}}), tue705), []);
  assert.deepStrictEqual(L.dueReminders(person({notify: {dailyText: '08:00'}}), tue705), []);
  assert.deepStrictEqual(L.dueReminders(person({notify: {dailyText: ''}}), tue705), []);
  assert.deepStrictEqual(L.dueReminders(person({tokens: {}}), tue705), []);
  // too late to bother: more than 90 minutes after the time
  assert.deepStrictEqual(L.dueReminders(person({notify: {dailyText: '05:00'}}), tue705), []);
});

test('Saturday planning and monthly backup reminders', () => {
  const sat10 = new Date('2026-11-14T16:10:00Z');
  const kinds = L.dueReminders(person({notify: {dailyText: '', reading: ''}}), sat10).map(d => d.kind);
  assert.deepStrictEqual(kinds, ['planWeek']);
  const dec1 = new Date('2026-12-01T16:10:00Z');
  assert.deepStrictEqual(L.dueReminders(person({notify: {dailyText: '', reading: '', backup: true}}), dec1).map(d => d.kind), ['backup']);
  assert.deepStrictEqual(L.dueReminders(person({notify: {dailyText: '', reading: ''}}), dec1), []);
});

test('reminders are skipped when already done', () => {
  assert.strictEqual(L.skipReminder('dailyText', {day: {text: {done: true}}}), true);
  assert.strictEqual(L.skipReminder('dailyText', {day: {}}), false);
  assert.strictEqual(L.skipReminder('reading', {day: {bible: {done: true}}}), true);
  assert.strictEqual(L.skipReminder('planWeek', {nextWeek: {myReading: 'Genesis 18-22'}}), true);
  assert.strictEqual(L.skipReminder('planWeek', {nextWeek: {}}), false);
  assert.strictEqual(L.skipReminder('planWeek', {path: 'topics'}), true);
});

test('messages', () => {
  const m = L.reminderMessage('dailyText', {date: '2026-11-10', dailyText: {quote: 'He honors those fearing Jehovah', ref: 'Ps. 15:4'}});
  assert.strictEqual(m.body, 'He honors those fearing Jehovah—Ps. 15:4.');
  assert.strictEqual(m.link, './?open=text&date=2026-11-10');
  assert.match(L.reminderMessage('reading', {date: '2026-11-10', path: 'workbook', week: {reading: 'Isaiah 58-59'}}).body, /Isaiah 58-59/);
  assert.strictEqual(L.mondayOf('2026-11-14', 1), '2026-11-16');
  assert.strictEqual(L.mondayOf('2026-11-16', 0), '2026-11-16');
});

test('hearts and replies go to the right people', () => {
  assert.deepStrictEqual(L.heartsAdded({hearts: ['a']}, {hearts: ['a', 'b']}), ['b']);
  assert.deepStrictEqual(L.heartsAdded(null, {hearts: ['a']}), ['a']);
  assert.deepStrictEqual(L.heartsAdded({hearts: ['a', 'b']}, {hearts: ['a']}), []);
  const r = {uid: 'bob', postUid: 'ann'};
  assert.deepStrictEqual(L.replyRecipients(r, [{uid: 'cat'}, {uid: 'bob'}], ['ann', 'bob', 'cat']).sort(), ['ann', 'cat']);
  assert.deepStrictEqual(L.replyRecipients(r, [{uid: 'gone'}], ['ann', 'bob']), ['ann']);
  assert.deepStrictEqual(L.replyRecipients({uid: 'ann', postUid: 'ann'}, [], ['ann']), []);
  assert.strictEqual(L.allows({}, 'hearts'), true);
  assert.strictEqual(L.allows({notify: {replies: false}}, 'replies'), false);
  assert.strictEqual(L.allows({}, 'groupPosts'), false);
  assert.strictEqual(L.names(['Mom', 'David', 'Sarah', 'James']), 'Mom, David and 2 more');
});
