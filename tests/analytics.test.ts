import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { track, trackColoringView } from '../src/lib/analytics';
let state: any;
beforeEach(() => { state = Object.assign(new EventTarget(), { gtag: vi.fn(), colotopiaAnalyticsReady: false, colotopiaConsent: { get: () => ({ analytics: false }) } }); vi.stubGlobal('window', state); });
afterEach(() => vi.unstubAllGlobals());
it('does not queue events before consent or when consent is refused', () => { expect(track('pdf_download')).toBe(false); state.colotopiaAnalyticsReady = true; expect(track('pdf_download')).toBe(false); expect(state.gtag).not.toHaveBeenCalled(); });
it('sends the current view exactly once after consent and configuration', () => { trackColoringView({ coloring_slug: 'chat' }); state.colotopiaConsent.get = () => ({ analytics: true }); state.colotopiaAnalyticsReady = true; window.dispatchEvent(new Event('colotopia:consent')); window.dispatchEvent(new Event('colotopia:consent')); expect(state.gtag).toHaveBeenCalledTimes(1); expect(state.gtag).toHaveBeenCalledWith('event', 'coloring_view', { coloring_slug: 'chat' }); });
it('stops events after consent withdrawal', () => { state.colotopiaAnalyticsReady = true; state.colotopiaConsent.get = () => ({ analytics: true }); track('print_intent'); state.colotopiaConsent.get = () => ({ analytics: false }); track('print_intent'); expect(state.gtag).toHaveBeenCalledTimes(1); });
