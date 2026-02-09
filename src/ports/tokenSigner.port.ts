/**
 * Token Signer Port - abstraction for JWT token operations.
 */
export interface ITokenSigner {
  sign(payload: { userId: string; role: string }): string;
}
