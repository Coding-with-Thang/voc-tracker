import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin/manager access
    const { userId } = await getAuth(req);
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!admin || (admin.role !== "MANAGER" && admin.role !== "OPERATIONS")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { userId: targetUserId, voiceName } = req.body;

    // Check if voice name is already assigned
    if (voiceName) {
      const existingUser = await prisma.user.findUnique({
        where: { voiceName },
      });

      if (existingUser && existingUser.id !== targetUserId) {
        return res.status(400).json({
          error: `Voice name "${voiceName}" is already assigned to another user`,
        });
      }
    }

    // Update user's voice name
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { voiceName },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
