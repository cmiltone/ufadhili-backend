import { controller, BaseHttpController, httpPut, requestParam, httpGet, httpDelete } from 'inversify-express-utils';
import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';

import { UserService } from '../../services/user';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';
import { upload, UploadMiddleware } from '../middlewares/upload';
import { FILE_PATH } from '../../config/multer';
import { fileJoi } from '../../util/joi';
import { Query } from '../../types/db';

@controller('/v1/user')
export class UserController extends BaseHttpController {
  @inject(UserService)
  private userService: UserService;

  @httpPut(
    '/update',
    AuthMiddleware,
    celebrate({
      body: Joi.object({
        fullName: Joi.string(),
        gender: Joi.string(),
        phone: Joi.string(),
        email: Joi.string(),
        dob: Joi.date().iso(),
        role: Joi.string(),
        about: Joi.object({
          title: Joi.string().required(),
          description: Joi.string().required(),
          links: Joi.array().items(Joi.object({
            label: Joi.string().required(),
            url: Joi.string().required(),
          })),
        })
      }),
    }),
  )
  async update(): Promise<void> {
    const { fullName, gender, phone, email, dob, role } = this.httpContext.request.body;
    const userId = this.httpContext.user.details._id;

    const user = await this.userService.update(
      userId,
      { fullName, gender, phone, email, dob, role },
    );

    this.httpContext.response.status(200).json({ user });
  }

  @httpPut(
    '/:userId',
    AuthAdminMiddleware,
    celebrate({
      body: Joi.object({
        fullName: Joi.string(),
        gender: Joi.string(),
        phone: Joi.string(),
        email: Joi.string(),
        dob: Joi.date().iso(),
        role: Joi.array().items(Joi.string().allow('default', 'admin', 'proprietor', 'contributor', 'campaigner')),
        status: Joi.string().allow('active', 'blocked'),
        about: Joi.object({
          title: Joi.string().required(),
          description: Joi.string().required(),
          links: Joi.array().items(Joi.object({
            label: Joi.string().required(),
            url: Joi.string().required(),
          })),
        })
      }),
    }),
  )
  async updateByAdmin(): Promise<void> {
    const { fullName, gender, phone, email, dob, role, status } = this.httpContext.request.body;
    const userId = this.httpContext.request.params.userId;

    const user = await this.userService.update(
      userId,
      { fullName, gender, phone, email, dob, role, status },
    );

    this.httpContext.response.status(200).json({ user });
  }

  @httpPut(
    '/update/:userId/update-avatar',
    upload({ filePath: FILE_PATH, fileName: 'file' }),
    UploadMiddleware,
    celebrate({
      params: Joi.object({
        userId: Joi.string().required(),
      }),
      body: Joi.object({
        file: fileJoi.required(),
      }),
    }),
  )
  async updateAvatar(@requestParam('userId') userId: string): Promise<void> {
    const { file } = this.httpContext.request.body;
    const res = this.httpContext.response;

    const user = await this.userService.updateAvatar(userId, file);


    res.json({ message: 'Avatar Updated', user });
  }

  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        userId: Joi.string(),
        // organizationId: Joi.string(),
        status: Joi.string(),
        q: Joi.string().allow(''),
        sort: Joi.string(),
        page: Joi.number(),
        limit: Joi.number(),
        dateStart: Joi.date().iso(),
        dateEnd: Joi.date().iso(),
      }),
    }),
  )
  async retrieve(): Promise<void> {
    const { userId, sort, page, limit, title, dateStart, dateEnd, status, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (userId) {
      const user = await this.userService.findById(userId);

      this.httpContext.response.json({ user });

      return;
    }

    let query: Query = {};

    // if (organizationId) query = { ...query, ...{ organization: organizationId } };

    if (status) query = { ...query, ...{ status } };

    if (title) query = { ...query, ...{ user: title } };

    if (dateStart) query = { ...query, ...{ createdAt: { $gte: dateStart } } };

    if (dateEnd) query = { ...query, ...{ createdAt: { $lt: dateEnd } } };

    if (dateStart && dateEnd)
      query = {
        ...query,
        ...{
          $and: [{ createdAt: { $gte: dateStart } }, { createdAt: { $lt: dateEnd } }],
        },
      };

    const userPage = await this.userService.page(query, {
      sort,
      page,
      limit,
      q,
      populate: [],
    });

    this.httpContext.response.json({ userPage });
  }

  @httpDelete(
    '/delete-profile/:userId',
    AuthMiddleware,
    celebrate({
      params: Joi.object({
        userId: Joi.string().required(),
      }),
    }),
  )
  async deleteProfile(@requestParam('userId') userId: string): Promise<void> {
    const user = await this.userService.deleteProfile(userId);

    this.httpContext.response.json({ user });
  }

  @httpDelete(
    '/:userId',
    AuthMiddleware,
    celebrate({
      params: Joi.object({
        userId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('userId') userId: string): Promise<void> {
    const user = await this.userService.delete(userId);

    this.httpContext.response.json({ user });
  }


  @httpGet(
    '/count',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        status: Joi.string(),
        dateStart: Joi.date().iso(),
        dateEnd: Joi.date().iso(),
      }),
    }),
  )
  async count(): Promise<void> {
    const { dateStart, dateEnd, status } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    let query: Query = {};

    if (status) query = { ...query, ...{ status } };

    if (dateStart) query = { ...query, ...{ createdAt: { $gte: dateStart } } };

    if (dateEnd) query = { ...query, ...{ createdAt: { $lt: dateEnd } } };

    if (dateStart && dateEnd)
      query = {
        ...query,
        ...{
          $and: [{ createdAt: { $gte: dateStart } }, { createdAt: { $lt: dateEnd } }],
        },
      };

    const userCount = await this.userService.count(query);

    this.httpContext.response.json({ userCount });
  }
}
