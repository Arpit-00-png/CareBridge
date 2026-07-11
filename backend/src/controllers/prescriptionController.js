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