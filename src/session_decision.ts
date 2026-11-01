export type Session = { session_id: string; created_at?: string; last_seen_at?: string };

export function sessionsToRevoke(sessions: Session[], currentSessionId: string): string[] {
  return sessions.filter((session) => session.session_id !== currentSessionId).map((session) => session.session_id);
}
