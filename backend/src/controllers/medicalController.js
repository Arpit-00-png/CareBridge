import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;

    const relations = await prisma.relation.findMany({
      where: { 
        patientId: patientId,
        status: 'ACTIVE'
      },
      select: { id: true }
    });
    
    const relationIds = relations.map(r => r.id);
    
    if (relationIds.length === 0) {
      return res.json([]);
    }
    
    // ✅ Sirf ACTIVE prescriptions
    const prescriptions = await prisma.prescription.findMany({
      where: { 
        relationId: { in: relationIds },
        status: 'ACTIVE'  // ✅ Ye line add karo
      },
      orderBy: { issuedAt: 'desc' },
      include: {
        doctor: { select: { name: true } },
        medicines: {
          include: { timings: true }
        }
      }
    });
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;
        const appointments = await prisma.appointment.findMany({
            where: {
                patientId,
                status: 'SCHEDULED'
            },
            orderBy: { scheduledTime: 'asc' },
            include: {
                doctor: { select: { name: true } }
            }
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};