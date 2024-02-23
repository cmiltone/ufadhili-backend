import { controller, BaseHttpController, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';
import { AuthService } from '../../services/auth';
import { UserRole } from '../../models/User';

@controller('/v1/auth')
export class AuthController extends BaseHttpController {
  @inject(AuthService)
  private authService: AuthService;

  @httpPost(
    '/login',
    celebrate({
      body: Joi.object({
        identifier: Joi.string().required(),
        password: Joi.string().required(),
      }),
    }),
  )
  async login(): Promise<void> {
    const { identifier, password } = this.httpContext.request.body;

    const result = await this.authService.login({ identifier }, { password, verify: true });

    this.httpContext.response.json({ ...result });
  }

  @httpPost(
    '/login/admin',
    celebrate({
      body: Joi.object({
        identifier: Joi.string().required(),
        password: Joi.string().required(),
      }),
    }),
  )
  async loginAdmin(): Promise<void> {
    const { identifier, password } = this.httpContext.request.body;

    const roles: UserRole[] = ['admin'];

    const result = await this.authService.login({ identifier }, { password, verify: true, roles });

    this.httpContext.response.json({ ...result });
  }

  @httpPost(
    '/register',
    celebrate({
      body: Joi.object({
        fullName: Joi.string().required(),
        // gender: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().required(),
        // dob: Joi.date().iso(),
        password: Joi.string().required(),
        role: Joi.string().default('contributor'),
      }),
    }),
  )
  async register(): Promise<void> {
    const { fullName, gender, phone, email, password, dob, role } = this.httpContext.request.body;

    const result = await this.authService.register(
      { fullName, gender, phone, email, dob, role },
      { password, verify: true },
    );

    this.httpContext.response.status(201).json({ ...result });
  }
}
