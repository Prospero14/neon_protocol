import { chatOpenDm, chatSendMessage } from './chatApi';

export type NriChatSendTarget =
  | { kind: 'table' }
  | { kind: 'dm'; userId: string };

export async function sendNriChatMessage(
  token: string,
  tableRoomId: string,
  nriCode: string,
  text: string,
  target: NriChatSendTarget
): Promise<boolean> {
  if (!text.trim()) return false;
  if (target.kind === 'dm') {
    const dm = await chatOpenDm(token, target.userId);
    if (!dm) return false;
    const msg = await chatSendMessage(token, dm.id, text, { nriCode });
    return !!msg;
  }
  const msg = await chatSendMessage(token, tableRoomId, text, { nriCode });
  return !!msg;
}
