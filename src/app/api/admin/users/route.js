import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Verify admin/manager access
    const { userId } = await getAuth(req);
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!admin || (admin.role !== "MANAGER" && admin.role !== "OPERATIONS")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        voiceName: true,
        role: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
