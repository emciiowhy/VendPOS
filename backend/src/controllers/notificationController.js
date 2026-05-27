import notificationService from '../services/notificationService.js';

class NotificationController {
  // GET /api/notifications - list notifications for the store
  async getNotifications(req, res, next) {
    try {
      const storeId = req.storeId;
      const notifications = await notificationService.getNotifications(storeId);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/notifications/summary - alerts summary
  async getAlertsSummary(req, res, next) {
    try {
      const storeId = req.storeId;
      const summary = await notificationService.getAlertsSummary(storeId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
