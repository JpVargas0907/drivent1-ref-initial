import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '@/services/bookings-service';

export async function getBookingController(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const bookingIdWithRoom = await bookingService.getBookingService(userId);

    res.status(httpStatus.OK).send(bookingIdWithRoom);
  } catch (error) {
    res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function createBookingController(req: AuthenticatedRequest, res: Response) {
  try {
    const { roomId } = req.body;
    const userId = req.userId; // assume que você já tem o usuário autenticado na requisição
    const bookingId = await bookingService.createBookingService(userId, roomId);
    res.sendStatus(httpStatus.OK).json({ bookingId });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function updateBookingController(req: AuthenticatedRequest, res: Response) {
  const { bookingId } = req.params;
  const { roomId } = req.body;

  try {
    const updatedBooking = await bookingService.createBookingService(parseInt(bookingId), parseInt(roomId));
    return res.status(200).json(updatedBooking);
  } catch (error) {
    res.send(error.message);
  }
}
