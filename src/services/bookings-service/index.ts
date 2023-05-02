import { request } from '@/utils/request';
import { notFoundError } from '@/errors';
import { noCapacityError } from '@/errors/no-capacity-error';
import bookingsRepository from '@/repositories/bookings-repository';
import ticketsRepository from '@/repositories/tickets-repository';

async function getBookingService(userId: number) {
  const result = await bookingsRepository.getBookingRepository(userId);

  if (result === null) {
    throw notFoundError();
  } else {
    return result;
  }
}

async function createBookingService(userId: number, roomId: number): Promise<any> {
  const room = await bookingsRepository.findRoom(roomId);

  if (!room) {
    throw notFoundError();
  }

  if (room.capacity === 0) {
    throw noCapacityError();
  }

  const ticket = await ticketsRepository.findValidTicketForBooking(userId);

  if (!ticket) {
    throw noCapacityError();
  }

  // Cria a reserva
  const bookingId = await bookingsRepository.createBookingRepository(userId, roomId);
  return bookingId.id;
}

async function updateBookingService(bookingId: number, roomId: number, userId: number) {
  const booking = await bookingsRepository.getBookingRepository(userId);

  if (!booking) {
    throw notFoundError();
  }

  const room = await bookingsRepository.findRoom(roomId);
  if (!room) {
    throw notFoundError();
  }

  if (room.capacity === 0) {
    throw noCapacityError();
  }

  const updatedBooking = await bookingsRepository.updateBookingRepository(bookingId, roomId, userId);
  return updatedBooking.id;
}

const bookingsService = {
  getBookingService,
  createBookingService,
  updateBookingService,
};

export default bookingsService;
