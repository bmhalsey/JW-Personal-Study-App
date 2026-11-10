"""Browser regression checks. Start python3 -m http.server 8000 first.
Run: python3 -m unittest discover -s tests -v
Requires Playwright and Chromium; no app dependencies are needed.
"""
import json
import re
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('STUDY_TEST_URL', 'http://127.0.0.1:8000')

class StudyWorkflows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path=os.environ.get('STUDY_TEST_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(URL, wait_until='networkidle')
        expect(self.page.locator('#statusText')).to_have_text('Saved on this device')

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def write_note(self, title='Patience', body='Learning to be patient.'):
        self.page.get_by_role('button', name='+ Quick note', exact=True).click()
        self.page.get_by_label('Note title', exact=True).fill(title)
        self.page.get_by_label('Study notes', exact=True).fill(body)

    def done(self):
        self.page.get_by_role('button', name='Done', exact=True).click()
        expect(self.page.locator('#statusText')).to_have_text('Saved on this device')

    def settings(self):
        self.page.get_by_role('button', name='Settings', exact=True).click()

    def test_free_writing_formatting_and_offline_persistence(self):
        self.page.get_by_role('button', name='Write', exact=True).click()
        self.page.locator('.writing-dialog').get_by_label('Topic', exact=True).fill('Patient like Jehovah')
        ta = self.page.get_by_label('Study notes', exact=True)
        ta.fill('Patience takes practice.')
        ta.evaluate('(t)=>t.setSelectionRange(0,8)')
        self.page.get_by_role('button', name='Bold', exact=True).click()
        expect(ta).to_have_value('**Patience** takes practice.')
        self.page.get_by_role('button', name='Read note', exact=True).click()
        expect(self.page.locator('.writing-preview strong')).to_have_text('Patience')
        self.done()
        self.page.evaluate('navigator.serviceWorker.ready')
        self.context.set_offline(True)
        self.page.reload(wait_until='networkidle')
        self.page.get_by_role('button', name='Continue writing', exact=True).click()
        expect(self.page.get_by_label('Study notes', exact=True)).to_have_value('**Patience** takes practice.')
        expect(self.page.locator('.writing-dialog').get_by_label('Topic', exact=True)).to_have_value('Patient like Jehovah')

    def test_question_connections_and_global_search(self):
        self.page.get_by_role('button', name='Write', exact=True).click()
        self.page.get_by_label('Study notes', exact=True).fill('Patience grows over time.')
        dialog = self.page.locator('.writing-dialog')
        dialog.get_by_label('Question to look into next', exact=True).fill('How can I show patience?')
        dialog.get_by_role('button', name='Save to Questions', exact=True).click()
        expect(self.page.locator('.writing-dialog .note-connections')).to_contain_text('How can I show patience?')
        self.done()
        self.page.get_by_role('button', name='Search everything', exact=True).click()
        self.page.get_by_label('Search everything', exact=True).fill('patience')
        expect(self.page.locator('.search-dialog .row')).to_have_count(2)
        self.page.locator('.search-dialog .row').filter(has_text='Questions').click()
        expect(self.page.locator('.editor:visible .note-connections')).to_contain_text('Personal study')

    def test_trash_restore_backup_and_readable_exports(self):
        self.write_note(body='## Reflection\n**Patience** matters.\n> Be thoughtful.')
        self.page.on('dialog', lambda d: d.accept())
        self.page.get_by_role('button', name='Move to Trash', exact=True).click()
        # Trash now opens from Settings
        self.settings()
        self.page.get_by_role('button', name=re.compile(r'^Open Trash')).click()
        expect(self.page.locator('#trashList')).to_contain_text('Patience')
        self.page.reload(wait_until='networkidle')
        self.settings()
        self.page.get_by_role('button', name=re.compile(r'^Open Trash')).click()
        self.page.get_by_role('button', name='Restore', exact=True).click()
        expect(self.page.locator('#trashList')).to_contain_text('Nothing in Trash')
        self.settings()
        with self.page.expect_download() as download:
            self.page.get_by_role('button', name='Download backup', exact=True).click()
        data = json.loads(Path(download.value.path()).read_text())
        note = next(x for x in data['docs'] if x['coll'] == 'notes')
        self.assertEqual(note['data']['deletedAt'], 0)
        self.assertEqual(note['data']['title'], 'Patience')
        expect(self.page.locator('#backupStamp')).to_contain_text('Last backup created')
        with self.page.expect_download() as download:
            self.page.get_by_role('button', name='Export Markdown', exact=True).click()
        text = Path(download.value.path()).read_text()
        self.assertIn('**Patience** matters.', text)
        with self.page.expect_popup() as popup:
            self.page.get_by_role('button', name='Print / Save PDF', exact=True).click()
        expect(popup.value.get_by_role('button', name='Print / Save as PDF')).to_be_visible()
        expect(popup.value.locator('body')).to_contain_text('Patience')

    def test_restore_confirmation_and_recovery(self):
        self.write_note('Original', 'Original text')
        self.done()
        self.settings()
        self.page.get_by_role('button', name='Create backup text', exact=True).click()
        area = self.page.locator('#s-backup')
        backup = json.loads(area.input_value())
        note = next(x for x in backup['docs'] if x['coll'] == 'notes')
        note['data']['title'] = 'Restored title'
        note['data']['updatedAt'] += 10000
        self.page.get_by_text('Restore a backup', exact=True).click()
        area.fill(json.dumps(backup))
        self.page.get_by_role('button', name='Review restore', exact=True).click()
        expect(self.page.locator('#backupSection .confirm')).to_contain_text('existing entries')
        self.page.get_by_role('button', name='Restore entries', exact=True).click()
        self.page.get_by_role('button', name='Recover notes from before the last restore', exact=True).click()
        self.page.get_by_role('button', name='Restore entries', exact=True).click()
        self.page.get_by_role('button', name='Library', exact=True).click()
        self.page.get_by_role('button', name='Notebook', exact=True).click()
        expect(self.page.locator('.collroot:visible .rows')).to_contain_text('Original')

    def test_tracking_on_by_default_one_way_to_write_and_layout(self):
        self.assertTrue(self.page.locator('[aria-label="Current streaks"]').is_visible())
        self.assertTrue(self.page.locator('.progress').is_visible())
        self.assertEqual(self.page.get_by_role('button', name='Write', exact=True).count(), 1)
        self.settings()
        self.page.get_by_label('Show streak counters', exact=True).uncheck()
        self.page.get_by_role('button', name='Back to Today', exact=True).click()
        self.assertTrue(self.page.locator('[aria-label="Current streaks"]').is_hidden())
        for width in [390, 768, 1280]:
            self.page.set_viewport_size({'width': width, 'height': 900})
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))
        # on a computer, Today shows one section at a time; pick Personal study
        self.page.locator('#habitTabs').get_by_role('button', name='Personal study').click()
        self.page.get_by_role('button', name='Write', exact=True).click()
        ta = self.page.get_by_label('Study notes', exact=True)
        ta.fill('What I noticed')
        self.page.locator('.writing-toolbar').get_by_role('button', name='Heading', exact=True).click()
        expect(ta).to_have_value('## What I noticed')

    def test_storage_failure_is_reported(self):
        self.page.evaluate("""() => { const original=Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if(k.startsWith('dsl.doc:')) throw new DOMException('full','QuotaExceededError'); return original.call(this,k,v); }; }""")
        self.write_note()
        self.page.get_by_role('button', name='Done', exact=True).click()
        expect(self.page.locator('#statusText')).to_have_text('Not saved yet.')
        expect(self.page.get_by_role('button', name='Retry', exact=True)).to_be_visible()

    def test_existing_structured_notes_survive_and_are_searchable(self):
        self.page.evaluate("""() => {localStorage.setItem('dsl.doc:data/users/local/tracker/days/2025-01-01', JSON.stringify({date:'2025-01-01',updatedAt:1,bible:{ref:'Genesis 1',note:'Jehovah is creative',gems:'Order and purpose',question:'Why this order?'}}));}""")
        self.page.reload(wait_until='networkidle')
        self.page.get_by_role('button', name='Search everything', exact=True).click()
        self.page.get_by_label('Search everything', exact=True).fill('creative')
        self.page.locator('.search-dialog .row').click()
        expect(self.page.locator('#d-bible-note')).to_have_value('Jehovah is creative')
        expect(self.page.locator('#d-bible-gems')).to_have_value('Order and purpose')

    def test_cloud_pending_status_and_reload_recovery_without_server_ack(self):
        self.page.add_init_script("""(() => {
          localStorage.setItem('dsl.settings.v1',JSON.stringify({firebase:'apiKey:"public",projectId:"test"'}));
          const query={onSnapshot:(options,cb)=>{setTimeout(()=>cb({docs:[],metadata:{fromCache:false}}),0);return ()=>{};}};
          const root={collection:name=>({doc:id=>({id:id||'cloud-note',set:()=>new Promise(()=>{}),delete:()=>new Promise(()=>{})}),orderBy:()=>query})};
          window.firebase={apps:[{}],auth:()=>({onAuthStateChanged:cb=>{setTimeout(()=>cb({uid:'user',email:'test@example.com'}),0);return ()=>{};}}),
            firestore:()=>({enablePersistence:async()=>{throw Error('unavailable');},doc:()=>root})};
        })();""")
        self.page.reload(wait_until='networkidle')
        expect(self.page.locator('#statusText')).to_have_text('Synced')
        self.write_note('Cloud pending', 'This must survive without acknowledgement.')
        self.page.get_by_role('button', name='Done', exact=True).click()
        expect(self.page.locator('#statusText')).to_have_text('Saved on this device · Waiting to sync')
        self.page.reload(wait_until='networkidle')
        expect(self.page.locator('#statusText')).to_have_text('Saved on this device · Waiting to sync')
        self.page.get_by_role('button', name='Library', exact=True).click()
        self.page.get_by_role('button', name='Notebook', exact=True).click()
        self.page.locator('.collroot:visible .row').filter(has_text='Cloud pending').click()
        expect(self.page.get_by_label('Study notes', exact=True)).to_have_value('This must survive without acknowledgement.')

    def test_full_collection_export_and_invalid_restore(self):
        self.page.evaluate("""() => {
          for(let i=0;i<505;i++)localStorage.setItem('dsl.doc:data/users/local/tracker/notes/n'+i,JSON.stringify({title:'Note '+i,body:'A thought',createdAt:1,updatedAt:i+1}));
        }""")
        self.page.reload(wait_until='networkidle')
        self.settings()
        self.page.get_by_role('button', name='Create backup text', exact=True).click()
        backup=json.loads(self.page.locator('#s-backup').input_value())
        self.assertEqual(len([x for x in backup['docs'] if x['coll']=='notes']),505)
        self.page.get_by_text('Restore a backup',exact=True).click()
        self.page.locator('#s-backup').fill('{"app":"study-log","version":1,"docs":[{"coll":"notes","id":"__proto__","data":{}}]}')
        self.page.get_by_role('button', name='Review restore', exact=True).click()
        expect(self.page.locator('#s-backupmsg')).to_contain_text('invalid entry')
        self.assertTrue(self.page.locator('#s-restoreyes').is_hidden())

    def test_reading_by_topic_and_signed_out_groups(self):
        self.page.get_by_role('button', name='Week', exact=True).click()
        self.page.get_by_role('button', name='By topic', exact=True).click()
        self.page.get_by_role('button', name='The last days', exact=True).click()
        expect(self.page.locator('#planBox')).to_contain_text('2 Timothy 3:1-5')
        self.page.get_by_role('button', name='Today', exact=True).click()
        expect(self.page.locator('#weekHint')).to_contain_text('Reading by topic: The last days')
        self.page.locator('#toggle-bible').click()
        self.page.locator('#todayCh input[type=checkbox]').check()
        expect(self.page.locator('#progressText')).to_contain_text('1 of 3')
        self.page.reload(wait_until='networkidle')
        self.page.get_by_role('button', name='Week', exact=True).click()
        expect(self.page.locator('.topiccard .cap')).to_have_text('The last days · 1 of 5 read')
        self.page.get_by_role('button', name='Groups', exact=True).click()
        expect(self.page.get_by_role('button', name='Sign in or create an account')).to_be_visible()

if __name__ == '__main__':
    unittest.main()
