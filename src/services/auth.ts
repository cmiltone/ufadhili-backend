import { injectable, inject } from 'inversify';
import { User, UserModel, UserRole } from '../models/User';
import { TokenService } from './token';
import argon2 from 'argon2';
import APIError from '../util/APIError';
import { EmailService } from './email';

interface RegistrationInput {
  fullName: User['fullName'];
  gender: User['gender'];
  phone: User['phone'];
  email: User['email'];
  dob: User['dob'];
  role: User['role'];
}

interface AuthResult {
  user: User;
  token: string;
}

interface LoginInput {
  identifier: User['phone'] | User['email'] | string;
}

@injectable()
export class AuthService {
  @inject(TokenService)
  private tokenService: TokenService;

  @inject(EmailService)
  private emailService: EmailService;

  async register(data: RegistrationInput, options: { password: string; verify?: boolean }): Promise<AuthResult> {
    const { password } = options;

    const { email, phone, } = data;

    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone }] }) // check if user exist

    if (existingUser) throw new APIError({ message: 'User already registered', status: 400 });

    const hash = await argon2.hash(password);


    await new UserModel({ ...data, ...{ hash }}).save();

    const result = this.login({ identifier: email }, { password, roles: ['contributor', 'campaigner', 'admin'] });

    return result;
  }

  async login(
    data: LoginInput,
    options: {
      password: string;
      verify?: boolean;
      roles?: UserRole[];
    },
  ): Promise<AuthResult> {
    const { identifier } = data;
    let { roles } = options;

    if (!roles) roles = ['admin', 'contributor', 'campaigner'];

    const user = await UserModel.findOne({ $or: [{ email: identifier }, { phone: identifier }] }).select('+hash');

    if (!user) throw new APIError({ message: 'User not registered', status: 403 });

    if (user.status == 'blocked') throw new APIError({ message: 'User Blocked. Contact Admin', status: 401 });

    if (!roles.some((r) => user.role.includes(r))) throw new APIError({ message: 'Access Denied', status: 401 });

    const { password } = options;

    const { hash, ...resUser } = user._doc as User;

    const correct = await argon2.verify(hash, password);

    if (!correct) throw new APIError({ message: 'Password incorrect', status: 401 });

    const token = this.tokenService.encode({
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      gender: user.gender,
      role: user.role,
      status: user.status,
    });

    return { user: resUser, token };
  }
}
