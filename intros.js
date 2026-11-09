/* Book and section introductions for the Bible reading card.
   Written for this app, in its own words, based on jw.org, the Watchtower Online Library
   and the New World Translation Study Edition. They give the setting and what to watch for,
   without giving away what happens. Each book lists the pages it is based on.
   Sections start at the chapter numbers below (they match the reading plan's natural breaks).
   Exposes window.BIBLE_INTROS. Loaded before app.js. */
(function(){
'use strict';
const WOL='https://wol.jw.org/en/wol/d/r1/lp-e/';
const INSIGHT='https://www.jw.org/en/library/books/Insight-on-the-Scriptures/';
window.BIBLE_INTROS={
  'Genesis':{
    meaning:'“Origin” or “beginning”',
    writer:'Moses',
    written:'In the wilderness, completed 1513 B.C.E.',
    covers:'From “the beginning” to 1657 B.C.E.',
    setting:'The Bible opens before there were any nations, kings or written law. Most of the book follows one family living as foreigners, trusting promises that would take generations to come true.',
    why:'Genesis lays the foundation for the rest of the Bible. It shows that Jehovah is the Creator, explains why people suffer and die, and records the Bible’s first prophecy: the promise of an “offspring” that the rest of the Bible keeps returning to, and that jw.org explains points to Jesus and God’s Kingdom.',
    watch:['How Jehovah keeps his word across many generations','How ordinary people, flaws and all, choose whether to trust him','The family line through which the promised offspring would come'],
    sources:[['“All Scripture Is Inspired”: Genesis',WOL+'1101990062'],['Insight: Genesis',INSIGHT+'Genesis-Book-of/']],
    sections:{
      1:'The Bible opens before there were any people, with Jehovah as the Creator. Watch for what each stage of creation shows about his wisdom and care, and what he purposed for humans and the earth.',
      3:'The first man and woman are living in the garden Jehovah prepared, with one clear command. Watch for the first lie, the first prophecy, and how the effects of a single choice spread from one generation to the next.',
      6:'Many generations have passed since Eden, and the earth has become violent. One man stands out. Watch for what made Noah different, and how Jehovah’s patience and justice work together.',
      12:'The nations have spread out, and Jehovah singles out one man living in the city of Ur. Watch for what Abram is asked to leave behind, the promises he is given, and how his faith grows when things do not go as expected.',
      18:'Abraham is about 99 and still waiting for the son Jehovah promised, while his nephew Lot has settled near Sodom. Watch for how Jehovah treats Abraham as a friend, and what Abraham’s choices show about his faith.',
      21:'Abraham and Sarah have waited 25 years for the son Jehovah promised. Watch for how Abraham’s faith is tested in new ways, and how Jehovah provides.',
      25:'The promise now rests on Isaac’s family, and his two sons could hardly be more different. Watch for what each brother values, and how Jehovah’s purpose keeps moving forward in a divided family.',
      29:'Jacob has left home alone and arrives among his mother’s relatives in Haran. Watch for how Jacob, who once deceived, is himself treated, and how Jehovah blesses him through hard years.',
      32:'After many years away, Jacob heads back toward the land promised to his family, where his brother Esau still lives. Watch for how Jacob prepares, and what he asks of Jehovah.',
      37:'Jacob’s family lives in Canaan, but there is jealousy among his sons, especially toward the son he loves most. Watch for how Joseph keeps his integrity, and how Jehovah is with him in every situation.',
      42:'A severe famine has reached Canaan, and Jacob’s family needs food. Watch for whether Joseph’s brothers have changed, and how forgiveness and Jehovah’s purpose come together.',
      46:'Jacob’s family is about to begin a new chapter of its life. Watch for Jacob’s final words to his sons, including his words about Judah, which jw.org explains point to the Messiah, and the hope he and Joseph hold onto.'
    }
  },
  'Exodus':{
    meaning:'“Going out” or “departure”',
    writer:'Moses',
    written:'In the wilderness, completed 1512 B.C.E.',
    covers:'1657–1512 B.C.E., about 145 years',
    setting:'Joseph has died, and Jacob’s descendants have grown into a large people living in Egypt under a new Pharaoh who did not know Joseph.',
    why:'Exodus shows what Jehovah’s name means: that he becomes whatever is needed to fulfill his purpose. It records the Passover, which the Bible links to Jesus as the Passover lamb, and the Law covenant and the tabernacle, which the book of Hebrews explains as a shadow of greater things to come.',
    watch:['How Jehovah makes his name known','How Moses grows as a leader','How quickly people can forget what Jehovah has done for them'],
    sources:[['“All Scripture Is Inspired”: Exodus',WOL+'1101990063'],['Insight: Exodus',INSIGHT+'Exodus-Book-of/']],
    sections:{
      1:'Jacob’s descendants are now a large nation in Egypt, and a new king sees them as a threat. Watch for the courage of ordinary people, and how Jehovah prepares a deliverer.',
      5:'Moses has returned to Egypt with a message for Pharaoh. Watch for how Pharaoh responds to Jehovah, and what each event shows about Jehovah compared with the gods of Egypt.',
      12:'Israel waits for a night unlike any other. Watch for the instructions Jehovah gives, and what jw.org explains the Passover lamb points to.',
      16:'Israel is now traveling through the wilderness, where food and water are real worries. Watch for how Jehovah provides day by day, and how the people’s trust is tested.',
      19:'Israel arrives at Mount Sinai, where Jehovah has something important to offer the nation. Watch for the agreement he makes with them, and the principles behind the laws.',
      25:'Moses is on the mountain, receiving detailed instructions for a place of worship. Watch for the care in every detail, and how Hebrews explains these things as pictures of greater things.',
      32:'Moses has been on the mountain for a long time, and the people below are growing impatient. Watch for how Moses pleads for the people, and what Jehovah reveals about his own qualities.',
      35:'Israel turns to the work of building the place of worship. Watch for the people’s willing spirit, and how Jehovah shows his approval.'
    }
  },
  'Leviticus':{
    meaning:'“Pertaining to the Levites,” the tribe of the priests',
    writer:'Moses',
    written:'In the wilderness, at Mount Sinai, 1512 B.C.E.',
    covers:'About one month, in 1512 B.C.E.',
    setting:'Israel is camped at Mount Sinai, and the tabernacle has just been set up. Most of the book is Jehovah’s instructions rather than events.',
    why:'Leviticus speaks of holiness more than any other Bible book. Its sacrifices and priesthood picture Jesus’ sacrifice and his role as High Priest, as the book of Hebrews explains, and its principles still show what clean worship means.',
    watch:['Why Jehovah asks his people to be holy','What each offering was for','The principle behind each law, not just the rule'],
    sources:[['“All Scripture Is Inspired”: Leviticus',WOL+'1101990064'],['Insight: Leviticus',INSIGHT+'Leviticus/']],
    sections:{
      1:'With the tabernacle set up, Jehovah explains the offerings Israel could bring. Watch for what each one was for, and what it shows about approaching Jehovah. Hebrews explains how these point to Jesus’ sacrifice.',
      8:'Everything is ready for the priests to begin serving. Watch for how seriously Jehovah takes the way he is worshipped.',
      11:'Jehovah now turns to everyday life: food, illness and cleanness. Watch for how these laws protected Israel and set them apart, and what it means to be clean in Jehovah’s eyes.',
      16:'Once a year, Israel would observe one special day. Watch for what the high priest does, and how Hebrews explains this day as a picture of what Jesus would do.',
      18:'These chapters focus on how a holy people should live. Watch for the repeated call to be holy, and the command about loving your neighbor that Jesus later quoted.',
      23:'Jehovah sets out Israel’s yearly festivals and other arrangements, including rest for the land. Watch for the joy and generosity built into them.',
      26:'The book closes with what lies ahead for Israel depending on its choices. Watch for how both Jehovah’s blessings and his discipline show love.'
    }
  },
  'Numbers':{
    meaning:'Named for the two times Israel was counted (numbered)',
    writer:'Moses',
    written:'In the wilderness and on the Plains of Moab, completed 1473 B.C.E.',
    covers:'1512–1473 B.C.E., about 38 years and 9 months',
    setting:'Israel is still camped at Mount Sinai, organized as a nation and about to set out for the land Jehovah promised.',
    why:'Numbers records lessons from the wilderness that the Bible says were written down as a warning for us. It shows the value of faith, of respecting Jehovah’s arrangements, and of not complaining.',
    watch:['How the people respond to hardship','How Moses handles pressure from every side','How patient Jehovah is with his people'],
    sources:[['“All Scripture Is Inspired”: Numbers',WOL+'1101990065'],['Insight: Numbers',INSIGHT+'Numbers-Book-of/']],
    sections:{
      1:'Israel is camped at Sinai, and Jehovah organizes the nation before it sets out. Watch for the order in the camp and the special role given to the Levites.',
      5:'Before leaving Sinai, Jehovah gives further arrangements to keep the camp clean and devoted to him. Watch for the Nazirite vow and the priestly blessing, and what they show about wholehearted devotion.',
      9:'Israel finally sets out from Sinai. Watch for how Jehovah guides the camp, and how complaining starts to affect the people and even Moses.',
      13:'Israel has reached the edge of the land Jehovah promised. Watch for what twelve men report, and the difference faith makes.',
      16:'In the wilderness, some begin to question the authority of Moses and Aaron. Watch for how Jehovah shows whom he has chosen, and why loyalty matters.',
      20:'Many years have passed in the wilderness, and Israel is nearing the end of its journey. Watch for a moment of pressure for Moses, and how Jehovah protects his people from those who want to curse them.',
      26:'A new generation is ready to enter the land. Watch for how Jehovah prepares them, including for a new leader, and a request from five sisters.',
      31:'Israel is camped on the Plains of Moab, at the doorstep of the land. Watch for the decisions about where the tribes will live, and the care Jehovah shows in its boundaries and cities of refuge.'
    }
  },
  'Deuteronomy':{
    meaning:'“Repetition of the Law” (a second telling of it)',
    writer:'Moses',
    written:'On the Plains of Moab, completed 1473 B.C.E.',
    covers:'About two months, in 1473 B.C.E.',
    setting:'Israel is camped on the Plains of Moab, ready to cross the Jordan. Moses, now 120 years old, speaks to a new generation.',
    why:'Deuteronomy urges heartfelt love for Jehovah and obedience from the heart. Jesus quoted it more than once, including what he called the greatest commandment, and it contains the promise of a prophet like Moses, which the Christian Greek Scriptures apply to Jesus.',
    watch:['Moses’ appeal to love Jehovah with your whole heart','How he draws lessons from Israel’s past','The choices that lead to life'],
    sources:[['“All Scripture Is Inspired”: Deuteronomy',WOL+'1101990066']],
    sections:{
      1:'Moses begins speaking to the new generation, looking back over the journey from Sinai. Watch for the lessons he draws from their parents’ choices.',
      5:'Moses reviews the Ten Commandments and the heart behind obeying them. Watch for the command Jesus later called the greatest, and the warnings about forgetting Jehovah when life is good.',
      12:'Moses turns to laws for life in the land: worship, justice and care for others. Watch for how often Jehovah shows concern for the poor, the widow and the foreigner, and the promise of a prophet like Moses.',
      19:'More laws for daily life: justice, war, family and neighbors. Watch for the balance of justice and mercy in them.',
      27:'Moses sets two paths before the nation. Watch for the blessings and the curses, and the choice he urges them to make.',
      31:'Moses’ time as leader is coming to an end. Watch for the song he teaches the people, and his final words to the tribes.'
    }
  }
};
})();
