// Estado DERIVADO do convite: não existe coluna no banco. É calculado a
// partir de used_at, revoked_at, expires_at e do "agora".
export enum InvitationStatus {
  OPEN = "OPEN",
  USED = "USED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}
