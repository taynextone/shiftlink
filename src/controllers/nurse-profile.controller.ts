import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { updateOwnNurseProfile } from '../services/nurse-profile.service';

export async function updateOwnNurseProfileController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const profile = await updateOwnNurseProfile(req.auth, req.body);

  res.status(200).json({
    nurseProfile: profile,
  });
}
