const express = require('express');
const { applySecurity } = require('./config/security');
const errorHandler = require('./shared/errors/errorHandler');
const AppError = require('./shared/errors/AppError');

const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/user/routes/user.routes');
const activityRoutes = require('./modules/activity/routes/activity.routes');
const contactRoutes = require('./modules/contacts/routes/contact.routes');
const dealRoutes = require('./modules/deals/routes/deal.routes');
const taskRoutes = require('./modules/tasks/routes/task.routes');
const communicationRoutes = require('./modules/communications/routes/communication.routes');
const documentRoutes = require('./modules/documents/routes/document.routes');
const notificationRoutes = require('./modules/notifications/routes/notification.routes');
const reportRoutes = require('./modules/reports/routes/report.routes');
const settingsRoutes = require('./modules/settings/routes/settings.routes');
const aiRoutes = require('./modules/ai/routes/ai.routes');

const app = express();

applySecurity(app);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CRM API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

module.exports = app;
