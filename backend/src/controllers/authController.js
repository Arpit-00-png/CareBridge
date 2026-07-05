import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || 'PATIENT',
        isVerified: role === 'ADMIN' ? true : false 
      }
    });


    if (role === 'DOCTOR') {
      await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          specialization: req.body.specialization || 'General',
          hospitalName: req.body.hospitalName || 'General Hospital'
        }
      });
    } else if (role === 'PATIENT') {
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          age: req.body.age || 0,
          address: req.body.address || 'Not provided',
          emergencyContact: req.body.emergencyContact || 'Not provided'
        }
      });
    }


    const token = jwt.sign(
      { id: user.id, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};