import 'reflect-metadata';
import './config';
import './core/controllers';
import http from 'http';
import { SERVER_PORT } from './config/server';
import { InversifyExpressServer, getRouteInfo } from 'inversify-express-utils';
import { getContainer } from './core/container';
import { render } from 'prettyjson';
import { AuthProvider } from './core/provider/auth';
import { AddressInfo } from 'net';
import { configureApp, errorMiddleware, notFoundErrorMiddleware } from './core/express';
import { dbConnect } from './core/mongoose';

process.on('uncaughtException', (error: Error) => {
  console.error('UNCAUGHT_EXCEPTION: %o', error);

  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('UNHANDLED_REJECTION: Reason: %o', reason);
  console.error('UNHANDLED_REJECTION: Promise: %o', promise);
});

async function serveApp(): Promise<void> {
  await dbConnect();
  console.info('DB_CONNECTED');

  const container = getContainer();

  const app = new InversifyExpressServer(container, null, null, null, AuthProvider).setConfig(configureApp).build();

  notFoundErrorMiddleware(app);

  errorMiddleware(app);

  console.info('DI_LOADED');

  console.info('ROUTES_LOADED');

  console.debug(render(getRouteInfo(container)));

  console.info('APP_LOADED');

  const server = http.createServer(app);

  server.on('error', (error) => {
    console.error('SERVER_ERROR: %o', error);

    throw error;
  });

  server.listen(SERVER_PORT, async () => {
    console.info('SERVER_STARTED: port: %o', (server.address() as AddressInfo).port);
    console.info('SYSTEM_INIT_STARTED');
    
    console.info('SYSTEM_INIT_COMPLETED');
  });
}

serveApp();
