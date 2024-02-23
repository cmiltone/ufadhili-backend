import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';
import {
  controller,
  BaseHttpController,
  httpGet,
  httpDelete,
  requestParam,
  httpPost,
} from 'inversify-express-utils';

import { PaystackService } from '../../services/paystack';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';

@controller('/v1/paystack', AuthMiddleware)
export class PaystackController extends BaseHttpController {
  @inject(PaystackService)
  private paystackService: PaystackService;

  @httpPost(
    '/recipient',
    celebrate({
      body: Joi.object({
        userId: Joi.string().required(),
        type: Joi.string().allow('authorization', 'mobile_money').required(),
        accountNumber: Joi.string(), 
        bankCode: Joi.string(),
        authorizationCode: Joi.string(),       
      }),
    }),
  )
  async createRecipient(): Promise<void> {
    const {
      request: {
        body: { userId, accountNumber, bankCode, type, authorizationCode },
      },
      response,
    } = this.httpContext;

    const user = await this.paystackService.createRecipient({ userId, accountNumber, bankCode, type, authorizationCode });

    response.json({ user });
  }

  @httpGet(
    '/bank',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        currency: Joi.string().required(),
        type: Joi.string().allow('mobile_money'),
      }),
    }),
  )
  async retrieveBanks(): Promise<void> {
    const { currency, type } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    const banks = await this.paystackService.getBanks({ currency, type });

    this.httpContext.response.json({ banks });
  }

  @httpGet(
    '/transaction',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        id: Joi.number().required(),
      }),
    }),
  )
  async retrieveTransaction(): Promise<void> {
    const { id } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    const transaction = await this.paystackService.getTransaction(id);

    this.httpContext.response.json({ transaction });
  }

  @httpDelete(
    '/recipient/:userId',
    AuthAdminMiddleware,
    celebrate({
      params: Joi.object({
        userId: Joi.string().required(),
      }),
    }),
  )
  async deleteRecipient(@requestParam('userId') userId: string): Promise<void> {
    const user = await this.paystackService.deleteRecipient(userId);

    this.httpContext.response.json({ user });
  }
}
