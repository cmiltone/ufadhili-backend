import { inject, injectable } from 'inversify';
import { pickBy } from 'lodash';

import { PaymentModel } from '../models/Payment';
import { AppSettingModel } from '../models/AppSetting';
import { Campaign, CampaignModel } from '../models/Campaign';
import { TransactionModel } from '../models/Transaction';
import { PayoutModel } from '../models/Payout';
import { PaystackService } from './paystack';

@injectable()
export class PaymentEngineService {
  @inject(PaystackService)
  private paystackService: PaystackService;

  private populate = [
    {
      path: 'campaign',
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

      //update raised and current

      if (campaign) {
        const prevRaisedBalanace = campaign.raised ?? 0;
        const prevCurrentBalance = campaign.current ?? 0;
        const increment = _amount - (techFee + payment.paystackFee / 100);
        const currency = campaign.currency;

        await new TransactionModel({
          amount: increment,
          currency: currency,
          campaign: campaign._id,
          raised: prevRaisedBalanace + increment,
          current: prevCurrentBalance + increment,
          payment: payment._id,
          type: 'payin',
        }).save();


        await CampaignModel.findByIdAndUpdate(campaign._id, {
          $inc: {
            current: increment,
            raised: increment,
          },
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
      const campaign = await CampaignModel.findById((payout.campaign as Campaign)._id);

      if (campaign) {
        const prevCurrentBalanace = campaign.current ?? 0;
        const decrement = _amount + fee;
        const currency = payout.currency;

        await new TransactionModel({
          amount: decrement,
          currency: currency,
          campaign: campaign._id,
          current: prevCurrentBalanace - decrement,
          payout: payout._id,
          type: 'payout',
        }).save();


        await CampaignModel.findByIdAndUpdate(campaign._id, {
          $inc: {
            current: -decrement,
          },
        })
      }
    } else {
      return false;
    }

    return true;
  }
}