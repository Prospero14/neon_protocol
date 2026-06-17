import React, { useMemo } from 'react';
import { getNriClass, type NriClassId } from '../logic/nriClasses';
import { classSkillPool, filterSkillsToClassPool } from '../logic/nriSkillPick';

type Props = {
  classId: NriClassId;
  picked: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export const NriSkillPickField: React.FC<Props> = ({ classId, picked, onChange, disabled }) => {
  const { pickCount, options } = classSkillPool(classId);
  const validPicked = useMemo(() => filterSkillsToClassPool(classId, picked), [classId, picked]);
  const className = getNriClass(classId)?.name ?? classId;

  if (options.length === 0) return null;

  const toggle = (name: string) => {
    if (disabled) return;
    if (validPicked.includes(name)) {
      onChange(validPicked.filter((s) => s !== name));
      return;
    }
    if (validPicked.length >= pickCount) return;
    onChange([...validPicked, name]);
  };

  return (
    <div className="nri-skill-pick">
      <p className="mono-text nri-skill-pick__hint">
        Класс: {className}. Выберите {pickCount} навыка из пула ({options.length}).
      </p>
      <ul className="nri-skill-pick__list">
        {options.map((name) => {
          const on = validPicked.includes(name);
          const full = !on && validPicked.length >= pickCount;
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
