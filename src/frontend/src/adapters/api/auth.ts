/**
 * Провайдер OIDC-токена (SSO).
 *
 * Контракт `openapi.yaml`: `bearerAuth` (JWT, выдаётся Keycloak).
 * Полный OIDC-поток (authorization code + PKCE) — интеграция SSO;
 * здесь — интерфейс и простая реализация поверх localStorage.
 *
 * Трассируемость: `ADR-DES.SECURITY.sso-keycloak` (доступ людей через SSO),
 * `specs/contracts/openapi.yaml` (`bearerAuth`).
 */

export interface TokenProvider {
  /** Текущий токен или null, если пользователь не аутентифицирован */
  getToken(): string | null;
}

/** Провайдер токена из localStorage (место подключения OIDC/SSO) */
export function createLocalStorageTokenProvider(key = 'graphrag.access_token'): TokenProvider {
  return {
    getToken: () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
  };
}
