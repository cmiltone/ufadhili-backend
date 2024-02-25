import { injectable } from 'inversify';
import { pickBy } from 'lodash';

import { AppSetting, AppSettingModel } from '../models/AppSetting';
import APIError from '../util/APIError';

@injectable()
export class AppSettingService {
  async save(data: {
    techFeePercentage: AppSetting['techFeePercentage'];
    adminEmail: AppSetting['adminEmail'];
    payStackSecretKey: AppSetting['payStackSecretKey'];
    payStackPublicKey: AppSetting['payStackPublicKey'];
  },
  ): Promise<AppSetting> {
    let appSetting = await AppSettingModel.findOne({});
    
    appSetting = await AppSettingModel.findOneAndUpdate(
      { _id: appSetting?._id },
      { $set: { ...pickBy(data) , ...{ techFeePercentage: data.techFeePercentage }}  },
      { upsert: true, useFindAndModify: false, runValidators: true, new: true },
    );

    if (!appSetting) throw new APIError({ message: 'Could not update app settings', status: 500 });

    return appSetting;
  }

  async get(): Promise<AppSetting> {
    const appSetting = await AppSettingModel.findOne({});

    return appSetting;
  }
}