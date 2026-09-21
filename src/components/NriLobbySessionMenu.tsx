/** Выпадающее меню сессии НРИ: ссылка, покинуть, закрыть, выход из аккаунта. */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Copy, LogOut, XCircle } from 'lucide-react';

type Props = {
  username: string;
  isHost: boolean;
  onCopyLink: () => void;
  onLeaveTable: () => void;
  onCloseTable: () => void;
  onLogout: () => void;
  copied?: boolean;
};

export const NriLobbySessionMenu: React.FC<Props> = ({
  username,
  isHost,
  onCopyLink,
  onLeaveTable,
  onCloseTable,
  onLogout,
  copied,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="nri-session-menu" ref={rootRef}>
      <button
        type="button"
        className={`nri-session-menu__trigger ${open ? 'active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        @{username}
        <ChevronDown size={14} />
      </button>
      {open && (
        <ul className="nri-session-menu__list" role="menu">
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
      )}
    </div>
  );
};
