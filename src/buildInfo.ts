/**
 * «Линия» контента — меняй только вручную при значимом релизе (не меняется от пересборки).
 * Метка СБОРКА — всегда новая при каждом `vite build` (git-короткий хэш + время или VITE_BUILD_STAMP).
 */
export const OCTOBERLINE_LINE_VERSION = '0.11.01';

export const OCTOBERLINE_BUILD_STAMP: string = __OCTOBERLINE_BUILD_STAMP__;

/**
 * Сборка в начале — сразу видно, что деплой обновился; линия в конце.
 */
export const OCTOBERLINE_HUB_BRACKET_LABEL = `СБОРКА_${OCTOBERLINE_BUILD_STAMP} · ОКТЯБРЬСКАЯ_ЛИНИЯ_${OCTOBERLINE_LINE_VERSION}`;
