import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ITokenSigner } from '../ports/tokenSigner.port';

/**
 * jsonwebtoken implementation of ITokenSigner.
 * Uses env.jwtSecret and env.jwtExpiresIn from config.
 */
export const jwtTokenSigner: ITokenSigner = {
  sign(payload: { userId: string; role: string }): string {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  },
};
