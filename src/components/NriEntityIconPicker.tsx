import React, { useRef } from 'react';
import { NRI_ZONE_ICON_PRESETS } from '../../shared/nri-domain/zoneIcons';

type Props = {
  iconId: string;
  onChange: (iconId: string) => void;
  disabled?: boolean;
  label?: string;
};

export const NriEntityIconPicker: React.FC<Props> = ({
  iconId,
  onChange,
  disabled,
  label = 'Иконка',
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview =
    NRI_ZONE_ICON_PRESETS.find((p) => p.id === iconId)?.dataUrl ??
    (iconId.startsWith('url:') ? iconId.slice(4) : iconId.startsWith('data:') ? iconId : null);

  return (
    <div className="nri-modal__field">
      <span>{label}</span>
      <div className="nri-lore__icon-grid">
        {NRI_ZONE_ICON_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`nri-lore__icon-pick${iconId === preset.id ? ' active' : ''}`}
            title={preset.label}
            disabled={disabled}
            onClick={() => onChange(preset.id)}
          >
            <img src={preset.dataUrl} alt={preset.label} />
          </button>
        ))}
      </div>
      <div className="nri-presets__actions">
        <button
          type="button"
          className="nri-lobby__copy"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          Загрузить…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 120_000) {
              window.alert('Файл слишком большой (макс. 120 КБ).');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const v = String(reader.result ?? '');
              if (v.startsWith('data:image/')) onChange(v);
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>
      {preview && (
        <p className="mono-text opacity-60">
          Превью: <img src={preview} alt="" width={28} height={28} />
        </p>
      )}
    </div>
  );
};
