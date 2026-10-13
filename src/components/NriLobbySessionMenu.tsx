/** Выпадающее меню сессии НРИ: скины, ссылка, покинуть, закрыть, выход. */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Copy, LogOut, Palette, XCircle } from 'lucide-react';
import {
  NRI_LOBBY_SKINS,
  type NriLobbySkinId,
} from '../logic/nriLobbySkin';

type Props = {
  username: string;
  isHost: boolean;
  onCopyLink: () => void;
  onLeaveTable: () => void;
  onCloseTable: () => void;
  onLogout: () => void;
  copied?: boolean;
  lobbySkin: NriLobbySkinId;
  onLobbySkinChange: (id: NriLobbySkinId) => void;
};

export const NriLobbySessionMenu: React.FC<Props> = ({
  username,
  isHost,
  onCopyLink,
  onLeaveTable,
  onCloseTable,
  onLogout,
  copied,
  lobbySkin,
  onLobbySkinChange,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const updatePos = () => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 6,
      right: Math.max(8, window.innerWidth - r.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onReposition = () => updatePos();
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  const menu = open
    ? createPortal(
        <div
          ref={listRef}
          className="nri-session-menu__list"
          role="menu"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="nri-session-menu__skins" role="group" aria-label="Визуал оболочки">
            <div className="nri-session-menu__skins-head mono-text">
              <Palette size={12} /> skin
            </div>
            <select
              className="nri-session-menu__skin-select"
              value={lobbySkin}
              aria-label="Визуал оболочки"
              onChange={(e) => onLobbySkinChange(e.target.value as NriLobbySkinId)}
            >
              <optgroup label="Form">
                {NRI_LOBBY_SKINS.filter((s) => s.group === 'form').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Moodboard 20">
                {NRI_LOBBY_SKINS.filter((s) => s.group === 'mood20').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="nri-session-menu__skin-chips">
              {NRI_LOBBY_SKINS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={lobbySkin === s.id ? 'active' : ''}
                  title={s.label}
                  aria-pressed={lobbySkin === s.id}
                  onClick={() => onLobbySkinChange(s.id)}
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>
          <ul className="nri-session-menu__actions">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="nri-session-menu__item"
                onClick={() => {
                  onCopyLink();
                  setOpen(false);
                }}
              >
                <Copy size={14} /> {copied ? 'Скопировано' : 'Скопировать ссылку'}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="nri-session-menu__item"
                onClick={() => {
                  onLeaveTable();
                  setOpen(false);
                }}
              >
                <LogOut size={14} /> Покинуть стол
              </button>
            </li>
            {isHost && (
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="nri-session-menu__item nri-session-menu__item--danger"
                  onClick={() => {
                    onCloseTable();
                    setOpen(false);
                  }}
                >
                  <XCircle size={14} /> Закрыть стол
                </button>
              </li>
            )}
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="nri-session-menu__item nri-session-menu__item--danger"
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
              >
                <LogOut size={14} /> Выйти из аккаунта
              </button>
            </li>
          </ul>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="nri-session-menu" ref={rootRef}>
      <button
        type="button"
        className={`nri-lobby__copy nri-session-menu__trigger ${open ? 'active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        @{username}
        <ChevronDown size={14} />
      </button>
      {menu}
    </div>
  );
};
