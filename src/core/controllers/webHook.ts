import { controller, httpPost, BaseHttpController } from 'inversify-express-utils';

import { PaymentEngineService } from '../../services/paymentEngine';
import { inject } from 'inversify';

@controller('/v1/web-hook')
export class WebHookController extends BaseHttpController {
  @inject(PaymentEngineService)
  private paymentEngineService: PaymentEngineService;

  @httpPost(
    '/paystack',
  )
  async get(): Promise<void> {
    const {
      request: { body },
      response,
    } = this.httpContext;
    
    const { event, data } = body;

    let result = false;
    
    if (event.includes('charge')) result = await this.paymentEngineService.processCharge(data);
    else if (event.includes('transfer')) result = await this.paymentEngineService.processTransfer(data);

    response.status(200).json({ success: result });
  }
}
