import { Router } from 'express';
import { siteController } from '../controllers/site.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const siteRouter = Router();
siteRouter.get('/:id/summary', asyncHandler(siteController.summary));
