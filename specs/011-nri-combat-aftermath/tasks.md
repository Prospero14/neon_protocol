# 011 — tasks

## Done (prep / inventory+status)

- [x] UI densify inventory (player + master catalog chips)
- [x] `defaultMinutes` on intoxicated / boosted; `conditionMinutes` in consume spec
- [x] Status duration on sheet + inventory strip (`formatConditionDuration`)
- [x] Tests: consume qty, expiresAt, prune restores DEX, equip on/off

## Next

- [ ] `applyCombatAftermathPatch(sheet, inventory, patch)` in shared domain
- [ ] Wire CombatBridge / master end-combat → patch → profile sync
- [ ] Conditions: bleeding tick HP; dead flag; crit/stun from combat log
- [ ] Persist aftermath notes to table chat
