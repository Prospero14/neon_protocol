import { DIALOGUE_TREES } from '../src/logic/world';
import { NPC_LIBRARY } from '../src/logic/world';

function validateDialogues() {
  console.log('--- Starting Dialogue Validation ---');
  let errors = 0;
  let warnings = 0;

  const dialogueIds = Object.keys(DIALOGUE_TREES);

  // Check NPCs for valid dialogue references
  NPC_LIBRARY.forEach(npc => {
    if (!DIALOGUE_TREES[npc.id]) {
        console.warn(`[WARN] NPC '${npc.id}' (${npc.name}) has no defined dialogue tree.`);
        warnings++;
    }
  });

  dialogueIds.forEach(treeId => {
    const tree = DIALOGUE_TREES[treeId];
    if (!tree.nodes[tree.startNodeId]) {
      console.error(`[ERROR] Tree '${treeId}' has invalid startNodeId: '${tree.startNodeId}'`);
      errors++;
    }

    Object.keys(tree.nodes).forEach(nodeId => {
      const node = tree.nodes[nodeId];
      node.options.forEach(option => {
        if (option.nextId === 'LEAVE') return;
        if (!tree.nodes[option.nextId]) {
          console.error(`[ERROR] Tree '${treeId}', Node '${nodeId}': option '${option.text}' references non-existent node: '${option.nextId}'`);
          errors++;
        }
      });
    });

    if (tree.introPools) {
        Object.keys(tree.introPools).forEach(poolKey => {
            const pool = (tree.introPools as any)[poolKey] as string[];
            pool.forEach(nodeId => {
                if (!tree.nodes[nodeId]) {
                    console.error(`[ERROR] Tree '${treeId}', Pool '${poolKey}': references non-existent node: '${nodeId}'`);
                    errors++;
                }
            });
        });
    }
  });

  console.log(`--- Validation Finished: ${errors} Errors, ${warnings} Warnings ---`);
  if (errors > 0) process.exit(1);
}

validateDialogues();
