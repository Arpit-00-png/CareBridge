import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const createPrescription = async (req, res) => {
  try {
    const { 
      relationId, 
      instructions, 
      medicines 
    } = req.body;

    const doctorId = req.user.id;

    const relation = await prisma.relation.findFirst({
      where: {
        id: relationId,
        doctorId: doctorId,
        status: 'ACTIVE'
      }
    });
    if (!relation) {
      return res.status(404).json({ error: 'Relation not found or unauthorized' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        relationId,
        doctorId,
        patientId: relation.patientId,
        instructions: instructions || '',
        medicines: {
          create: medicines.map(med => ({
            medicineName: med.medicineName,
            dosage: med.dosage,
            duration: med.duration,
            foodRelation: med.foodRelation,
            timings: {
              create: med.timings.map(time => ({
                time: time
              }))
            }
          }))
        }
      },
      include: {
        medicines: {
          include: {
            timings: true
          }
        }
      }
    });

    await prisma.log.create({
      data: {
        relationId,
        type: 'PRESCRIPTION',
        referenceId: prescription.id
      }
    });

    res.status(201).json({ 
      message: 'Prescription created successfully', 
      prescription 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getPrescriptions = async (req, res) => {
  try {
    const { relationId } = req.params;
    const prescriptions = await prisma.prescription.findMany({
      where: { relationId },
      orderBy: { issuedAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true }
        },
        medicines: {
          include: {
            timings: true
          }
        }
      }
    });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel prescription (Doctor only)
export const cancelPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const doctorId = req.user.id;

    // Check if prescription exists and belongs to this doctor
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        doctorId: doctorId
      },
      include: {
        relation: true,
        medicines: {
          include: {
            timings: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found or unauthorized' });
    }

    if (prescription.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Prescription already cancelled' });
    }

    // Update status to CANCELLED
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'CANCELLED' }
    });

    // Add to log
    await prisma.log.create({
      data: {
        relationId: prescription.relationId,
        type: 'PRESCRIPTION_CANCELLED',
        referenceId: prescriptionId
      }
    });

    // Broadcast to chat room that prescription was cancelled
    // (We'll handle this via socket)

    res.json({
      message: 'Prescription cancelled successfully',
      prescription: updatedPrescription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPrescriptionsForRelation = async (req, res) => {
  try {
    const { relationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check access - Allow if user is DOCTOR, PATIENT, or GUARDIAN (via group)
    let hasAccess = false;

    if (userRole === 'DOCTOR') {
      const relation = await prisma.relation.findFirst({
        where: {
          id: relationId,
          doctorId: userId,
          status: 'ACTIVE'
        }
      });
      if (relation) hasAccess = true;
    } else if (userRole === 'PATIENT') {
      const relation = await prisma.relation.findFirst({
        where: {
          id: relationId,
          patientId: userId,
          status: 'ACTIVE'
        }
      });
      if (relation) hasAccess = true;
    } else if (userRole === 'GUARDIAN') {
      // ✅ Guardian access: check if they are in the group for this relation
      const group = await prisma.group.findFirst({
        where: {
          relationId: relationId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      });
      if (group) hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access to this relation' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { 
        relationId: relationId
      },
      orderBy: { issuedAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true }
        },
        medicines: {
          include: {
            timings: true
          }
        }
      }
    });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: error.message });
  }
};