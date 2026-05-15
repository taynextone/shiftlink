import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  copyOwnAvailabilityBlock,
  createOwnAvailabilityBlock,
  listOwnAvailabilityBlocks,
  replaceOwnAvailabilityBlocks,
} from '../services/nurse-availability.service';

function requireActor(req: Request) {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  return req.auth;
}

export async function listOwnAvailabilityBlocksController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const blocks = await listOwnAvailabilityBlocks(actor);
  res.status(200).json({ blocks });
}

export async function createOwnAvailabilityBlockController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const block = await createOwnAvailabilityBlock(actor, req.body);
  res.status(201).json({ block });
}

export async function replaceOwnAvailabilityBlocksController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const blocks = await replaceOwnAvailabilityBlocks(actor, req.body);
  res.status(200).json({ blocks });
}

export async function copyOwnAvailabilityBlockController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const blocks = await copyOwnAvailabilityBlock(actor, req.body);
  res.status(200).json({ blocks });
}
