import { notFound } from '../../../lib/errors.js';
import { prisma } from '../../../lib/prisma.js';

type NotificationRow = {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

function mapNotification(n: NotificationRow) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    body: n.body,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function listMyNotifications(userId: string) {
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return items.map(mapNotification);
}

export async function markNotificationRead(id: string, userId: string) {
  const existing = await prisma.notification.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('NOTIFICATION_NOT_FOUND', 'Notificação não encontrada');

  const updated = existing.readAt
    ? existing
    : await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });

  return mapNotification(updated);
}