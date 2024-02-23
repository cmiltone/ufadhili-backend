import { controller, httpPost, BaseHttpController, httpGet } from 'inversify-express-utils';

import { inject } from 'inversify';
import { AppSettingService } from '../../services/appSetting';
import { Joi, celebrate } from 'celebrate';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';

@controller('/v1/app-setting')
export class AppSettingController extends BaseHttpController {
  @inject(AppSettingService)
  private sessingService: AppSettingService;

  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({}),
      params: Joi.object({}),
    })
  )
  async get(): Promise<void> {
    const user = this.httpContext.user.details;

    const isAdmin = user?.role.includes('admin');

    const appSetting = await this.sessingService.get();

    if (!isAdmin) appSetting.payStackSecretKey = "***";

    this.httpContext.response.json({ appSetting  });
  }

  @httpPost(
    '/',
    AuthAdminMiddleware,
    celebrate({
      body: Joi.object({
        techFeePercentage: Joi.number(),
        adminEmail: Joi.string(),
        payStackSecretKey: Joi.string(),
        payStackPublicKey: Joi.string(),
      })
    })
  )
  async save(): Promise<void> {
    const {
      request: { body: { techFeePercentage, adminEmail, payStackPublicKey, payStackSecretKey } },
      response,
    } = this.httpContext;

    const appSetting = await this.sessingService.save({ techFeePercentage, adminEmail, payStackPublicKey, payStackSecretKey })

    response.status(200).json({ appSetting });
  }
}
