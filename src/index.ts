import { Request, Response } from 'express';
import { RequestHandler, ErrorRequestHandler, DeepArray } from './types';

export default class MiddlewareRunner<Result> {
  middlewares: RequestHandler[];

  constructor(
    unflattenedMiddlewares: DeepArray<RequestHandler | ErrorRequestHandler>
  ) {
    this.middlewares = unflattenedMiddlewares.flat(Infinity);
  }

  async run(req: Request, res: Response): Promise<Result> {
    let promiseChain: Promise<any> = Promise.resolve(null);
    this.middlewares.forEach(
      (middleware: RequestHandler | ErrorRequestHandler) => {
        [
          () => {},
          () => {
            promiseChain = promiseChain.then(() =>
              invoke(middleware, [req, res])
            );
          },
          () => {
            promiseChain = promiseChain.catch((err: Error) =>
              invoke(middleware, [err, req, res])
            );
          }
        ][Math.max(Math.max(0, Math.min(2, middleware.length - 2)))]();
      }
    );
    return promiseChain as Promise<Result>;
  }
}

async function invoke(
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

export * from './types';
