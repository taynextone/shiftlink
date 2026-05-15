import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
}
