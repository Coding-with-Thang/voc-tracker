import { NextResponse } from "next/server";
import prisma from "@/app/utils/prisma";

export async function GET() {
    try {
        const surveys = await prisma.surveys.findMany({
            take: 20
        });

        if (!surveys) {
            return NextResponse.json({ error: "Voice surveys not found" }, { status: 404 });
        }

        return NextResponse.json({ surveys });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" },
            { status: 500 });
    }
}