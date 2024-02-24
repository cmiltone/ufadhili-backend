import { injectable } from 'inversify';
import axios from 'axios';
import { pickBy } from 'lodash';

import APIError from '../util/APIError';
import { PAYSTACK_API_URL } from '../config/paystack';
import { AppSettingModel } from '../models/AppSetting';
import { User, UserModel } from '../models/User';

type TransferRecipientResponse = {
  status: boolean;
  message: string;
  data: RecipientData;
}


type BankResponse = {
  status: boolean;
  message: string;
  data: Bank[];
}

type TransactionResponse = {
  status: boolean;
  message: string;
  data: PaystackTransaction;
};

interface TransferResponse {
  status: boolean;
  message: string;
  data: PaystackTransfer;
}

@injectable()
export class PaystackService {
  async createRecipient(
    data: {
      type: string;
      accountNumber?: string;
      bankCode?: string;
      userId: string; 
      authorizationCode?: string;
    },
  ): Promise<User> {
    const appSetting = await AppSettingModel.findOne({});
    const url = `${PAYSTACK_API_URL}/transferrecipient`;
    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    let user = await UserModel.findById(data.userId);

    if (!user) throw new APIError({ message: 'User not Found', status: 404 });

    const transferrecipient = {
      type: data.type,
      account_number: data.accountNumber,
      bank_code: data.bankCode,
      name: user.fullName,
      email: user.email,
      decription: 'A ufadhili Creator',
      authorization_code: data.authorizationCode,
      currency: 'KES',
    };

    try {
      const res = await axios.post<TransferRecipientResponse>(url, pickBy(transferrecipient), { headers });
      if (res.status) {
        if (res.data.status) {
          user = await UserModel.findByIdAndUpdate(user._id, { $set: { paystackRecipientCode: res.data.data.recipient_code } }, { new: true, runValidators: true }); 
        }
      }
    } catch (err) {
      console.log("error creating recipient: ", err?.response?.data?.message)
      throw new APIError({ message: err.response.data.message ?? 'Creating recipient failed', status: 500 })
    }

    return user;
  }

  async getBanks(data: {currency: string, type?: string }): Promise<Bank[]> {
    const { currency, type } = data;
    const appSetting = await AppSettingModel.findOne({});

    let url = `${PAYSTACK_API_URL}/bank?currency=${currency}`;

    if (type) url += `&type=${type}`;

    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    let banks: Bank[] = [];

    try {
      const res = await axios.get<BankResponse>(url, { headers });
      if (res.status) {
        if (res.data.status) {
          banks = res.data.data;
        }
      }
    } catch (err) {
      console.log("error getting banks: ", err?.response?.data?.message)
      throw new APIError({ message: 'Fetching Banks failed', status: 500 })
    }

    return banks;
  }

  async getTransaction(id: string): Promise<PaystackTransaction> {
    const url = `${PAYSTACK_API_URL}/transaction/${id}`;
    const appSetting = await AppSettingModel.findOne({});

    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    let transaction: PaystackTransaction;

    try {
      const res = await axios.get<TransactionResponse>(url, { headers });
      if (res.status) {
        if (res.data.status) {
          transaction = res.data.data;
        }
      }
    } catch (err) {
      console.log("error getting transaction: ", err?.response?.data?.message)
      throw new APIError({ message: 'Fetching transaction failed', status: 500 })
    }

    return transaction;
  }

  async getTransfer(id: number): Promise<PaystackTransfer> {
    const url = `${PAYSTACK_API_URL}/transfer/${id}`;
    const appSetting = await AppSettingModel.findOne({});

    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    let transaction: PaystackTransfer;

    try {
      const res = await axios.get<TransferResponse>(url, { headers });
      if (res.status) {
        if (res.data.status) {
          transaction = res.data.data;
        }
      }
    } catch (err) {
      console.log("error getting transfer: ", err?.response?.data?.message)
      throw new APIError({ message: 'Fetching transfer failed', status: 500 })
    }

    return transaction;
  }

  async deleteRecipient(userId: string): Promise<User> {
    const appSetting = await AppSettingModel.findOne({});
    const headers = {
      Authorization: `Bearer ${appSetting.payStackSecretKey}`,
    }

    let user = await UserModel.findById(userId);

    if (!user) throw new APIError({ message: 'User not Found', status: 404 });

    if (!user.paystackRecipientCode) return user;

    const url = `${PAYSTACK_API_URL}/transferrecipient/${user.paystackRecipientCode}`;

    try {
      const res = await axios.delete(url, { headers });
      if (res.status) {
        if (res.data.status) {
          user = await UserModel.findByIdAndUpdate(user._id, { $set: { paystackRecipientCode: '' } }, { new: true, runValidators: true });
        }
      }
    } catch (err) {
      console.log("error deleting recipient: ", err?.response?.data?.message);
      throw new APIError({ message: 'Deleting Recipient failed', status: 500 })
    }

    return user;
  }
}
