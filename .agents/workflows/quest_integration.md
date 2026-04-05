---
description: Neon Protocol Quest Integration Standard
---

# 🚀 Neon Protocol Quest & NPC Integration Workflow

This document outlines the strict standard for creating and integrating Quests and NPCs into Neon Protocol. All AI agents (Antigravity, Gemini Flash) **MUST** strictly adhere to these rules to maintain the `v0.10` Narrative System stability.

## 🚨 1. Core Principles
* **No Auto-Rewards:** Never let the engine automatically close a quest and hand out rewards on combat or travel finish. The player must **always** return to an NPC or Terminal to manually click a turn-in dialogue line.
* **Granular Quest Gating:** Use `requireActiveQuestId`, `requireReadyQuestId`, and `requireCompletedQuestId` precisely. Do NOT use the legacy check `requireQuestId` if you mean "quest is ready to turn in".
* **Data Definition:** If a quest is given via a dialogue node, it **MUST** exist in `src/logic/questData.ts` as a `QuestDefinition`.

## 🏗 2. Adding a New Quest
1. Open `src/logic/questData.ts`.
2. Add a new `QuestDefinition` to `QUEST_LIBRARY`.
3. Provide the `id`, `title`, `description`, `districtId`, `giverNpcId` and `type` (talk/combat/delivery/diagnostics).
4. **CRITICAL:** Set the `objectiveNodeId` correctly:
    * If `combat`: Set it to the ID of the Combat Node where the fight actually takes place.
    * If `delivery`/`diagnostics`: Set it to the target NPC or Terminal ID the player must click to reach the destination.
    * If `talk`: Set it to `objectiveNodeId` if required, but generally `talk` quests are handled directly in dialogues without travel auto-completion.

## 🗣 3. Adding the Quest Giver Dialogue
Use the `DialogueBuilder` in the respective district's `dialogues.ts` file.
When the NPC gives the quest, add the `AWARD_QUEST` effect:
```typescript
.addNode('quest_offer', 'NPC_NAME', 'Возьми этот контракт.', [
  { 
    text: '[ ПРИНЯТЬ ]', 
    nextId: 'LEAVE', 
    effect: 'AWARD_QUEST', 
    awardQuestId: 'q_example_quest_id' 
  }
])
```

## ✅ 4. Adding the Turn-In Dialogue
Once a player completes the `combat` or arrives at a `delivery` node, the App will automatically change the quest state to `ready_to_turn_in`.
To allow the player to turn it in, the NPC MUST use `requireReadyQuestId` (for combat/delivery) or `requireActiveQuestId` (for talk quests):

```typescript
.addNode('intro', 'NPC_NAME', 'Как успехи?', [
  // Combat / Delivery quests need to be ready
  { 
    text: 'Я зачистил сервер.', 
    nextId: 'quest_complete_node', 
    requireReadyQuestId: 'q_example_quest_id' 
  },
  // Talk quests stay active until closed manually
  { 
    text: 'Вот пароль, который ты просил.', 
    nextId: 'quest_complete_node2', 
    requireActiveQuestId: 'q_example_talk_quest' 
  }
])
.addNode('quest_complete_node', 'NPC_NAME', 'Отличная работа, вот Bits!', [
  { 
    text: 'Рад помочь.', 
    nextId: 'intro', 
    effect: 'GIVE_BITS', 
    amount: 50, 
    completeQuestId: 'q_example_quest_id'  // This actually removes it from active list and moves it to completed
  }
])
```

## 🌍 5. Adding new NPCs / Terminals
If you introduce a new interaction node, make sure it is registered:
1. Under `subNodes` in `src/logic/world/[district]/index.ts`.
2. Add its `DialogueTree` to the same folder's `dialogues.ts`.
3. If it is an NPC, add their lore entry to `npcs.ts` if required.

## 🔗 6. Execution Chains (Script-Kiddie & Junior Combat)
Starting with `v0.10+`, Scripting and Logic combat tasks require **Execution Chains** (strict card ordering on the rail) instead of just filling a progress bar. 
* **MANDATORY DIALOGUE RULE:** If an NPC gives a `combat` or `diagnostics` quest that requires a specific chain of tools (e.g., `ls` -> `grep` -> `scp`), the NPC **MUST** explicitly justify this chain in their text!
* **Example:** *"You need to find the deleted records containing her name and extract them to my drive. Remember: first list the directory contents, then filter by her ID, and finally initiate a secure copy export."*
* The player needs this textual clue to solve the puzzle in `CombatBridge`.
