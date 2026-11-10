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

## Reading paths, groups and notifications

- **Reading paths** (Week, My Bible reading, or Settings): the whole Bible in order, the Meeting Workbook's weekly reading, or **By topic**: eight topics like those on jw.org's Bible Teachings pages, five short readings each, with JW Library links. The Memorial Bible reading from the daily text book is added on top in the days before the Memorial (it can be turned off).
- **Groups** (`together.js`, needs sign-in): start a group, invite people with a link or an 8-character code, and see each other's daily text comments, hearts, replies and progress rings. Daily text comments are shared by default; progress is shared unless turned off; Bible reading notes only if turned on. Anyone can leave; whoever starts a group can rename it, make a new code, remove people and hide comments. One person's Meeting Workbook reading fills in for everyone in the group.
- **Notifications**: reminders for the daily text and Bible reading at chosen times (skipped when already done), Saturday planning, a monthly backup reminder, and instant notices for hearts and replies. They are sent by the Cloud Functions in `functions/` through Firebase Cloud Messaging. On iPhone they need the app on the Home Screen (iOS 16.4 or later).
- `firestore.rules` decides who can read and write what: your own notes stay yours, and a group's posts are visible only to its members. `tests/firebase/rules.test.mjs` checks those rules on the Firebase emulator.

### One-time setup for groups and notifications

1. **Upgrade the Firebase project to the Blaze plan** (Firebase console, bottom left, Upgrade). Scheduled functions need it. For a family-sized group, use stays inside the free amounts. In the Google Cloud console, under Billing, Budgets and alerts, set a $1 budget alert so you hear about any charge.
2. **Create the web push key**: Firebase console, Project settings, Cloud Messaging, Web Push certificates, Generate key pair. Put the key in `BUILT_IN_VAPID` in `together.js` (it is a public key). Until then it can be pasted in Settings, Notifications, on one device to try it.
3. **Deploy the rules and the functions** from Google Cloud Shell (shell.cloud.google.com, signed in with the account that owns the Firebase project):

   ```sh
   git clone https://github.com/bmhalsey/JW-Personal-Study-App.git
   cd JW-Personal-Study-App/functions && npm install && cd ..
   npx -y firebase-tools@latest login --no-localhost
   npx -y firebase-tools@latest deploy --project jw-personal-study-app --only firestore:rules,functions --force
   ```

   The first deploy turns on the Google services it needs and can take several minutes. If it stops with a message about permissions still being set up, wait five minutes and run the last command again. The functions run in `us-central1`, which matches a `nam5` (United States) database; for another database location, change `REGION` in `functions/index.js`.
4. Run the deploy command again whenever `firestore.rules` or `functions/` change.

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
node --check together.js
node --test tests/storage.test.cjs
node --test functions/test/logic.test.js
(cd tests/firebase && npm install && npm test)   # security rules, needs Java
python3 -m unittest discover -s tests -v
```

Browser tests need the server running, Python Playwright, and `/usr/bin/chromium`. Set `STUDY_TEST_URL` to use a different server address. Each test uses a disposable browser context. Tests cover existing notes, writing and formatting, offline persistence, connections and search, Trash, backup/restore recovery, full collection export, responsive layouts, and storage failures. Cloud acknowledgement and reload recovery are tested with simulated Firebase responses; a real multi-device Firebase session requires your configured account.
