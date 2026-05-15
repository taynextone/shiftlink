import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { getPublicNurseProfile, updateOwnNurseProfile } from '../services/nurse-profile.service';

export async function updateOwnNurseProfileController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const profile = await updateOwnNurseProfile(req.auth, req.body);

  res.status(200).json({
    nurseProfile: profile,
  });
}

export async function getPublicNurseProfileController(req: Request, res: Response): Promise<void> {
  const publicId = req.params.publicId;

  if (typeof publicId !== 'string' || publicId.length === 0) {
    throw createHttpError(400, 'Invalid public nurse profile id');
  }

  const profile = await getPublicNurseProfile(publicId);

  res.status(200).json({
    nurseProfile: profile,
  });
}
