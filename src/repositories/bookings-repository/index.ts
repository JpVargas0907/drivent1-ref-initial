import { Booking } from '@prisma/client';
import { prisma } from '@/config';

async function getBookingRepository(userId: number) {
  return await prisma.booking.findFirst({
    where: {
      userId: userId,
    },
    include: {
      Room: true,
    },
  });
}

async function createBookingRepository(userId: number, roomId: number): Promise<Booking> {
  return await prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    },
  });
}

async function findRoom(roomId: number) {
  return await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });
}

async function updateBookingRepository(bookingId: number, roomId: number) {
  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      roomId: roomId,
    },
  });
}

const bookingsRepository = {
  getBookingRepository,
  createBookingRepository,
  updateBookingRepository,
  findRoom,
};

export default bookingsRepository;
