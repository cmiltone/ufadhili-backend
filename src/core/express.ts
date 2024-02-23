import express, { Application, Request, Response, NextFunction } from 'express';
import morganBody from 'morgan-body';
import { serializeError, ErrorObject } from 'serialize-error';
import { BODY_PARSER_LIMIT, NODE_ENV } from '../config/server';
import { isCelebrateError } from 'celebrate';
import cors from 'cors';

export function configureApp(app: Application): void {
  app.enable('trust proxy');

  app.use(
    cors({
      allowedHeaders: ['Authorization', 'Content-Type'],
      exposedHeaders: ['Authorization'],
    }),
  );

  app.use(express.json({ limit: '10mb' }));

  app.use(express.urlencoded({ extended: false }));

  morganBody(app, { maxBodyLength: BODY_PARSER_LIMIT });
}

export function notFoundErrorMiddleware(app: Application): void {
  app.use((req, res, next) => {
    const error: DefaultError = new Error('URL not found');

    //error.code = '404';
    error.status = 404;

    next(error);
  });
}

export function errorMiddleware(app: Application): void {
  app.use((error: DefaultError, req: Request, res: Response, next: NextFunction) => {

    const { name, stack, code, message, status } = error;

    const serializedError: ErrorObject & {
      status?: number;
    } = serializeError({ name, stack, code, status, message });

    //serializedError.code = serializedError.code || '500';

    //delete serializedError.status;

    if (isCelebrateError(error)) serializedError.message = error.details.entries().next().value[1].details[0].message;

    if (NODE_ENV !== 'development') delete serializedError.stack;

    res.status(error.status || 500).json({ error: serializedError });

    next();
  });
}
