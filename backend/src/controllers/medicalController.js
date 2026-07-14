import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getPatientPrescriptions = async (req, res) => {
    try {
        const patientId = req.user.id;
        console.log('Patient ID:', patientId);

        // ✅ First get all relations where this user is patient
        const relations = await prisma.relation.findMany({
            where: {
                patientId: patientId,
                status: 'ACTIVE'
            },
            select: { id: true }
        });
        console.log('Relations found:', relations);

        const relationIds = relations.map(r => r.id);
        console.log('Relation IDs:', relationIds);


        // ✅ If no relations, return empty array
        if (relationIds.length === 0) {
            return res.json([]);
        }

        // ✅ Fetch prescriptions for those relations with medicines and timings
        const prescriptions = await prisma.prescription.findMany({
            where: {
                relationId: { in: relationIds }
            },
            orderBy: { issuedAt: 'desc' },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
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