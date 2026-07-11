const { sendSuccess } = require('../../../shared/utils/response');
const reportService = require('../services/report.service');

const reportController = {
  getDashboard: async (req, res, next) => {
    try { sendSuccess(res, await reportService.getDashboard(req.query)); } catch (e) { next(e); }
  },
  exportReport: async (req, res, next) => {
    try {
      const buffer = await reportService.exportReport(req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
      res.send(buffer);
    } catch (e) { next(e); }
  },
};

module.exports = reportController;
