let dismissedForSession = false;
let promptVisible = false;

export function markNotificationPromptDismissed() {
  dismissedForSession = true;
}

export function resetNotificationPromptDismissed() {
  dismissedForSession = false;
}

export function isNotificationPromptDismissed() {
  return dismissedForSession;
}

export function setNotificationPromptVisible(visible: boolean) {
  promptVisible = visible;
}

export function isNotificationPromptVisible() {
  return promptVisible;
}
