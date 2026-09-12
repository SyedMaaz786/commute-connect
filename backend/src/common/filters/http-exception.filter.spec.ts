import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  type ArgumentsHost,
} from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter.js';

function respond(error: unknown) {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/api/posts' }),
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(error, host);
  return response;
}
describe('AllExceptionsFilter', () => {
  afterEach(() => vi.restoreAllMocks());
  it('keeps actionable validation errors and their HTTP status', () => {
    const response = respond(
      new BadRequestException(['Origin is required', 'Seats must be positive']),
    );
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['Origin is required', 'Seats must be positive'],
      }),
    );
  });
  it.each([
    new Error('private database connection details'),
    new InternalServerErrorException('private service details'),
  ])('logs server failures and returns a safe message', (error) => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const response = respond(error);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Something went wrong. Please try again.',
      }),
    );
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('private');
  });
});
