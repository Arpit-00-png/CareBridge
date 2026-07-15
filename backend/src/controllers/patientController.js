import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const addGuardian = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { name, email, phone, relation: relationType } = req.body;

    // Check if patient already has 4 guardians (max limit)
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: patientId }
    });

    if (patientProfile.guardianCount >= 4) {
      return res.status(400).json({ error: 'Maximum 4 guardians allowed per patient' });
    }

    // Check if guardian already exists
    let guardian = await prisma.user.findUnique({
      where: { email }
    });

    let tempPassword = null;

    if (!guardian) {
      // Create new guardian account with temporary password
      tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      guardian = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || '',
          password: hashedPassword,
          role: 'GUARDIAN',
          isVerified: true
        }
      });
    }

    // ✅ Find ALL active relations for this patient
    const patientRelations = await prisma.relation.findMany({
      where: {
        patientId: patientId,
        status: 'ACTIVE'
      },
      include: {
        group: true
      }
    });

    if (patientRelations.length === 0) {
      return res.status(404).json({ error: 'No active relations found for this patient' });
    }

    // ✅ Add guardian to ALL groups (skip duplicate check)
    let addedCount = 0;
    for (const rel of patientRelations) {
      if (rel.group) {
        // Check if already a member
        const existingMember = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: rel.group.id,
              userId: guardian.id
            }
          }
        });

        if (!existingMember) {
          await prisma.groupMember.create({
            data: {
              groupId: rel.group.id,
              userId: guardian.id
            }
          });
          addedCount++;
        }
      }
    }

    // ✅ Update guardian count only if new guardian was created (or first time added)
    if (addedCount > 0) {
      await prisma.patientProfile.update({
        where: { userId: patientId },
        data: {
          guardianCount: patientProfile.guardianCount + 1
        }
      });
    }

    res.status(201).json({
      message: `Guardian added to ${addedCount} doctor(s) successfully`,
      guardian: {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        role: guardian.role
      },
      tempPassword: tempPassword,
      isExisting: !tempPassword,
      addedToGroups: addedCount
    });

  } catch (error) {
    console.error('Error adding guardian:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all guardians for a patient
export const getPatientGuardians = async (req, res) => {
  try {
    const patientId = req.user.id;

    const relation = await prisma.relation.findFirst({
      where: {
        patientId: patientId,
        status: 'ACTIVE'
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!relation || !relation.group) {
      return res.json([]);
    }

    const guardians = relation.group.members
      .filter(m => m.user.role === 'GUARDIAN')
      .map(m => m.user);

    res.json(guardians);
  } catch (error) {
    console.error('Error fetching guardians:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove guardian
export const removeGuardian = async (req, res) => {
  try {
    const { guardianId } = req.params;
    const patientId = req.user.id;

    const relation = await prisma.relation.findFirst({
      where: {
        patientId: patientId,
        status: 'ACTIVE'
      },
      include: {
        group: true
      }
    });

    if (!relation || !relation.group) {
      return res.status(404).json({ error: 'No active relation found' });
    }

    // Remove guardian from group
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: relation.group.id,
          userId: guardianId
        }
      }
    });

    // Decrement guardian count
    await prisma.patientProfile.update({
      where: { userId: patientId },
      data: {
        guardianCount: {
          decrement: 1
        }
      }
    });

    res.json({ message: 'Guardian removed successfully' });
  } catch (error) {
    console.error('Error removing guardian:', error);
    res.status(500).json({ error: error.message });
  }
};