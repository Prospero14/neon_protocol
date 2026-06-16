import React from 'react';
import { C2185_SKILLS } from '../logic/nriCarbon2185';
import type { NriClassId } from '../logic/nriClasses';
import { classSkillPool } from '../logic/nriSkillPick';

type Props = {
  classId: NriClassId;
  picked: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export const NriSkillPickField: React.FC<Props> = ({ classId, picked, onChange, disabled }) => {
  const { pickCount, options } = classSkillPool(classId);
  if (options.length === 0) return null;

  const toggle = (name: string) => {
    if (disabled) return;
    if (picked.includes(name)) {
      onChange(picked.filter((s) => s !== name));
      return;
    }
    if (picked.length >= pickCount) return;
    onChange([...picked, name]);
  };

  return (
    <div className="nri-skill-pick">
      <p className="mono-text nri-skill-pick__hint">
        Всего в системе {C2185_SKILLS.length} навыков; класс выбирает {pickCount} из {options.length} своего пула.
      </p>
      <ul className="nri-skill-pick__list">
        {options.map((name) => {
          const on = picked.includes(name);
          const full = !on && picked.length >= pickCount;
          return (
            <li key={name}>
              <label className={`nri-skill-pick__opt ${on ? 'active' : ''} ${full ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled || full}
                  onChange={() => toggle(name)}
                />
                {name}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
