export interface PreClassState {
  classUnlocked: boolean;
  completedQuestCount: number;
  bitsEarnedFromQuests: number;
  tutorialCompleted?: boolean;
  exploitsCount?: number;
}

export const PRECLASS_UNLOCK_QUESTS = 3; // Reduced to focus on the tutorial
export const PRECLASS_UNLOCK_BITS = 300;

export function canUnlockClass(state: PreClassState): boolean {
  const hasExploits = (state.exploitsCount ?? 0) >= 5;
  return hasExploits && !!state.tutorialCompleted;
}

/*
- [x] **UI Alignment Fixes**
    - [x] Fix NPC Contract button overlap
    - [x] Standardize Map Header buttons (Amethyst style)
- [x] **Lore & Reputation Foundation**
    - [x] Phase 1: Faction Matrix & State (App.tsx)
    - [x] Phase 2: Reputation UI (CharacterScreen.tsx)
    - [x] Phase 3: Dialogue Engine Logic (FixerBarScene.tsx)
- [x] **Lore Content Expansion**
    - [x] Phase 4a: Kitay-Gorod (The Hub)
    - [x] Phase 4b: Altufyevo & Education
    - [x] Phase 4c: Anarchists & State Orgs
- [x] **Trainee Exam (Tutorial)**
    - [x] Define Tutorial Quests (questData.ts)
    - [x] Link Profession Advancement to Tutorial Completion (preClassProgression.ts)
- [x] **Artifacts & Items**
    - [x] Implement Collectible Artifacts (items.ts)
- [/] **System Verification**
    - [x] Manual Playtest (Browser Subagent)
    - [ ] Combat Balance Audit
- [ ] **Final Deployment**
    - [ ] Push to Amvera Prod
*/
