import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { deleteOwnAccount, exportUserData } from '../services/user-deletion.service';
import { clearAuthCookie } from '../utils/cookies';

export async function deleteOwnAccountController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  await deleteOwnAccount(req.auth.userId, req.auth.role);

  clearAuthCookie(res);

  res.status(200).json({
    message: 'Account and all associated data have been deleted.',
  });
}

export async function exportOwnDataController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const data = await exportUserData(req.auth.userId, req.auth.role);

  res.status(200).json({
    data,
  });
}
