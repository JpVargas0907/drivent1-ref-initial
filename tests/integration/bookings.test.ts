import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { TicketStatus } from '@prisma/client';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createUser,
  createBooking,
  createHotel,
  createRoomWithHotelId,
  createRoomWithHotelIdWithoutCapacity,
  createEnrollmentWithAddress,
  createTicketTypeWithHotel,
  createTicket,
} from '../factories';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 200 and booking information if user has a booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking(user.id, room.id);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
    });

    it('should respond with status 404 if user does not have a booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 200 and bookingId if roomId exists and has availability and user has a booking', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toHaveProperty('bookingId');
  });

  it('should respond with status 404 if roomId does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: 123 });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 403 if roomId does not have availability', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelIdWithoutCapacity(hotel.id);
    await createBooking(user.id, room.id);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe('PUT /booking/:bookingId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const user = await createUser();
    const hotel = await createHotel();
    const room = await createRoomWithHotelIdWithoutCapacity(hotel.id);
    const booking = await createBooking(user.id, room.id);
    const response = await server.put(`/booking/${booking.id}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const user = await createUser();
    const hotel = await createHotel();
    const room = await createRoomWithHotelIdWithoutCapacity(hotel.id);
    const booking = await createBooking(user.id, room.id);

    const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 404 if booking does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelIdWithoutCapacity(hotel.id);

    const response = await server
      .put('/booking/10000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 404 if room does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(user.id, room.id);
    const nonExistentRoomId = 10000000;

    const response = await server
      .put(`/booking/${booking.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: nonExistentRoomId });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 403 if room is already booked', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const anotherUser = await createUser();
    const hotel = await createHotel();
    const room = await createRoomWithHotelIdWithoutCapacity(hotel.id);
    const anotherBooking = await createBooking(anotherUser.id, room.id);

    const response = await server
      .put(`/booking/${anotherBooking.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it('should respond with status 200 and bookingId if roomId is updated', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const newRoom = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(user.id, room.id);

    const response = await server
      .put(`/booking/${booking.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: newRoom.id });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toHaveProperty('bookingId');
  });
});
