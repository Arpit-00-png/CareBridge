import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getUnverifiedUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: role,
        isVerified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
    res.json({ message: 'User verified successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRelation = async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    const adminId = req.user.id; 

    const existing = await prisma.relation.findFirst({
      where: {
        doctorId,
        patientId,
        status: 'ACTIVE'
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'This doctor-patient relation already exists and is active.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const relation = await tx.relation.create({
        data: {
          doctorId,
          patientId,
          createdByAdminId: adminId,
          status: 'ACTIVE'
        }
      });

      const group = await tx.group.create({
        data: {
          relationId: relation.id
        }
      });

      await tx.groupMember.createMany({
        data: [
          { groupId: group.id, userId: doctorId },
          { groupId: group.id, userId: patientId }
        ]
      });

      return { relation, group };
    });

    res.status(201).json({
      message: 'Relation created successfully, Group and Members added!',
      data: result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getRelations = async (req, res) => {
  try {
    const relations = await prisma.relation.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        doctor: {
          select: { id: true, name: true, email: true }
        },
        patient: {
          select: { id: true, name: true, email: true }
        },
        group: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const revokeRelation = async (req, res) => {
  try {
    const { relationId } = req.params;
    
    const relation = await prisma.relation.findUnique({
      where: { id: relationId }
    });

    if (!relation) {
      return res.status(404).json({ error: 'Relation not found' });
    }
    if (relation.status === 'REVOKED') {
      return res.status(400).json({ error: 'Relation already revoked' });
    }

    const updatedRelation = await prisma.relation.update({
      where: { id: relationId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date()
      }
    });

    res.json({ 
      message: 'Relation revoked successfully', 
      data: updatedRelation 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getAllVerifiedUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isVerified: true,
        role: {
          in: ['DOCTOR', 'PATIENT']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllVerifiedPatients = async (req, res) => {
  try {
    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        isVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};