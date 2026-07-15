import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const createAppointment = async (req, res) => {
  try {
    const { relationId, scheduledTime } = req.body;
    const doctorId = req.user.id;

    const relation = await prisma.relation.findFirst({
      where: {
        id: relationId,
        doctorId: doctorId,
        status: 'ACTIVE'
      },
      include: {
        patient: true
      }
    });
    if (!relation) {
      return res.status(404).json({ error: 'Relation not found or unauthorized' });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const appointment = await prisma.appointment.create({
      data: {
        relationId,
        doctorId,
        patientId: relation.patientId,
        scheduledTime: new Date(scheduledTime),
        roomId,
        status: 'SCHEDULED'
      }
    });
    await prisma.log.create({
      data: {
        relationId,
        type: 'APPOINTMENT',
        referenceId: appointment.id
      }
    });

    res.status(201).json({ 
      message: 'Appointment scheduled successfully', 
      appointment,
      callLink: `/call/${roomId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getAppointments = async (req, res) => {
  try {
    const { relationId } = req.params;
    const appointments = await prisma.appointment.findMany({
      where: { relationId },
      orderBy: { scheduledTime: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true }
        },
        patient: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel appointment (Doctor or Patient can cancel)
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Check if appointment exists and user has access
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { doctorId: userId },
          { patientId: userId }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or unauthorized' });
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'MISSED') {
      return res.status(400).json({ error: 'Cannot cancel completed or missed appointment' });
    }

    // Update status to CANCELLED
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' }
    });

    res.json({ 
      message: 'Appointment cancelled successfully', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
      return res.status(403).json({ error: 'Forbidden - Only admin or doctor can delete' });
    }

    // Check if appointment exists
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...(userRole === 'DOCTOR' ? { doctorId: userId } : {})
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or unauthorized' });
    }

    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};