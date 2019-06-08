import {
  NextFunction as ExpressNextFunction,
  Request,
  RequestHandler as ExpressRequestHandler,
  Response
} from 'express';

export interface NextFunction extends ExpressNextFunction {
  (...params: any[]): void;
}

export interface RequestHandler extends ExpressRequestHandler {
  (req: Request, res: Response, next: NextFunction): any;
}

export interface DeepArray<T> extends Array<T | DeepArray<T>> {}

export default class MiddlewareRunner<Result> {
  middlewares: RequestHandler[];

  constructor(unflattenedMiddlewares: DeepArray<RequestHandler>) {
    this.middlewares = unflattenedMiddlewares.flat(Infinity);
  }

  private async invoke(middleware: RequestHandler, handlerArgs: any[]) {
    return new Promise(resolve => {
      middleware.call(
        null,
        ...handlerArgs,
        // @ts-ignore
        (...params: any[]) => {
          if (!params.length) return resolve(null);
          return resolve(params.length === 1 ? params[0] : params);
        }
      );
    });
  }

  async run(request: Request, response: Response): Promise<Result> {
    let promiseChain: Promise<any> = Promise.resolve();
    this.middlewares.forEach((middleware: RequestHandler) => {
      [
        () => {},
        () => {
          promiseChain = promiseChain.then(() =>
            this.invoke(middleware, [request, response])
          );
        },
        () => {
          promiseChain = promiseChain.catch((err: Error) =>
            this.invoke(middleware, [err, request, response])
          );
        }
      ][Math.max(Math.max(0, Math.min(2, middleware.length - 2)) || 0)]();
    });
    return promiseChain as Promise<Result>;
  }
}
