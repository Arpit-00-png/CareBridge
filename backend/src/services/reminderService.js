import cron from 'node-cron';
import pkg from '@prisma/client';
import nodemailer from 'nodemailer';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const startReminderService = () => {
  console.log('⏰ Reminder service started');
  
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const prescriptions = await prisma.prescription.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          medicines: {
            include: {
              timings: {
                where: {
                  time: currentTime
                }
              }
            }
          },
          relation: {
            include: {
              patient: true,
              doctor: true
            }
          }
        }
      });

      for (const prescription of prescriptions) {
        for (const medicine of prescription.medicines) {
          if (medicine.timings.length > 0) {
            // Send reminder to patient
            await sendEmail(
              prescription.relation.patient.email,
              `💊 Medicine Reminder: ${medicine.medicineName}`,
              `Time to take ${medicine.medicineName} (${medicine.dosage}). 
               ${prescription.instructions || ''}`
            );
            
          }
        }
      }
    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  });
};

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
    console.log(`✅ Reminder sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};