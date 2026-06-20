import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In production, forward to the actual backend
    // For now, return a placeholder
    return NextResponse.json({
      base_cost: 0,
      final_bid_price: 0,
      message: "Backend not configured",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process estimate" },
      { status: 500 },
    );
  }
}
