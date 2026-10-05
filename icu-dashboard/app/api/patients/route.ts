import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        antibiotics: {
          include: { linkedMicrobiologies: true, therapyReviews: true }
        },
        microbiologies: {
          include: { antibiogram: true, linkedAntibiotics: true }
        },
        episodes: true,
        patientDevices: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const patient = await prisma.patient.create({
      data: {
        ...data,
      }
    });
    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
