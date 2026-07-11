import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getGroupByRelation = async (req, res) => {
  try {
    const { relationId } = req.params;
    const group = await prisma.group.findFirst({
      where: { relationId },
      include: {
        relation: {
          include: {
            patient: { select: { id: true, name: true, email: true } },
            doctor: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { relationId } = req.params;
    const group = await prisma.group.findFirst({
      where: { relationId }
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const messages = await prisma.message.findMany({
      where: { groupId: group.id },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};