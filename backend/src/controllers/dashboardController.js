import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const relations = await prisma.relation.findMany({
      where: {
        doctorId,
        status: 'ACTIVE'
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            patientProfile: true
          }
        }
      }
    });
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientDoctors = async (req, res) => {
  try {
    const patientId = req.user.id;
    const relations = await prisma.relation.findMany({
      where: {
        patientId,
        status: 'ACTIVE'
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            doctorProfile: true
          }
        }
      }
    });
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};