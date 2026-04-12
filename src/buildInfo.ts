/**
 * Крупная «линия» хаба — меняй при значимом контентном релизе.
 * Метка сборки (BUILD_…) подставляется при production build автоматически
 * или из env VITE_BUILD_STAMP (например id деплоя в Amvera).
 */
export const OCTOBERLINE_LINE_VERSION = '0.11.01';

export const OCTOBERLINE_BUILD_STAMP: string = __OCTOBERLINE_BUILD_STAMP__;

/** Текст в квадратных скобках под заголовком OCTOBERLINE в хабе. */
export const OCTOBERLINE_HUB_BRACKET_LABEL = `ОКТЯБРЬСКАЯ_ЛИНИЯ_${OCTOBERLINE_LINE_VERSION} | BUILD_${OCTOBERLINE_BUILD_STAMP}`;
