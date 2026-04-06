import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createJiti } from "jiti";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jiti = createJiti(import.meta.url);

async function validateDialogues(targetDistrict?: string) {
  const worldPath = path.resolve(__dirname, '../src/logic/world');
  const districts = targetDistrict ? [targetDistrict] : fs.readdirSync(worldPath).filter(f => fs.statSync(path.join(worldPath, f)).isDirectory() && f !== 'types' && f !== 'punitive');

  console.log(`--- Starting Dialogue Validation (${targetDistrict || 'ALL'}) ---`);
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const district of districts) {
    try {
      // Use jiti to handle .ts and extensionless imports correctly
      // We use the absolute path to ensure jiti finds it.
      const absolutePath = path.resolve(worldPath, district, 'index.ts');
      const districtModule = await jiti.import(absolutePath) as any;
      const districtData = districtModule[district] || (district === 'hub' ? districtModule.hub : null);

      if (!districtData) {
        console.warn(`[WARN] Skipping '${district}': No export found matching district name.`);
        continue;
      }

      console.log(`> Validating district: ${district.toUpperCase()}`);
      const { npcs, dialogues } = districtData as any;

      if (!dialogues) {
          console.error(`[ERROR] District '${district}' has no dialogues.`);
          totalErrors++;
          continue;
      }

      const dialogueIds = Object.keys(dialogues);

      // Check NPCs
      npcs?.forEach((npc: any) => {
        if (!dialogues[npc.id]) {
            console.warn(`  [WARN] NPC '${npc.id}' (${npc.name}) has no defined dialogue tree.`);
            totalWarnings++;
        }
      });

      // Check Trees
      dialogueIds.forEach(treeId => {
        const tree = dialogues[treeId];
        if (!tree.nodes[tree.startNodeId]) {
          console.error(`  [ERROR] Tree '${treeId}' has invalid startNodeId: '${tree.startNodeId}'`);
          totalErrors++;
        }

        Object.keys(tree.nodes).forEach(nodeId => {
          const node = tree.nodes[nodeId];
          if (!node.options) {
             console.error(`  [ERROR] Tree '${treeId}', Node '${nodeId}': has no options array.`);
             totalErrors++;
             return;
          }
          node.options.forEach((option: any) => {
            if (option.nextId === 'LEAVE') return;
            if (!tree.nodes[option.nextId]) {
              console.error(`  [ERROR] Tree '${treeId}', Node '${nodeId}': option '${option.text}' references non-existent node: '${option.nextId}'`);
              totalErrors++;
            }
          });
        });

        if (tree.introPools) {
            Object.keys(tree.introPools).forEach(poolKey => {
                const pool = (tree.introPools as any)[poolKey] as string[];
                pool.forEach(nodeId => {
                    if (!tree.nodes[nodeId]) {
                        console.error(`  [ERROR] Tree '${treeId}', Pool '${poolKey}': references non-existent node: '${nodeId}'`);
                        totalErrors++;
                    }
                });
            });
        }
      });

      // Memory logging
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`  Memory usage: ~${Math.round(used * 100) / 100} MB`);

    } catch (e: any) {
      console.error(`[ERROR] Failed to load district '${district}':`);
      console.error(e);
      totalErrors++;
    }
  }

  console.log(`--- Validation Finished: ${totalErrors} Errors, ${totalWarnings} Warnings ---`);
  if (totalErrors > 0) process.exit(1);
}

const arg = process.argv[2];
validateDialogues(arg === '--district' ? process.argv[3] : undefined);
