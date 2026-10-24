import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { success } from '../../../middleware/errorHandler.js';
import * as notificationService from '../application/notificationService.js';

export const notificationsRouter = Router();

notificationsRouter.get('/notifications', authenticate, async (req, res, next) => {
  try {
    success(res, await notificationService.listMyNotifications(req.user!.id));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    success(res, await notificationService.markNotificationRead(req.params.id, req.user!.id));
  } catch (err) {
    next(err);
  }
});