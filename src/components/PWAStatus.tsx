import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * App-wide PWA status banners:
 *  - "You're offline" — construction-site connectivity is often patchy, and
 *    every write in this app goes straight to Supabase with no offline
 *    queue, so silent failures are confusing. This at least tells the user
 *    why an action didn't go through.
 *  - "New version available" — the SW is registered with registerType:
 *    'autoUpdate', but with routes code-split via React.lazy(), a session
 *    left open across a deploy can hit "failed to fetch dynamically
 *    imported module" when it tries to load a chunk that no longer exists
 *    on the server. Prompting a reload once the new SW is ready avoids that.
 */
const PWAStatus: React.FC = () => {
  const { language } = useLanguage();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => console.error('SW registration failed:', error),
  });

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!isOffline && !needRefresh) return null;

  return (
    <div
      className="fixed left-1/2 z-[200] flex w-[calc(100%-24px)] max-w-sm -translate-x-1/2 flex-col gap-2"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      {isOffline && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg">
          <WifiOff className="h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold leading-snug">
            {language === 'gu'
              ? 'તમે ઓફલાઇન છો — ફેરફારો સેવ નહીં થાય.'
              : "You're offline — changes won't save until you're back online."}
          </p>
        </div>
      )}

      {needRefresh && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-lg">
          <RefreshCw className="h-4 w-4 shrink-0 text-blue-400" />
          <p className="flex-1 text-xs font-semibold leading-snug">
            {language === 'gu' ? 'નવું અપડેટ ઉપલબ્ધ છે.' : 'A new version is available.'}
          </p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            {language === 'gu' ? 'અપડેટ કરો' : 'Update'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PWAStatus;
