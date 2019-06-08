import { Request, Response } from 'express';
import { RequestHandler, ErrorRequestHandler, DeepArray } from './types';

export default class MiddlewareRunner<Result> {
  middlewares: RequestHandler[];

  constructor(
    unflattenedMiddlewares: DeepArray<RequestHandler | ErrorRequestHandler>
  ) {
    this.middlewares = unflattenedMiddlewares.flat(Infinity);
  }

  private async invoke(
    middleware: RequestHandler | ErrorRequestHandler,
    handlerArgs: any[]
  ) {
    return new Promise((resolve, reject) => {
      middleware.call(
        null,
        ...handlerArgs,
        // @ts-ignore
        (err?: Error, ...params: any[]) => {
          if (err) return reject(err);
          if (!params.length) return resolve(null);
          if (params.length === 1) return resolve(params[0]);
          return resolve(params);
        }
      );
    });
  }

  async run(req: Request, res: Response): Promise<Result> {
    let promiseChain: Promise<any> = Promise.resolve();
    this.middlewares.forEach(
      (middleware: RequestHandler | ErrorRequestHandler) => {
        [
          () => {},
          () => {
            promiseChain = promiseChain.then(() =>
              this.invoke(middleware, [req, res])
            );
          },
          () => {
            promiseChain = promiseChain.catch((err: Error) =>
              this.invoke(middleware, [err, req, res])
            );
          }
        ][Math.max(Math.max(0, Math.min(2, middleware.length - 2)))]();
      }
    );
    return promiseChain as Promise<Result>;
  }
}

export * from './types';
