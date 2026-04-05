import { MAP_NODES } from './src/logic/mapData';
import { TUTORIAL_QUESTS } from './src/logic/questData';

const npcQuestsPerNpc = 2; // diagnostics + talk
const combatQuestsPerNode = 2; // combat + delivery

const stats = {};

// Count tutorial quests
TUTORIAL_QUESTS.forEach(q => {
  if (!stats[q.districtId]) stats[q.districtId] = { tutorial: 0, npc: 0, combat: 0, perType: {} };
  stats[q.districtId].tutorial++;
  stats[q.districtId].perType[q.type] = (stats[q.districtId].perType[q.type] || 0) + 1;
});

// Count dynamic quests
MAP_NODES.forEach(node => {
  if (!stats[node.id]) stats[node.id] = { tutorial: 0, npc: 0, combat: 0, perType: {} };
  
  const npcs = node.subNodes?.filter(s => s.type === 'npc') || [];
  const combats = node.subNodes?.filter(s => s.type === 'combat') || [];
  
  stats[node.id].npc += npcs.length * npcQuestsPerNpc;
  npcs.forEach(() => {
    stats[node.id].perType['diagnostics'] = (stats[node.id].perType['diagnostics'] || 0) + 1;
    stats[node.id].perType['talk'] = (stats[node.id].perType['talk'] || 0) + 1;
  });

  stats[node.id].combat += combats.length * combatQuestsPerNode;
  combats.forEach(() => {
    stats[node.id].perType['combat'] = (stats[node.id].perType['combat'] || 0) + 1;
    stats[node.id].perType['delivery'] = (stats[node.id].perType['delivery'] || 0) + 1;
  });
});

console.log(JSON.stringify(stats, null, 2));
