import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Broker from '@/lib/models/Broker';
import { brokerSchema } from '@/lib/validations';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = brokerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updated = await Broker.findByIdAndUpdate(
      params.id,
      {
        name: validation.data.name.trim(),
        defaultPercentage: validation.data.defaultPercentage,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update broker' },
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

    const deleted = await Broker.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Broker soft-deleted successfully', deleted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete broker' },
      { status: 500 }
    );
  }
}
