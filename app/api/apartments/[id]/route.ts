import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/lib/models/Apartment';
import Reservation from '@/lib/models/Reservation';
import { apartmentSchema } from '@/lib/validations';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedApartment = await Apartment.findByIdAndUpdate(
      params.id,
      { name: validation.data.name },
      { new: true }
    );

    if (!updatedApartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    return NextResponse.json(updatedApartment);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update apartment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Check if apartment has active reservations
    const activeReservationsCount = await Reservation.countDocuments({
      apartment: params.id,
      isActive: true,
      status: { $in: ['confirmed', 'completed'] },
    });

    const apartment = await Apartment.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Apartment soft-deleted successfully',
      warning:
        activeReservationsCount > 0
          ? `Apartment has ${activeReservationsCount} active or historical reservation(s). Data has been soft-deleted.`
          : undefined,
      apartment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete apartment' },
      { status: 500 }
    );
  }
}
