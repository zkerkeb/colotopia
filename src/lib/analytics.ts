/** Do not queue behavioral events before consent or before the GA config. */
export function track(name: string, parameters: Record<string, unknown> = {}): boolean {
  if (!window.colotopiaAnalyticsReady || !window.colotopiaConsent?.get()?.analytics || !window.gtag) return false;
  window.gtag('event', name, parameters);
  return true;
}

export function trackColoringView(parameters: Record<string, unknown>) {
  let sent = false;
  const send = () => { if (!sent) sent = track('coloring_view', parameters); };
  send();
  window.addEventListener('colotopia:consent', send);
}
