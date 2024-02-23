import { injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';
import { Request, Response, NextFunction } from 'express';
import { Principal } from '../provider/auth';

@injectable()
export class PermitDefaultMiddleware extends BaseMiddleware {
  async handler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const principal = this.httpContext.user as Principal;

      const permitted = await principal.hasPermission(['default']);

      if (permitted) return next();

      throw new Error('You do not have permissions to access this resource. [default]');
    } catch (error) {
      (error as DefaultError).code = '403';
      (error as DefaultError).status = 403;
      next(error);
    }
  }
}
