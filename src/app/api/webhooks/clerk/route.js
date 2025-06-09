import { headers } from "next/headers";
import { Webhook } from "svix";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const webhookSecret = process.env.WEBHOOK_SECRET;

async function handler(req) {
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there's no signature header, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response(
      JSON.stringify({ error: "Missing required Svix headers" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Get the body
  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response(
      JSON.stringify({ error: "Error verifying webhook signature" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    // Create user in your database
    try {
      await prisma.user.create({
        data: {
          clerkId: evt.data.id,
          username:
            evt.data.username || evt.data.email_addresses[0].email_address,
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          role: evt.data.public_metadata?.role || "AGENT",
          voiceName: "", // Default empty voice name
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response(JSON.stringify({ error: "Error creating user" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  if (eventType === "user.updated") {
    // Update user in your database
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: evt.data.id },
      });

      if (!user) {
        // Create user if they don't exist
        await prisma.user.create({
          data: {
            clerkId: evt.data.id,
            username:
              evt.data.username || evt.data.email_addresses[0].email_address,
            firstName: evt.data.first_name,
            lastName: evt.data.last_name,
            role: evt.data.public_metadata?.role || "AGENT",
            voiceName: "", // Default empty voice name
            createdAt: new Date(),
          },
        });
      } else {
        // Update existing user
        await prisma.user.update({
          where: { clerkId: evt.data.id },
          data: {
            username:
              evt.data.username || evt.data.email_addresses[0].email_address,
            firstName: evt.data.first_name,
            lastName: evt.data.last_name,
            role: evt.data.public_metadata?.role || "AGENT",
          },
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return new Response(JSON.stringify({ error: "Error updating user" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  if (eventType === "user.deleted") {
    // Delete user from your database
    try {
      await prisma.user.delete({
        where: { clerkId: evt.data.id },
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return new Response(JSON.stringify({ error: "Error deleting user" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export { handler as POST };
