import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const requestRouter = Router();
requestRouter.route('/').get(asyncHandler(requestController.list)).post(asyncHandler(requestController.create));
requestRouter.patch('/:id/status', asyncHandler(requestController.changeStatus));
requestRouter.route('/:id').get(asyncHandler(requestController.get)).patch(asyncHandler(requestController.update)).delete(asyncHandler(requestController.remove));
