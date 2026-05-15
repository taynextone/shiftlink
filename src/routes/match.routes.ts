import { Router } from 'express';
import { signMatchContractController } from '../controllers/match.controller';
import { validateBody } from '../middlewares/validate';
import { signMatchContractSchema } from '../schemas/match.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post('/sign', validateBody(signMatchContractSchema), asyncHandler(signMatchContractController));

export default router;
