import cron from 'node-cron';
import prisma from '../prisma';

export function startDeadlineMonitor() {
  console.log('[AICTE Background Worker] Starting Automated Compliance & Deadline Monitor...');

  // Run immediately on boot, then every hour
  checkDeadlines();

  // Run every hour
  cron.schedule('0 * * * *', () => {
    checkDeadlines();
  });
}

export async function checkDeadlines() {
  try {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    const pendingApplications = await prisma.application.findMany({
      where: {
        deadlineDate: { not: null },
        status: { notIn: ['DECISION_RECORDED', 'CLOSED'] },
      },
      include: {
        institution: { include: { users: true } },
        reviewerAssignments: { include: { officer: true } },
      },
    });

    const officers = await prisma.user.findMany({ where: { role: 'OFFICER' } });

    for (const app of pendingApplications) {
      if (!app.deadlineDate) continue;

      const deadline = new Date(app.deadlineDate);
      const isOverdue = deadline < now;
      const isApproaching = deadline > now && deadline <= threeDaysLater;

      if (!isOverdue && !isApproaching) continue;

      const alertType = isOverdue ? 'DEADLINE_OVERDUE' : 'DEADLINE_APPROACHING';
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check if we sent this alert recently to prevent notification spam
      const recentAlert = await prisma.notification.findFirst({
        where: {
          applicationId: app.id,
          type: alertType,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
          },
        },
      });

      if (recentAlert) continue;

      const title = isOverdue
        ? `ALERT: Regulatory Deadline Overdue — ${app.applicationNo}`
        : `Reminder: Deadline in ${daysLeft} days — ${app.applicationNo}`;

      const message = isOverdue
        ? `Application ${app.applicationNo} exceeded its compliance deadline of ${deadline.toLocaleDateString()}. Immediate scrutiny required.`
        : `Application ${app.applicationNo} has an impending statutory review deadline on ${deadline.toLocaleDateString()}.`;

      // Notify officers
      for (const officer of officers) {
        await prisma.notification.create({
          data: {
            userId: officer.id,
            applicationId: app.id,
            type: alertType,
            title,
            message,
            relatedDeadline: deadline,
          },
        });
      }

      // Notify institution users
      if (app.institution?.users) {
        for (const instUser of app.institution.users) {
          await prisma.notification.create({
            data: {
              userId: instUser.id,
              applicationId: app.id,
              type: alertType,
              title,
              message,
              relatedDeadline: deadline,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('[DeadlineMonitor Error]:', err);
  }
}
