interface UmamiTracker {
  track(event: string, data?: Record<string, string | number | boolean>): void;
  identify(data: Record<string, string | number | boolean>): void;
}

interface Window {
  umami?: UmamiTracker;
}
