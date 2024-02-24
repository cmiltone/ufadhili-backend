import { injectable } from 'inversify';
import { pickBy } from 'lodash';
import axios from 'axios';

import { Payout, PayoutDocument, PayoutModel } from '../models/Payout';
import { PageOptions, PageResult, Query } from '../types/db';
import APIError from '../util/APIError';
import { PAYSTACK_API_URL } from '../config/paystack';
import { AppSettingModel } from '../models/AppSetting';
import { CampaignModel } from '../models/Campaign';
import { User } from '../models/User';

type TransferResponse = {
  status: boolean;
  message: string;
  data: TransferData;
}

@injectable()
export class PayoutService {
  async initiate(
    data: {
      campaignId: string;
      amount: number;
      currency: string;
    },
  ): Promise<Payout> {
    const campaign = await CampaignModel.findById(data.campaignId);

    if (!campaign) throw new APIError({ message: 'Campaign not found', status: 400 });

    campaign.populate([{ path: 'owner' }]);

    if (data.amount > campaign.current) throw new APIError({ message: 'Insuffient funds.', status: 400 });

    const appSetting = await AppSettingModel.findOne({});
    const url = `${PAYSTACK_API_URL}/transfer`;
    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    const transfer = {
      recipient: (campaign.owner as User).paystackRecipientCode,
      amount: data.amount * 100,
      currency: data.currency,
      source: 'balance'
    };

    transfer.source

    let payout: Partial<Payout> = {
      ref: '',
      amount: data.amount,
      currency: data.currency,
      campaign: campaign._id,
    }

    try {
      const res = await axios.post<TransferResponse>(url, transfer, { headers });
      if (res.status) {
        payout.ref = res.data.data.reference;
      }
    } catch (err) {
      console.log("error creating transfer: ", err?.response?.data)
      throw new APIError({ message: 'Payout failed. Please try again later.', status: 500 })
    }

    payout = await this.create(payout as Payout);

    return payout as Payout;
  }

  async create(
    data: {
      ref: Payout['ref'];
      amount: Payout['amount'];
      campaign: Payout['campaign'];
      currency: Payout['currency'];
      status?: Payout['status'];
      paymentMethod?: Payout['paymentMethod'];
      paystackRef?: Payout['paystackRef'];
      paystackFee?: Payout['paystackFee'];
    },
  ): Promise<Payout> {
    const payout = await new PayoutModel(pickBy(data)).save();

    await payout.populate([{ path: 'campaign' }]);

    return payout;
  }

  async update(
    PayoutId: string,
    update: {
      ref?: Payout['ref'];
      amount?: Payout['amount'];
      campaign?: Payout['campaign'];
      currency?: Payout['currency'];
      status?: Payout['status'];
      paymentMethod?: Payout['paymentMethod'];
      paystackRef?: Payout['paystackRef'];
      paystackFee?: Payout['paystackFee'];
    },
  ): Promise<Payout> {
    let payout = await PayoutModel.findById(PayoutId);

    if (!payout) throw new APIError({ message: 'Payout not found', status: 404 });

    payout = await PayoutModel.findByIdAndUpdate(PayoutId, { $set: pickBy(update) }, { runValidators: true, new: true });

    await payout.populate([{ path: 'campaign' }]);

    return payout;
  }

  async findById(payoutId: string): Promise<Payout> {
    const payout = await PayoutModel.findById(payoutId);

    if (!payout) throw new APIError({ message: 'Payout not found', status: 404 });

    await payout.populate([{ path: 'campaign' }]);

    return payout;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<PayoutDocument>> {
    let pageResult: PageResult<PayoutDocument>;

    const { q, page, limit, populate } = pageOptions;

    if (q) {
      const docs = await PayoutModel.look(q, { query, populate, page, limit });
      pageResult = { docs, limit: docs.length, total: docs.length, sort: '', page: 1, pages: 1 };
    } else {
      pageResult = await PayoutModel.page(pickBy(query), pageOptions);
    }
    return pageResult;
  }

  async delete(payoutId: string): Promise<Payout> {
    const payout = await PayoutModel.findById(payoutId);

    if (!payout) throw new APIError({ message: 'Payout not found', status: 404 });

    await PayoutModel.findByIdAndDelete(payoutId);

    await payout.populate([{ path: 'campaign' }]);

    return payout;
  }
}
