import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const createRequest = async (req, res) => {
  try {
    const { patientId, message } = req.body;
    const doctorId = req.user.id;

    const patient = await prisma.user.findFirst({
      where: { 
        id: patientId, 
        role: 'PATIENT',
        isVerified: true 
      }
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or not verified' });
    }

    const existingRelation = await prisma.relation.findFirst({
      where: {
        doctorId,
        patientId,
        status: 'ACTIVE'
      }
    });
    if (existingRelation) {
      return res.status(400).json({ error: 'Relation already exists' });
    }

    const existingRequest = await prisma.relationRequest.findFirst({
      where: {
        doctorId,
        patientId,
        status: 'PENDING'
      }
    });
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already pending' });
    }

    const request = await prisma.relationRequest.create({
      data: {
        doctorId,
        patientId,
        message: message || '',
        status: 'PENDING'
      }
    });

    res.status(201).json({ 
      message: 'Request sent to admin', 
      request 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await prisma.relationRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true }
        },
        patient: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; 
    const adminId = req.user.id;

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const request = await prisma.relationRequest.findUnique({
      where: { id: requestId }
    });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.relationRequest.update({
        where: { id: requestId },
        data: { status: action }
      });

      let relation = null;
      let group = null;

      if (action === 'APPROVED') {
        relation = await tx.relation.create({
          data: {
            doctorId: request.doctorId,
            patientId: request.patientId,
            createdByAdminId: adminId,
            status: 'ACTIVE'
          }
        });

        group = await tx.group.create({
          data: {
            relationId: relation.id
          }
        });

        await tx.groupMember.createMany({
          data: [
            { groupId: group.id, userId: request.doctorId },
            { groupId: group.id, userId: request.patientId }
          ]
        });
      }

      return { updatedRequest, relation, group };
    });

    res.json({
      message: `Request ${action.toLowerCase()} successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorRequests = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const requests = await prisma.relationRequest.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};