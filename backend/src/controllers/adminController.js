import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getUnverifiedUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: role,
        isVerified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
    res.json({ message: 'User verified successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};