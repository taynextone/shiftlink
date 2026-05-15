import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  copyOwnAvailabilityBlock,
  createOwnAvailabilityBlock,
  deleteOwnAvailabilityBlock,
  listOwnAvailabilityBlocks,
  replaceOwnAvailabilityBlocks,
  setAvailabilityBlockBookedState,
  updateOwnAvailabilityBlock,
} from '../services/nurse-availability.service';

function requireActor(req: Request) {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  return req.auth;
}

function requireBlockId(req: Request) {
  const blockId = req.params.blockId;
  if (typeof blockId !== 'string' || blockId.length === 0) {
    throw createHttpError(400, 'Invalid availability block id');
  }
  return blockId;
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

export async function updateOwnAvailabilityBlockController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const blockId = requireBlockId(req);
  const block = await updateOwnAvailabilityBlock(actor, blockId, req.body);
  res.status(200).json({ block });
}

export async function deleteOwnAvailabilityBlockController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const blockId = requireBlockId(req);
  await deleteOwnAvailabilityBlock(actor, blockId);
  res.status(204).send();
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

export async function setAvailabilityBlockBookedStateController(req: Request, res: Response): Promise<void> {
  const actor = requireActor(req);
  const blockId = requireBlockId(req);
  const block = await setAvailabilityBlockBookedState(blockId, req.body, actor);
  res.status(200).json({ block });
}
