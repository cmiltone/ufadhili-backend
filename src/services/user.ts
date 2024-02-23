import { injectable } from 'inversify';
import { pickBy } from 'lodash';

import { User, UserDocument, UserModel } from '../models/User';
import { PageOptions, PageResult, Query } from '../types/db';
import { File } from '../types/file';
import APIError from '../util/APIError';
import { getRandomEmail } from '../util/helpers';

@injectable()
export class UserService {
  async update(
    userId: string,
    update: {
      email?: User['email'];
      fullName?: User['fullName'];
      phone?: User['phone'];
      gender?: User['gender'];
      dob?: User['dob'];
      role?: User['role'];
      status?: User['status'];
      avatarUrl?: User['avatarUrl'];
    },
  ): Promise<User> {
    let user = await UserModel.findById(userId);

    if (!user) throw new APIError({message: 'User not found', status: 404 });

    user = await UserModel.findByIdAndUpdate(userId, { $set: pickBy(update) }, { runValidators: true, new: true });

    return user;
  }

  async findById(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);

    if (!user) throw new APIError({ message: 'User not found', status: 404 });

    return user;
  }

  async findOne(query: Query): Promise<User> {
    const user = await UserModel.findOne(pickBy(query));

    if (!user) throw new APIError({ message: 'User not found', status: 404 });

    return user;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<UserDocument>> {
    let pageResult: PageResult<UserDocument>;

    const { q, page, limit, populate } = pageOptions;

    if (q) {
      const docs = await UserModel.look(q, { query, populate, page, limit });
      pageResult = { docs, limit: docs.length, total: docs.length, sort: '', page: 1, pages: 1 };
    } else {
      pageResult = await UserModel.page(pickBy(query), pageOptions);
    }
    return pageResult;
  }

  async delete(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);

    if (!user) throw new APIError({message: 'User not found', status: 404 });

    await UserModel.findByIdAndDelete(userId);

    return user;
  }

  async deleteProfile(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);

    if (!user) throw new APIError({ message: 'User not found', status: 404 });

    const fakeEmail = getRandomEmail()
    const fakePhone = getRandomEmail('', 10);

    await UserModel.findByIdAndUpdate(userId, { $set: { _status: 'deleted', status: 'deleted', email: fakeEmail, phone: fakePhone }});

    return user;
  }

  async updateAvatar(userId: string, file: File): Promise<User> {
    try {
      let user = await this.findById(userId);

      user = await this.update(user._id, { avatarUrl: file.filename });

      return user;
    } catch (error) {
      console.log('Error updating avatar: ', error)
      throw new APIError({message: 'Failed to update avatar', status: 500 });
    }
  }

  async count(query: Query): Promise<number> {
    const num = await UserModel.countDocuments(query);

    return num;
  }
}
