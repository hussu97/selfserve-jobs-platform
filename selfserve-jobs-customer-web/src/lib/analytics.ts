type EventData = Record<string, string | number | boolean>;

export function trackEvent(name: string, data?: EventData): void {
  if (typeof window !== 'undefined' && typeof window.umami !== 'undefined') {
    window.umami.track(name, data);
  }
}
