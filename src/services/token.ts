/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from 'inversify';
import { JWT_SECRET, JWT_EXPIRY } from '../config/jwt';
import { sign, verify } from 'jsonwebtoken';

@injectable()
export class TokenService {
  encode(payload: string | any, options: { expiresIn: string } = { expiresIn: JWT_EXPIRY }): string {
    return sign(payload, JWT_SECRET, options);
  }

  async decode(token: string): Promise<any> {
    return verify(token, JWT_SECRET) as any;
  }
}
