import fs from 'fs';
const p = 'server/services/nriService.ts';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('nriItemTransfer')) {
  s = s.replace(
    "import { mountNriLoreTravelRoutes } from './nriLoreTravel.js';",
    "import { mountNriLoreTravelRoutes } from './nriLoreTravel.js';\nimport { mountNriItemTransferRoutes } from './nriItemTransfer.js';"
  );
  fs.writeFileSync(p, s);
  console.log('patched import');
} else {
  console.log('import already present');
}
