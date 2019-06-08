import { Request, Response } from 'express';
import MiddlewareRunner, { NextFunction } from '../src';

describe('new MiddlewareRunner(middlewares)', () => {
  it('creates an instance of a MiddlewareRunner', async () => {
    const middlewareRunner = new MiddlewareRunner([]);
    expect(middlewareRunner.middlewares).toEqual([]);
  });
});

describe('middlewareRunner.run()', () => {
  it('runs an instance of MiddlewareRunner', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'hello');
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual('hello');
  });
  it('runs with multiple middlewares', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'hello');
      },
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'world');
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual('world');
  });
  it('runs with 2 args passed into last next', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'hello');
      },
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'world');
      },
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'hello', 'world');
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual(['hello', 'world']);
  });
  it('runs with empty next', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next();
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual(null);
  });
  it('it ignores first null when 2 args passed to next', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'world');
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual('world');
  });
  it('it ignores first null when 3 args passed to next', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'hello', 'world');
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual(['hello', 'world']);
  });
  it('runs with nested middlewares', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next();
      },
      [
        (_req: Request, _res: Response, next: NextFunction) => {
          return next();
        },
        [
          (_req: Request, _res: Response, next: NextFunction) => {
            return next();
          },
          (_req: Request, _res: Response, next: NextFunction) => {
            return next(null, 'hello');
          }
        ]
      ]
    ]);
    const req = {} as Request;
    const res = {} as Response;
    expect(await middlewareRunner.run(req, res)).toEqual('hello');
  });
  it('ignore error middlewares', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(null, 'hello');
      },
      (_err: Error, _req: Request, _res: Response, next: NextFunction) => {
        return next(new Error('world'));
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    try {
      await middlewareRunner.run(req, res);
    } catch (err) {
      expect(err).toEqual('howdy, texas');
    }
  });
  it('runs error middlewares', async () => {
    const middlewareRunner = new MiddlewareRunner([
      (_req: Request, _res: Response, next: NextFunction) => {
        return next(new Error('hello'));
      },
      (_err: Error, _req: Request, _res: Response, next: NextFunction) => {
        return next(new Error('world'));
      },
      [
        (_err: Error, _req: Request, _res: Response, next: NextFunction) => {
          return next(new Error('texas'));
        }
      ],
      (err: Error, _req: Request, _res: Response, next: NextFunction) => {
        return next(new Error(`howdy, ${err.message}`));
      }
    ]);
    const req = {} as Request;
    const res = {} as Response;
    try {
      await middlewareRunner.run(req, res);
    } catch (err) {
      expect(err).toEqual(new Error('howdy, texas'));
    }
  });
});
