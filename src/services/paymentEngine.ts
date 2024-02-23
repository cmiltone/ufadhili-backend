import { inject, injectable } from 'inversify';
import { pickBy } from 'lodash';

import { PaymentModel } from '../models/Payment';
import { AppSettingModel } from '../models/AppSetting';
import { Campaign, CampaignModel } from '../models/Campaign';
import { WalletTransactionModel } from '../models/WalletTransaction';
import { User, UserModel } from '../models/User';
import { convertCurrency } from '../util/helpers';
import { PayoutModel } from '../models/Payout';
import { PaystackService } from './paystack';

@injectable()
export class PaymentEngineService {
  @inject(PaystackService)
  private paystackService: PaystackService;

  private populate = [
    {
      path: 'Campaign',
      populate: [
        { path: 'owner' },
      ]
    },
    { path: 'user' }
  ]

  async processCharge(data: ChargeData): Promise<boolean> {
    const {
      reference,
      status,
      id,
      paidAt,
      paid_at,
      amount,
      channel,
      authorization,
      fees,
    } = data;

    let payment = await PaymentModel.findOne({ ref: reference });

    if (!payment) return false;

    await payment.populate(this.populate);

    // begin process

    if (status === 'success') {
      const appSetting = await AppSettingModel.findOne({});
      const _amount = amount / 100;

      const techFee = ((appSetting?.techFeePercentage * _amount) / 100) ?? 0;

      // record payment

      payment = await PaymentModel.findByIdAndUpdate(
        payment?._id,
        {
          $set: pickBy({
            techFee,
            status: 'paid',
            paystackRef: id,
            paidAt: paid_at ?? paidAt,
            amount: _amount,
            paymentMethod: channel,
            authorizationCode: authorization.authorization_code,
            paystackFee: fees / 100,
          })
        },
        { runValidators: true, new: true },
      );

      await payment.populate(this.populate);

      const campaign = await CampaignModel.findByIdAndUpdate(
        (payment.campaign as Campaign)._id,
        { $set: { status: 'active' }}
      );

      //update wallet

      if (campaign) {
        const user = await UserModel.findById(((payment.campaign as Campaign).owner as User)._id);
        const prevBalanace = user.wallet?.amount ?? 0;
        let increment = _amount - (techFee + payment.paystackFee / 100);
        let currency = campaign.target.currency;

        if (user.wallet) {
          const userCurr = user.wallet.currency;
          if (currency != userCurr) {
            const convertedAmount = await convertCurrency({ amount: increment, from: userCurr, to: currency });
            currency = userCurr;
            if (convertedAmount != -1) increment = convertedAmount;
          }
        }

        await new WalletTransactionModel({
          amount: increment,
          currency: currency,
          user: user._id,
          walletBalance: prevBalanace + increment,
          payment: payment._id,
          type: 'payin',
        }).save();


        await UserModel.findByIdAndUpdate(user._id, {
          $inc: {
            'wallet.amount': increment,
          },
          $set: { 'wallet.currency': currency },
        })
      }
    } else {
      return false;
    }

    return true;
  }

  async processTransfer(data: Transfer): Promise<boolean> {
    const {
      reference,
      status,
      id,
      amount,
    } = data;

    let payout = await PayoutModel.findOne({ ref: reference });

    if (!payout) return false;

    const populate = [{ path: 'user' }];

    await payout.populate(populate);

    // begin process

    if (status === 'success') {
      const transfer = await this.paystackService.getTransfer(id);

      if (!transfer) return false;

      const _amount = amount / 100;

      let fee = 0;

      if (transfer.fee_charged) fee = transfer.fee_charged / 100;

      // record payout

      payout = await PayoutModel.findByIdAndUpdate(
        payout?._id,
        {
          $set: pickBy({
            status: 'paid',
            paystackRef: id,
            amount: _amount,
            paystackFee: fee,
            paymentMethod: transfer.recipient?.type,
          })
        },
        { runValidators: true, new: true },
      );

      await payout.populate(populate);



      //update wallet
      const user = await UserModel.findById((payout.user as User)._id);

      if (user) {
        const prevBalanace = user.wallet?.amount ?? 0;
        let decrement = _amount + fee;
        let currency = payout.currency;

        if (user.wallet) {
          const userCurr = user.wallet.currency;
          if (currency != userCurr) {
            const convertedAmount = await convertCurrency({ amount: decrement, from: userCurr, to: currency });
            currency = userCurr;
            if (convertedAmount != -1) decrement = convertedAmount;
          }
        }

        await new WalletTransactionModel({
          amount: decrement,
          currency: currency,
          user: user._id,
          walletBalance: prevBalanace - decrement,
          payout: payout._id,
          type: 'payout',
        }).save();


        await UserModel.findByIdAndUpdate(user._id, {
          $inc: {
            'wallet.amount': -decrement,
          },
          $set: { 'wallet.currency': currency },
        })
      }
    } else {
      return false;
    }

    return true;
  }
}