import { Response, Request } from 'express';
import { injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';
import { NextFunction } from 'connect';
import crypto from 'crypto';
import { AppSettingModel } from '../../models/AppSetting';

@injectable()
export class HookAuthMiddleware extends BaseMiddleware {
  async handler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appSetting = await AppSettingModel.findOne({});

      const secret = appSetting?.payStackSecretKey;
      
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

      if (hash == req.headers['x-paystack-signature'])
        throw new Error('Authentication failed');

      return next();
    } catch (error) {
      (error as DefaultError).code = '401';
      (error as DefaultError).status = 401;
      next(error);
    }
  }
}
