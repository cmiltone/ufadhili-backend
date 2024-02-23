"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./config");
require("./core/controllers");
const http_1 = __importDefault(require("http"));
const server_1 = require("./config/server");
const inversify_express_utils_1 = require("inversify-express-utils");
const container_1 = require("./core/container");
const prettyjson_1 = require("prettyjson");
const auth_1 = require("./core/provider/auth");
const express_1 = require("./core/express");
const mongoose_1 = require("./core/mongoose");
const system_1 = require("./services/system");
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT_EXCEPTION: %o', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED_REJECTION: Reason: %o', reason);
    console.error('UNHANDLED_REJECTION: Promise: %o', promise);
});
function serveApp() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.dbConnect();
        console.info('DB_CONNECTED');
        const container = container_1.getContainer();
        const app = new inversify_express_utils_1.InversifyExpressServer(container, null, null, null, auth_1.AuthProvider).setConfig(express_1.configureApp).build();
        express_1.notFoundErrorMiddleware(app);
        express_1.errorMiddleware(app);
        console.info('DI_LOADED');
        console.info('ROUTES_LOADED');
        console.debug(prettyjson_1.render(inversify_express_utils_1.getRouteInfo(container)));
        console.info('APP_LOADED');
        const server = http_1.default.createServer(app);
        server.on('error', (error) => {
            console.error('SERVER_ERROR: %o', error);
            throw error;
        });
        server.listen(server_1.SERVER_PORT, () => __awaiter(this, void 0, void 0, function* () {
            console.info('SERVER_STARTED: port: %o', server.address().port);
            console.info('SYSTEM_INIT_STARTED');
            yield container.get(system_1.SystemService).init();
            console.info('SYSTEM_INIT_COMPLETED');
        }));
    });
}
serveApp();
//# sourceMappingURL=app.js.map