import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getLogsByRelation = async (req, res) => {
  try {
    const { relationId } = req.params;
    const userId = req.user.id;

    const relation = await prisma.relation.findFirst({
      where: {
        id: relationId,
        OR: [
          { doctorId: userId },
          { patientId: userId }
        ]
      }
    });

    if (!relation) {
      return res.status(403).json({ error: 'Unauthorized access to this relation' });
    }

    const logs = await prisma.log.findMany({
      where: { relationId },
      orderBy: { createdAt: 'desc' },
      include: {
        relation: {
          include: {
            doctor: { select: { name: true } },
            patient: { select: { name: true } }
          }
        }
      }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};