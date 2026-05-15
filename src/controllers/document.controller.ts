import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { getAccessibleExamenDocument } from '../services/document.service';

export async function getExamenDocumentController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const nurseProfileId = req.params.id;

  if (typeof nurseProfileId !== 'string' || nurseProfileId.length === 0) {
    throw createHttpError(400, 'Invalid nurse profile id');
  }

  const document = await getAccessibleExamenDocument(nurseProfileId, req.auth);

  res.status(200).json({
    document,
    note: 'Storage streaming / signed URL delivery is not wired yet.',
  });
}
