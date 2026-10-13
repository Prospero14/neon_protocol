import React, { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Link2, RotateCcw, Upload } from 'lucide-react';
import { getNriClass, type NriClassId } from '../logic/nriClasses';
import { getC2185ClassTemplate } from '../logic/nriCarbon2185';
import { PORTRAIT_CLASS_ACCENT, processPortraitUpload } from '../logic/nriPortraitCyberpunk';

type Props = {
  classId: string;
  characterName: string;
  portraitUrl?: string | null;
  /** Режим генерации: загрузка / URL / сброс. На листе — только показ. */
  editable?: boolean;
  onPortraitChange?: (dataUrl: string | null) => void;
  compact?: boolean;
};

function looksLikeUrl(raw: string): boolean {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) || t.startsWith('data:image/');
}

export const NriCharacterPortraitCard: React.FC<Props> = ({
  classId,
  characterName,
  portraitUrl,
  editable,
  onPortraitChange,
  compact,
}) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(portraitUrl?.startsWith('data:') ? '' : portraitUrl ?? '');

  useEffect(() => {
    if (!portraitUrl || portraitUrl.startsWith('data:')) {
      if (!portraitUrl) setUrlDraft('');
      return;
    }
    setUrlDraft(portraitUrl);
  }, [portraitUrl]);

  const cls = getNriClass(classId);
  const tpl = getC2185ClassTemplate(classId as NriClassId);
  const classLabel = cls?.name ?? tpl?.carbonName ?? classId;
  const nameLabel = characterName.trim() || 'Без имени';
  const accent = PORTRAIT_CLASS_ACCENT[classId] ?? '#0ff';
  const hasPhoto = !!(portraitUrl && portraitUrl.trim());

  const onFile = async (file: File | undefined) => {
    if (!file || !onPortraitChange) return;
    setBusy(true);
    setErr(null);
    try {
      const url = await processPortraitUpload(file);
      setUrlDraft('');
      onPortraitChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось обработать портрет');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const applyUrl = () => {
    if (!onPortraitChange) return;
    const t = urlDraft.trim();
    if (!t) {
      onPortraitChange(null);
      setErr(null);
      return;
    }
    if (!looksLikeUrl(t)) {
      setErr('Укажите http(s)-ссылку или data:image…');
      return;
    }
    setErr(null);
    onPortraitChange(t);
  };

  return (
    <div
      className={`nri-portrait-card ${compact ? 'nri-portrait-card--compact' : ''} ${hasPhoto ? 'has-photo' : 'is-placeholder'}`}
      style={{ ['--nri-portrait-accent' as string]: accent }}
    >
      <div className="nri-portrait-card__frame">
        {hasPhoto ? (
          <img src={portraitUrl!} alt="" className="nri-portrait-card__img" />
        ) : (
          <div className="nri-portrait-card__placeholder" aria-hidden>
            <div className="nri-portrait-card__silhouette" />
            <span className="nri-portrait-card__ph-label">
              <ImagePlus size={14} /> нейтральный юнит
            </span>
          </div>
        )}
        <div className="nri-portrait-card__scan" aria-hidden />
        <div className="nri-portrait-card__plaque">
          <span className="nri-portrait-card__class">{classLabel}</span>
          <strong className="nri-portrait-card__name">{nameLabel}</strong>
        </div>
      </div>

      {editable && (
        <div className="nri-portrait-card__actions">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="nri-vault__send-btn"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            {busy ? 'Фильтр…' : hasPhoto ? 'Заменить файл' : 'Загрузить файл'}
          </button>
          {hasPhoto && (
            <button
              type="button"
              className="nri-lobby__copy"
              disabled={busy}
              onClick={() => {
                setUrlDraft('');
                onPortraitChange?.(null);
              }}
              title="Вернуть заглушку"
            >
              <RotateCcw size={14} /> Сброс
            </button>
          )}

          <label className="mono-text nri-portrait-card__url">
            <Link2 size={14} />
            <span>Или URL</span>
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://… / data:image…"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyUrl();
                }
              }}
            />
            <button type="button" className="nri-lobby__copy" disabled={busy} onClick={applyUrl}>
              Применить
            </button>
          </label>

          <p className="mono-text opacity-60 nri-portrait-card__hint">
            {portraitUrl?.startsWith('data:')
              ? 'Загруженный файл уже прикреплён (поле URL пустое — это нормально). Сброс — убрать фото.'
              : 'Файл — с кибер-фильтром. Ссылка — как есть. Табличка: класс + имя.'}
          </p>
          {err && <p className="nri-lobby__err mono-text">{err}</p>}
        </div>
      )}
    </div>
  );
};
