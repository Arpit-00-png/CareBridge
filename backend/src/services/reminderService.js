import cron from 'node-cron';
import nodemailer from 'nodemailer';
import pkg from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"CareBridge Health" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Prescription Reminder Email Template
const getPrescriptionEmailTemplate = (medicineName, dosage, timings, foodRelation) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; background-color: #2563eb; color: white; padding: 15px; border-radius: 10px 10px 0 0;">
        <h2>💊 Medicine Reminder</h2>
      </div>
      <div style="padding: 20px;">
        <p>Dear Patient,</p>
        <p>This is a reminder to take your prescribed medicine:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Medicine:</strong> ${medicineName}</p>
          <p><strong>Dosage:</strong> ${dosage}</p>
          <p><strong>Timing:</strong> ${timings.join(', ')}</p>
          <p><strong>Food Relation:</strong> ${foodRelation.replace('_', ' ')}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Take care of your health. ❤️</p>
        <p style="color: #6b7280; font-size: 14px;">- CareBridge Health Team</p>
      </div>
    </div>
  `;
};

// Appointment Reminder Email Template
const getAppointmentEmailTemplate = (doctorName, scheduledTime, callLink) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; background-color: #7c3aed; color: white; padding: 15px; border-radius: 10px 10px 0 0;">
        <h2>📅 Appointment Reminder</h2>
      </div>
      <div style="padding: 20px;">
        <p>Dear Patient,</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Time:</strong> ${new Date(scheduledTime).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <p>Join the video call using the link below:</p>
        <a href="${callLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin: 10px 0;">
          Join Call
        </a>
        <p style="color: #6b7280; font-size: 14px;">Please join 5 minutes before the scheduled time.</p>
        <p style="color: #6b7280; font-size: 14px;">- CareBridge Health Team</p>
      </div>
    </div>
  `;
};

// Start reminder service
export const startReminderService = () => {
  console.log('⏰ Reminder service started...');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      console.log(`🔍 Checking reminders at ${currentTime}...`);

      // ✅ Only ACTIVE prescriptions
      const prescriptions = await prisma.prescription.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          medicines: {
            include: {
              timings: true
            }
          },
          relation: {
            include: {
              patient: {
                include: {
                  groupMembers: {
                    include: {
                      user: true
                    }
                  }
                }
              },
              doctor: true
            }
          }
        }
      });

      for (const prescription of prescriptions) {
        for (const medicine of prescription.medicines) {
          const matchingTimings = medicine.timings.filter(t => t.time === currentTime);
          
          if (matchingTimings.length > 0) {
            const patient = prescription.relation.patient;
            
            // Send to patient
            const timingStrings = medicine.timings.map(t => t.time);
            await sendEmail(
              patient.email,
              `💊 Medicine Reminder: ${medicine.medicineName}`,
              getPrescriptionEmailTemplate(
                medicine.medicineName,
                medicine.dosage,
                timingStrings,
                medicine.foodRelation
              )
            );

            // Send to guardians (if any)
            if (patient.groupMembers && patient.groupMembers.length > 0) {
              for (const member of patient.groupMembers) {
                if (member.user.role === 'GUARDIAN' && member.user.email) {
                  await sendEmail(
                    member.user.email,
                    `💊 Medicine Reminder: ${medicine.medicineName} (for ${patient.name})`,
                    getPrescriptionEmailTemplate(
                      medicine.medicineName,
                      medicine.dosage,
                      timingStrings,
                      medicine.foodRelation
                    )
                  );
                }
              }
            }

            console.log(`✅ Reminder sent for ${medicine.medicineName} at ${currentTime}`);
          }
        }
      }

      // Check for upcoming appointments (5 minutes before)
      const appointmentTime = new Date(now.getTime() + 5 * 60000);
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledTime: {
            gte: now,
            lte: appointmentTime
          }
        },
        include: {
          patient: true,
          doctor: true
        }
      });

      for (const appointment of appointments) {
        const callLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/call/${appointment.roomId}`;
        await sendEmail(
          appointment.patient.email,
          `📅 Appointment Reminder: Dr. ${appointment.doctor.name}`,
          getAppointmentEmailTemplate(
            appointment.doctor.name,
            appointment.scheduledTime,
            callLink
          )
        );
        console.log(`✅ Appointment reminder sent to ${appointment.patient.email}`);
      }

    } catch (error) {
      console.error('❌ Error in reminder service:', error);
    }
  });
};