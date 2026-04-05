# Walkthrough: Neon Protocol v0.0948 "Narrative Audit & Rank Gating"

We have successfully completed the systemic narrative overhaul across all world districts. The primary objective was to replace direct, immersion-breaking quest acceptance with a more grounded, rank-aware dialogue system.

## Key Accomplishments

### 1. New Narrative Protocol: "Nos ne doros"
All NPCs giving major combat or technical quests now follow a standardized four-stage interaction model:
1.  **Quest Pitch**: A narrative hook explaining the problem/mission.
2.  **Rank Check**: An immersive in-game verification (e.g., scan, CRC check, manual inspection).
3.  **Acceptance/Rejection Branching**:
    -   **Reject**: Immersive dialogue for low-level players ("Nos ne doros"), guiding them toward easier content.
    -   **Accept**: Validation of the player's skills and official mission award.

### 2. Core Dialogue Engine Extension
We updated the core dialogue infrastructure to support this protocol without manual conditional logic in the component layer:
-   **`DialogueOption`**: Extended with `requireMinLevel`, `requireMaxLevel`, `isProOnly`, and `isTraineeOnly`.
-   **`FixerBarScene`**: Refactored to filter options dynamically based on the player's current Level and Rank.

### 3. Systematic World Audit
Applied the narrative protocol to **15 world nodes**, ensuring consistency across the entire Moscow Zero map:
-   **Starter Districts**: Maryino, Vykhino, Altufyevo (Level 0-2 gating).
-   **Mid-Tier Districts**: Chertanovo, Bibirevo, Tekstilschiki, Perovo, Sokol (Level 2-4 gating).
-   **Academic/Industrial**: VDNKH, South West, Izmailovo, Teply Stan (Level 4-5 gating).
-   **High Tier/End-Game**: Sokolniki, Fili, Taganka, Mitino (Level 5-8+ gating).

## Highlights by District

### VDNKH: General BESM
Implemented the **Trainee Exam** (Level 5+ check) and **Vintage Code** (Level 4+ check) gating. These are critical milestones in the player's progression.

### Sokol: Semenych
The "Drone Swarm" and "Server Overheat" missions now require Level 3+. Semenych will mock your "fresh paint" if your rank is too low.

### Taganka: The Auditor
High-tier content gating (Level 8+) for the Inquisitor. Accessing the Bunker Core now requires significant in-game experience.

### Perovo: Marina
Data mining quests now require Level 2+. Marina meticulously checks your "Hello World" logs before letting you near the archives.

## Verified Logic

The filtering logic in `FixerBarScene.tsx` ensures that:
-   **Trainee-only** options appear only for Level < 5 or unranked players.
-   **Pro-only** options appear only if the player has a profession.
-   **Min/Max Level** gates correctly hide/show rejection and acceptance paths respectively.

> [!IMPORTANT]
> The narrative protocol is now the standard for all future content. NEW NPCs should ALWAYS include a `rank_check` node before an `AWARD_QUEST` effect to maintain the immersion and progression curve.

## Next Steps
- [ ] User testing for the Level 5 exam progression.
- [ ] Visual polish for the "Rank Check" dialogue nodes (adding typewriter effects or scanning animations).
