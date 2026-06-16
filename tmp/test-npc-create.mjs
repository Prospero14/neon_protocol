import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.nriSession.findFirst({ where: { status: 'open' } });
  if (!session) {
    console.log('no open session');
    return;
  }
  console.log('session', session.inviteCode, session.id);
  try {
    const npc = await prisma.nriNpc.create({
      data: {
        sessionId: session.id,
        name: 'Test NPC',
        classId: 'merc',
        inventory: [],
        sheet: {
          abilities: { STR: 12, DEX: 10, CON: 11, INT: 9, TEC: 14, PEO: 8 },
          level: 1,
          proficiencyBonus: 2,
          hpMax: 10,
          hp: 10,
          ac: 10,
        },
      },
    });
    console.log('created', npc.id);
    await prisma.nriNpc.delete({ where: { id: npc.id } });
    console.log('deleted ok');
  } catch (e) {
    console.error('create failed', e);
  }
}

main().finally(() => prisma.$disconnect());
