# Neon Protocol State: Stable World & Quest Audit

This document summarizes the state of the project as of the `feature/stable-world-audit` branch.

## Key Accomplishments

### 1. Global Modularization (The "Altufyevo Gold Standard")
- All 18 districts of the world (Academy, Altufyevo, Bibirevo, Chertanovo, Fili, Hub, Izmailovo, Maryino, Mitino, Perovo, Sokol, Sokolniki, South West, Taganka, Tekstilschiki, Teply Stan, VDNKH, Vykhino) have been modularized.
- Each district now has its own directory structure:
  - `npcs/` - Individual NCP definitions and dialogues.
  - `objects/` - Individual node definitions (bars, shops, terminals, combat).
  - `index.ts` - Orchestrator for the district.
- Resolved previous Out-of-Memory (OOM) issues by implementing a per-district validation system.

### 2. Comprehensive Quest Audit
- Performed a full scan of all 200+ dialogue files.
- Identified and registered **47 missing quest IDs** in the central `QUEST_LIBRARY`.
- Standardized quest types: `combat`, `talk`, `delivery`, `diagnostics`, `cert`, `access`.
- Synchronized auto-generated combat quests with dialogue references.

### 3. Validation and Stability
- Global validation script (`scripts/validate-dialogues.ts`) now passes with **0 Errors and 0 Warnings** across the entire world.
- All `awardQuestId`, `completeQuestId`, and `requireItemId` references are verified against the libraries.

## System Architecture
- **World Engine**: Uses `WorldDistrict` class for lazy-loading and encapsulation.
- **Dialogue Builder**: Unified syntax for non-linear dialogue trees with quest gating.
- **Quest Engine**: Centralized state management in `questEngine.ts` and `questData.ts`.

---
*This branch serves as a stable base for the upcoming Combat System Overhaul.*
