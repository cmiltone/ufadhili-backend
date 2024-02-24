import { injectable } from 'inversify';
import { pickBy } from 'lodash';
import axios from 'axios';

import { Payment, PaymentDocument, PaymentModel } from '../models/Payment';
import { PageOptions, PageResult, Query } from '../types/db';
import APIError from '../util/APIError';
import { CampaignModel } from '../models/Campaign';
import { User } from '../models/User';
import { PAYSTACK_API_URL } from '../config/paystack';
import { AppSettingModel } from '../models/AppSetting';
import { convertCurrency } from '../util/helpers';

@injectable()
export class PaymentService {
  private populate = [
    {
      path: 'campaign',
      populate: [
        { path: 'owner' },
      ]
    },
    { path: 'user' },
  ]

  async create(
    data: {
      ref: Payment['ref'];
      campaign: Payment['campaign'];
      paystackRef?: Payment['paystackRef'];
    },
  ): Promise<Payment> {
    const payment = await new PaymentModel(pickBy(data)).save();

    await payment.populate(this.populate);

    return payment;
  }

  async payByMoileMoney(
    data: {
      phone: string;
      email?: string;
      provider?: 'mpesa',
      campaign: Payment['campaign'];
      user: Payment['user'];
      amount: number;
    },
  ): Promise<Payment> {
    let { amount } = data;
    const campaign = await CampaignModel.findById(data.campaign);

    if (!campaign) throw new APIError({ message: 'Campaign not found', status: 404 });

    await campaign.populate([{ path: 'owner' }]);

    const reference = `ref_${Date.now()}`;
    const appSetting = await AppSettingModel.findOne({});

    if (data.provider === 'mpesa') { // factoring in paystack fee
      amount = Math.ceil(amount + (amount * (1.5 / 100)));// TODO: make paystack fee configurable
    }

    const payment = await new PaymentModel({
      campaign: campaign._id,
      user: data.user,
      ref: reference,
      amount,
      currency: campaign.currency,
      techFee: ((appSetting?.techFeePercentage * amount) / 100) ?? 0,
    }).save();
  
    const charge = {
      amount: amount * 100,
      email: data.email ?? (campaign.owner as User).email,
      currency: campaign.currency,
      mobile_money: {
        phone: data.phone,
        provider: data.provider,
      },
      reference,
    }

    const url = `${PAYSTACK_API_URL}/charge`;
    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    try {
      const res = await axios.post(url, charge, { headers });

      if (res.status) {
        // code
      }
    } catch (err) {
      console.log("error creating charge: ", err?.response?.data)
      throw new APIError({ message: 'Payment failed', status: 500 })
    }

    await payment.populate(this.populate);

    return payment;
  }

  async payByCard(
    data: {
      reference: string;
      campaign: Payment['campaign'];
      user: Payment['user'];
      amount: number;
    },
  ): Promise<Payment> {
    let { amount } = data;
    const campaign = await CampaignModel.findById(data.campaign);

    if (!campaign) throw new APIError({ message: 'Campaign not enroled', status: 404 });

    await campaign.populate([{ path: 'owner' }]);

    const reference = data.reference;
    const appSetting = await AppSettingModel.findOne({});

    // factoring in paystack fee
    amount = amount + (amount * (2.9 / 100));// TODO: make paystack fee configurable and check country

    const payment = await new PaymentModel({
      campaign: campaign._id,
      user: data.user,
      ref: reference,
      amount,
      currency: campaign.currency,
      techFee: ((appSetting?.techFeePercentage * amount) / 100) ?? 0,
    }).save();

    await payment.populate(this.populate);

    return payment;
  }


  async update(
    PaymentId: string,
    update: {
      amount?: Payment['amount'];
      currency?: Payment['currency'];
      campaign?: Payment['campaign'];
      status?: Payment['status'];
      techFee?: Payment['techFee'];
      authorizationCode?: Payment['authorizationCode'];
      paidAt?: Payment['paidAt'];
      paystackRef?: Payment['paystackRef'];
    },
  ): Promise<Payment> {
    let payment = await PaymentModel.findById(PaymentId);

    if (!payment) throw new APIError({ message: 'Payment not found', status: 404 });

    payment = await PaymentModel.findByIdAndUpdate(PaymentId, { $set: pickBy(update) }, { runValidators: true, new: true });

    await payment.populate(this.populate);

    return payment;
  }

  async findById(paymentId: string): Promise<Payment> {
    const payment = await PaymentModel.findById(paymentId);

    if (!payment) throw new APIError({ message: 'Payment not found', status: 404 });

    await payment.populate(this.populate);

    return payment;
  }

  async findByRef(ref: string): Promise<Payment> {
    const payment = await PaymentModel.findOne({ ref });

    if (!payment) throw new APIError({ message: 'Payment not found', status: 404 });

    await payment.populate(this.populate);

    return payment;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<PaymentDocument>> {
    let pageResult: PageResult<PaymentDocument>;

    const { q, page, limit, populate } = pageOptions;

    if (q) {
      const docs = await PaymentModel.look(q, { query, populate, page, limit });
      pageResult = { docs, limit: docs.length, total: docs.length, sort: '', page: 1, pages: 1 };
    } else {
      pageResult = await PaymentModel.page(pickBy(query), pageOptions);
    }
    return pageResult;
  }

  async delete(paymentId: string): Promise<Payment> {
    const payment = await PaymentModel.findById(paymentId);

    if (!payment) throw new APIError({ message: 'Payment not found', status: 404 });

    await PaymentModel.findByIdAndDelete(paymentId);

    await payment.populate(this.populate);

    return payment;
  }

  async convert(data: { amount: number; to: string; from: string; }): Promise<number> {
    const num = await convertCurrency(data);

    return num;
  }
}
