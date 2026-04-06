const fs = require('fs');
const path = require('path');

function run(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      run(p);
    } else if (p.endsWith('dialogues.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      
      const p1 = /effect:\s*['"]AWARD_QUEST['"]\s*,\s*cardRewardId:\s*['"]([^'"]+)['"]/g;
      const p2 = /effect:\s*['"]COMPLETE_TALK_QUEST['"]\s*,\s*cardRewardId:\s*['"]([^'"]+)['"]/g;
      const p3 = /cardRewardId:\s*['"]([^'"]+)['"]\s*,\s*effect:\s*['"]AWARD_QUEST['"]/g;
      const p4 = /cardRewardId:\s*['"]([^'"]+)['"]\s*,\s*effect:\s*['"]COMPLETE_TALK_QUEST['"]/g;
      
      c = c.replace(p1, "awardQuestId: '$1'");
      c = c.replace(p2, "completeQuestId: '$1'");
      c = c.replace(p3, "awardQuestId: '$1'");
      c = c.replace(p4, "completeQuestId: '$1'");
      
      fs.writeFileSync(p, c);
      console.log('Fixed:', p);
    }
  }
}
run('./src/logic/world');
