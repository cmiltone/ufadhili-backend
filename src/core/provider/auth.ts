import { Request } from 'express';
import { injectable, inject } from 'inversify';
import { interfaces } from 'inversify-express-utils';
import { UserService } from '../../services/user';
import { User } from '../../models/User';
import { TokenService } from '../../services/token';

export class Principal implements interfaces.Principal {
  public details: User;

  constructor(details: User) {
    this.details = details;
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.details && this.details.status && this.details.status === 'active';
  }
  
  async isResourceOwner(resource: { type: 'user'; id: string }): Promise<boolean> {
    if (this.details && resource.type === 'user') return resource.id === this.details._id;

    return false;
  }

  async isInRole(role: string): Promise<boolean> {
    return !!this.details && !!role;
  }

  async hasPermission(roles: User['role']): Promise<boolean> {
    return !!this.details && this.details.role.some((role) => roles.includes(role));
  }
}

@injectable()
export class AuthProvider implements interfaces.AuthProvider {
  @inject(UserService)
  private userService: UserService;

  @inject(TokenService)
  private tokenService: TokenService;

  async getUser(req: Request): Promise<interfaces.Principal> {
    let user: User

    try {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];

        if (token) {
          const decodedUser: { _id: string; status: User['status'] } = await this.tokenService.decode(token);

          user = await this.userService.findById(decodedUser._id);

          user = { ...decodedUser, ...user };
        }
      }
    } catch (error) {
      console.error('auth error %o', (error as Error).message);
    }

    if (user)
      console.debug(
        'auth id: %o firstName: %o phoneNumber: %o status: %o',
        user._id,
        user.fullName,
        user.phone,
        user.status,
      );

    return new Principal({
      _id: user?._id,
      fullName: user?.fullName,
      phone: user?.phone,
      email: user?.email,
      gender: user?.gender,
      role: user?.role,
      status: user?.status,
    });
  }
}
