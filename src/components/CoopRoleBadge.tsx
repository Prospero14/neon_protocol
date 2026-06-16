import type { CoopRole } from '../logic/sessionMode';
import { Code2, Bug, Server, Briefcase } from 'lucide-react';

const ROLE_META: Record<
  CoopRole,
  { Icon: typeof Code2; label: string; className: string }
> = {
  developer: { Icon: Code2, label: 'DEV', className: 'coop-role-badge--dev' },
  qa: { Icon: Bug, label: 'QA', className: 'coop-role-badge--qa' },
  admin: { Icon: Server, label: 'OPS', className: 'coop-role-badge--ops' },
  pm: { Icon: Briefcase, label: 'PM', className: 'coop-role-badge--pm' },
};

export function CoopRoleBadge({
  role,
  size = 18,
}: {
  role: string;
  size?: number;
}) {
  const r = role as CoopRole;
  const meta = ROLE_META[r];
  if (!meta) {
    return (
      <span className="coop-role-badge coop-role-badge--unknown" style={{ width: size + 8, height: size + 4 }}>
        ?
      </span>
    );
  }
  const { Icon, label, className } = meta;
  return (
    <span className={`coop-role-badge ${className}`} title={label} aria-label={label}>
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
