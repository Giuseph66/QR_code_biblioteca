import { nanoid } from 'nanoid';

export function generateSessionId(): string {
  // Gera um ID no formato XXXX-XX (6 caracteres alfanuméricos)
  const id = nanoid(6).toUpperCase();
  return `${id.substring(0, 4)}-${id.substring(4, 6)}`;
}

export function getSessionUrl(sessionId: string): string {
  return `${window.location.origin}/session/${sessionId}?mode=mobile`;
}
