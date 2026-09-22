import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const equipmentRouter = Router();
equipmentRouter.route('/').get(asyncHandler(equipmentController.list)).post(asyncHandler(equipmentController.create));
equipmentRouter.get('/:id/requests', asyncHandler(equipmentController.requests));
equipmentRouter.get('/:id/weather', asyncHandler(equipmentController.weather));
equipmentRouter.route('/:id').get(asyncHandler(equipmentController.get)).patch(asyncHandler(equipmentController.update)).delete(asyncHandler(equipmentController.remove));
