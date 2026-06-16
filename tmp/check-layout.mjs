import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const meta = await p.nriMapZone.findFirst({ where: { zoneKey: '__layout__' } });
const cnt = await p.nriMapZone.count();
console.log('layout:', meta?.name, 'zones:', cnt);
await p.$disconnect();
