import { ApplicationError } from '@/protocols';

export function invalidCepError(): ApplicationError {
  return {
    name: 'InvalidCepError',
    message: 'This cep format is invalid!',
  };
}
