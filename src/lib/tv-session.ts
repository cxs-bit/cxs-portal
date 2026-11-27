export const tvSessionKey = "cxs-crt-intro-seen";

export function rememberChannelVisit() {
  try { sessionStorage.setItem(tvSessionKey, "1"); } catch { /* Storage is optional. */ }
}
