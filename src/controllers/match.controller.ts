import { Request, Response } from 'express';
import { signMatchContract } from '../services/match.service';

export async function signMatchContractController(req: Request, res: Response): Promise<void> {
  const contract = await signMatchContract(req.body.matchContractId);

  res.status(200).json({
    matchContract: contract,
  });
}
