import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/lib/models/Apartment';
import { apartmentSchema } from '@/lib/validations';

export async function GET() {
  try {
    await dbConnect();

    // Fetch active apartments with aggregated stats
    const apartmentsWithStats = await Apartment.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'reservations',
          let: { apartmentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$apartment', '$$apartmentId'] },
                    { $eq: ['$isActive', true] },
                    { $ne: ['$status', 'cancelled'] },
                  ],
                },
              },
            },
          ],
          as: 'reservations',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          reservationCount: { $size: '$reservations' },
          totalValue: { $sum: '$reservations.totalValue' },
          reservations: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json(apartmentsWithStats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apartments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = apartmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const newApartment = await Apartment.create(validation.data);
    return NextResponse.json(newApartment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create apartment' },
      { status: 500 }
    );
  }
}
