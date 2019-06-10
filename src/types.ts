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

export type ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => any;

export interface DeepArray<T> extends Array<T | DeepArray<T>> {}

export type Middleware = RequestHandler | ErrorRequestHandler;

export type MiddlewareChain = DeepArray<Middleware> | Middleware;
