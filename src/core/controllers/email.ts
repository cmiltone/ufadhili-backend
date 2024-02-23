import { controller, BaseHttpController, httpPost } from 'inversify-express-utils';
import { celebrate, Joi } from 'celebrate';
import { inject } from 'inversify';
import { EmailService } from '../../services/email';

@controller('/v1/email')
export class EmailController extends BaseHttpController {
  @inject(EmailService)
  private emailService: EmailService;

  @httpPost(
    '/',
    celebrate({
      query: Joi.object().empty(),
      body: Joi.object({
        email: Joi.string().required(),
        subject: Joi.string().required(),
        html: Joi.string().required(),
      }),
    }),
  )
  async get(): Promise<void> {
    const {
      request: {
        body: { email: to, subject, html },
      },
      response,
    } = this.httpContext;

    await this.emailService.sendMail({ to, subject, html });

    response.json({ status: 1 });
  }
}
