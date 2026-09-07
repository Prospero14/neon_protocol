import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

/**
 * Android back / gesture: prefer in-app history over exiting the WebView.
 */
export function installNativeShellHandlers(): void {
  if (!Capacitor.isNativePlatform()) return;

  void CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack || window.history.length > 1) {
      window.history.back();
      return;
    }
    // Stay in app on root — user can use logout / OS task switcher.
  });
}
