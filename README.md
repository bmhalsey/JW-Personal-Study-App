# Study Log

An offline-capable personal study journal. Serve this directory over HTTP for development or HTTPS for installation on your phone. There is no build step or package installation.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## Writing and finding notes

- Today shows the daily text card first, then your three study sections. **Daily text** and **Bible reading** each have one set of boxes under **Notes**; sections that already have notes open by themselves.
- **Personal study** and **Notebook** entries use the full-screen writer for longer writing. Personal study's application and next question sit under the writer, with **Save to Questions**.
- One formatting bar works in every text box and the writer: bold, headings, bullets, numbers, checklists, quotes, indent/outdent and web links. Notes stay as portable plain text; **Read note** shows the formatting.
- **Connected thoughts** links entries and shows incoming links. **Search everything** (or Ctrl/Cmd+K) searches daily studies, library entries, weekly/monthly notes, ministry notes, and quiz results.
- Streaks and daily completion tracking are shown by default; either can be turned off in Settings.

## Daily text, reading and display

- With the daily text EPUB loaded, the Daily text Scripture box fills in the day's text the way the book writes it (for example "He honors those fearing Jehovah.—Ps. 15:4."), with the full verse one tap away.
- Bible reading lists today's planned chapters with JW Library links; ticking them all checks off the day.
- Read-through shows how far you are, an estimated finish date at your pace, and an optional finish-by goal that also sets next week's suggested reading.
- Week has a Month view: each week at a glance plus the numbers for your monthly report.
- Settings, Look and feel: Match phone / Light / Dark, text size, and the home screen name and icon.
- On a computer, Today shows the daily text on the left and one section to write in on the right.

## Bible reading, scriptures and Library

- Bible reading asks questions that fit the kind of book (accounts, law, poetry and wisdom, prophecy, letters), starting with a one-sentence summary; on a busy day that line is enough and the rest folds behind "Go deeper".
- `intros.js` holds book and section introductions (Genesis to Deuteronomy so far), written for this app in its own words from jw.org, the Watchtower Online Library and the Study Bible, without spoilers. They show when a new book or section starts, with links to the Study Bible and the book's introduction video.
- Library: Notebook, Scriptures (every scripture written anywhere in the app, by book and chapter, plus the Treasury), Follow-up (Questions and Prayer) and Read-through. Meeting notes open from the Week tab; Trash from Settings. Scriptures typed in a note show underneath as JW Library links.
- Same-day edits from different devices are merged section by section instead of overwriting each other.
- Settings: an optional privacy PIN (only while signed in, so it can be reset), an iPhone Shortcuts reminder guide, and daily text books saved privately to the signed-in account.
- `.github/workflows/tests.yml` runs the syntax checks, storage tests and browser tests on every push.

## Saving and recovery

Local notes save automatically to this browser. Keep backups outside the browser: clearing site data removes local notes and pending changes.

Sync uses this app's own Firebase project, built into `adapters.js` (those values identify the project and are meant to be public; Firestore rules keep each account's notes private). In Settings, **Create account** once, then **Sign in** with the same email and password on other devices. A device only contacts Firebase after it has signed in. Firebase sync retains changes in a local outbox until the server acknowledges them. The status distinguishes **Saved on this device**, **Waiting to sync**, and **Synced**. Failed writes retain their pending changes and offer Retry. Existing Firebase setup is still required for cross-device sync.

Library deletions move to **Trash**, where entries can be restored. Trash is included in JSON backups. Settings offers weekly backup reminders, the last backup creation date, JSON download/file restore, Markdown export, and a printable document for saving as PDF. Restore previews replacement counts and retains a local recovery copy before replacing entries. Daily text EPUB files and device settings are separate from note backups.

Full backups wait for all collections to load; cloud collections require an initial server-backed snapshot to avoid silently exporting only a partial offline cache. Subsequent changes and pending edits are included. Browser storage is finite: storage failures show an unsaved status rather than silently falling back to temporary memory.

## Validation

```sh
node --check app.js
node --check adapters.js
node --check sw.js
node --check intros.js
node --test tests/storage.test.cjs
python3 -m unittest discover -s tests -v
```

Browser tests need the server running, Python Playwright, and `/usr/bin/chromium`. Set `STUDY_TEST_URL` to use a different server address. Each test uses a disposable browser context. Tests cover existing notes, writing and formatting, offline persistence, connections and search, Trash, backup/restore recovery, full collection export, responsive layouts, and storage failures. Cloud acknowledgement and reload recovery are tested with simulated Firebase responses; a real multi-device Firebase session requires your configured account.
