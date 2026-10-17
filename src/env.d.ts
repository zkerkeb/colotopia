/// <reference types="astro/client" />
interface Window {
  gtag?: (...args: any[]) => void;
  dataLayer?: unknown[];
  colotopiaAnalyticsReady?: boolean;
  colotopiaConsent?: { open: () => void; get: () => { analytics: boolean; ads: boolean; ts: number } | null };
  colotopiaToast?: any;
}
