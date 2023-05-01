import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import {
  createBookingController,
  getBookingController,
  updateBookingController,
} from '@/controllers/bookings-controller';

const bookingsRouter = Router();

bookingsRouter
  .all('*/', authenticateToken)
  .get('/', getBookingController)
  .post('/', createBookingController)
  .put('/:bookingId', updateBookingController);

export { bookingsRouter };
