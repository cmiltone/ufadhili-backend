import { Container } from 'inversify';
import { AuthService } from '../services/auth';
import { EmailService } from '../services/email';
import { CampaignService } from '../services/campaign';
import { CampaignCategoryService } from '../services/campaignCategory';
import { TokenService } from '../services/token';
import { UserService } from '../services/user';
import { AuthAdminMiddleware, AuthMiddleware } from './middlewares/auth';
import { UploadMiddleware } from './middlewares/upload';
import { HookAuthMiddleware } from './middlewares/hook';
import { AppSettingService } from '../services/appSetting';
import { PaymentEngineService } from '../services/paymentEngine';
import { PaymentService } from '../services/payment';
import { WalletTransactionService } from '../services/walletTransaction';
import { PayoutService } from '../services/payout';
import { PaystackService } from '../services/paystack';

export function getContainer(): Container {
  const container = new Container({ skipBaseClassChecks: true });

  container.bind<AuthMiddleware>(AuthMiddleware).to(AuthMiddleware);
  container.bind<UploadMiddleware>(UploadMiddleware).to(UploadMiddleware);
  container.bind<AuthService>(AuthService).to(AuthService);
  container.bind<TokenService>(TokenService).to(TokenService)
  container.bind<UserService>(UserService).to(UserService);
  container.bind<CampaignService>(CampaignService).to(CampaignService);
  container.bind<CampaignCategoryService>(CampaignCategoryService).to(CampaignCategoryService);
  container.bind<EmailService>(EmailService).to(EmailService);
  container.bind<HookAuthMiddleware>(HookAuthMiddleware).to(HookAuthMiddleware);
  container.bind<AppSettingService>(AppSettingService).to(AppSettingService);
  container.bind<AuthAdminMiddleware>(AuthAdminMiddleware).to(AuthAdminMiddleware);
  container.bind<PaymentEngineService>(PaymentEngineService).to(PaymentEngineService);
  container.bind<PaymentService>(PaymentService).to(PaymentService);
  container.bind<WalletTransactionService>(WalletTransactionService).to(WalletTransactionService);
  container.bind<PayoutService>(PayoutService).to(PayoutService);
  container.bind<PaystackService>(PaystackService).to(PaystackService);

  //container.bind<>().to();
  
  return container;
}
