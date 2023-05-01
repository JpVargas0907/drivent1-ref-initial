import { ApplicationError } from '@/protocols';

export function noCapacityError(): ApplicationError {
  return {
    name: 'NoCapacityError',
    message: 'No capacity for this room!',
  };
}
