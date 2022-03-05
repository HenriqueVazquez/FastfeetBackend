import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import Youch from 'youch';

import * as Sentry from '@sentry/node';
import 'express-async-errors';
import routes from './routes';
import sentryConfig from './config/sentry';

import './database';

class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use(
      '/files/avatar',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads', 'avatar'))
    );
    this.server.use(
      '/files/signature',
      express.static(
        path.resolve(__dirname, '..', 'tmp', 'uploads', 'signature')
      )
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();

        return res.status(500).json(errors);
      }

      return res.status(500).json({ Erro: 'Erro Interno do Servidor' });
    });
  }
}

export default new App().server;