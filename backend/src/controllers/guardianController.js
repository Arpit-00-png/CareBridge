import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getGuardianPatients = async (req, res) => {
  try {
    const guardianId = req.user.id;
    console.log('🔍 Guardian ID:', guardianId);

    // Pehle saare groupMembers fetch karo bina filter ke
    const allGroupMembers = await prisma.groupMember.findMany({
      where: {
        userId: guardianId
      },
      include: {
        group: {
          include: {
            relation: {
              include: {
                patient: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    patientProfile: true
                  }
                },
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('📦 Raw groupMembers count:', allGroupMembers.length);
    console.log('📦 Raw groupMembers:', JSON.stringify(allGroupMembers, null, 2));

    // Group by patient with multiple doctors
    const patientMap = new Map();
    
    for (const member of allGroupMembers) {
      const relation = member.group?.relation;
      if (!relation) continue;
      
      const patient = relation.patient;
      const doctor = relation.doctor;
      const relationId = relation.id;
      const groupId = member.group.id;
      const status = relation.status;
      
      console.log(`🔎 Processing: Patient=${patient?.name}, Doctor=${doctor?.name}, Status=${status}`);
      
      if (patient && doctor && status === 'ACTIVE') {
        if (!patientMap.has(patient.id)) {
          patientMap.set(patient.id, {
            ...patient,
            doctors: [],
            relations: []
          });
        }
        
        const patientData = patientMap.get(patient.id);
        // ✅ Check if doctor already added (by id)
        const existingDoctor = patientData.doctors.find(d => d.id === doctor.id);
        if (!existingDoctor) {
          patientData.doctors.push({
            ...doctor,
            relationId,
            groupId,
            status
          });
        } else {
          console.log(`⚠️ Duplicate doctor found: ${doctor.name} for patient ${patient.name}`);
        }
        patientData.relations.push({ relationId, groupId, doctorId: doctor.id, status });
      }
    }

    console.log('🔍 Final patientMap:', Array.from(patientMap.values()).map(p => ({
      name: p.name,
      doctors: p.doctors.map(d => ({ name: d.name, status: d.status }))
    })));

    res.json(Array.from(patientMap.values()));
  } catch (error) {
    console.error('Error fetching guardian patients:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPatientDetails = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { relationId } = req.query; // ✅ Get relationId from query
        const guardianId = req.user.id;

        // Verify guardian has access
        const groupMember = await prisma.groupMember.findFirst({
            where: {
                userId: guardianId,
                group: {
                    relation: {
                        id: relationId,
                        patientId: patientId
                    }
                }
            },
            include: {
                group: {
                    include: {
                        relation: {
                            include: {
                                doctor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                },
                                patient: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!groupMember) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Fetch prescriptions for this relation
        const prescriptions = await prisma.prescription.findMany({
            where: {
                relationId: relationId,
                status: 'ACTIVE'
            },
            orderBy: { issuedAt: 'desc' },
            include: {
                doctor: { select: { name: true } },
                medicines: {
                    include: { timings: true }
                }
            }
        });

        // Fetch messages
        const messages = await prisma.message.findMany({
            where: { groupId: groupMember.groupId },
            orderBy: { timestamp: 'desc' },
            take: 50,
            include: {
                sender: { select: { name: true, role: true } }
            }
        });

        res.json({
            patient: {
                id: patientId,
                name: groupMember.group.relation.patient?.name || 'Unknown',
                doctor: groupMember.group.relation.doctor,
                relationId: relationId
            },
            prescriptions,
            messages: messages.reverse()
        });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ error: error.message });
    }
};