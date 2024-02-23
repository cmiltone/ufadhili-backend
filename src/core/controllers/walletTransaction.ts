import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';
import {
  controller,
  BaseHttpController,
  httpGet,
  httpDelete,
  requestParam,
} from 'inversify-express-utils';

import { WalletTransactionService } from '../../services/walletTransaction';
import { Query } from '../../types/db';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';

@controller('/v1/wallet-transaction', AuthMiddleware)
export class WalletTransactionController extends BaseHttpController {
  @inject(WalletTransactionService)
  private walletTransactionService: WalletTransactionService;

  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        walletTransactionId: Joi.string(),
        userId: Joi.string(),
        status: Joi.string(),
        q: Joi.string().allow(''),
        sort: Joi.string(),
        page: Joi.number(),
        limit: Joi.number(),
        dateStart: Joi.date().iso(),
        dateEnd: Joi.date().iso(),
      }),
    }),
  )
  async retrieve(): Promise<void> {
    const { walletTransactionId, sort, page, limit, dateStart, dateEnd, status, userId, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (walletTransactionId) {
      const walletTransaction = await this.walletTransactionService.findById(walletTransactionId);

      this.httpContext.response.json({ walletTransaction });

      return;
    }

    let query: Query = {};

    if (userId) query = { ...query, ...{ user: userId } };

    if (status) query = { ...query, ...{ status } };

    if (dateStart) query = { ...query, ...{ createdAt: { $gte: dateStart } } };

    if (dateEnd) query = { ...query, ...{ createdAt: { $lt: dateEnd } } };

    if (dateStart && dateEnd)
      query = {
        ...query,
        ...{
          $and: [{ createdAt: { $gte: dateStart } }, { createdAt: { $lt: dateEnd } }],
        },
      };

    const walletTransactionPage = await this.walletTransactionService.page(query, {
      sort,
      page,
      limit,
      q,
      populate: [
        { path: 'user', },
        { path: 'payment', populate: [{ path: 'campaignEnrolment', populate: [{ path: 'user' }, { path: 'campaign' }]}]},
        { path: 'payout' },
      ],
    });

    this.httpContext.response.json({ walletTransactionPage });
  }

  @httpDelete(
    '/:walletTransactionId',
    AuthAdminMiddleware,
    celebrate({
      params: Joi.object({
        walletTransactionId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('walletTransactionId') walletTransactionId: string): Promise<void> {
    const walletTransaction = await this.walletTransactionService.delete(walletTransactionId);

    this.httpContext.response.json({ walletTransaction });
  }
}
