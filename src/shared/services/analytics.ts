export function trackEvent(name: string, properties?: Record<string, any>) {
  console.log('[Analytics Event]', name, properties);
}

export function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem('vp_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem('vp_session_id', sid);
  }
  return sid;
}

export default { trackEvent, getOrCreateSessionId };
