import { Request, Response } from 'express';
import { Middlewares, Middleware } from './types';

export default class MiddlewareRunner<Result> {
  middlewares: Middleware[];

  constructor(unflattenedMiddlewares: Middlewares) {
    if (Array.isArray(unflattenedMiddlewares)) {
      this.middlewares = unflattenedMiddlewares.flat(Infinity);
    } else {
      this.middlewares = [unflattenedMiddlewares];
    }
  }

  async run(req: Request, res: Response): Promise<Result> {
    let promiseChain: Promise<any> = Promise.resolve(null);
    this.middlewares.forEach((middleware: Middleware) => {
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
    });
    return promiseChain as Promise<Result>;
  }
}

async function invoke(middleware: Middleware, handlerArgs: any[]) {
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

export async function runMiddleware<Result>(
  req: Request,
  res: Response,
  middlewares: Middlewares
): Promise<Result> {
  const middlewareRunner = new MiddlewareRunner<Result>(middlewares);
  return middlewareRunner.run(req, res);
}

export * from './types';
