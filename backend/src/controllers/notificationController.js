import notificationService from '../services/notificationService.js';

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getNotifications(req.tenantId);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  }

  async getAlertsSummary(req, res, next) {
    try {
      const summary = await notificationService.getAlertsSummary(req.tenantId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
