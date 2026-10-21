import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata?: ArgumentMetadata) {
    // Only validate 'body' payloads when applied at method level.
    // Never validate custom param decorators (e.g. @CurrentUser()), params, or queries with body schemas.
    if (metadata && metadata.type !== 'body') {
      return value;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new BadRequestException({
          message: 'Validation failed',
          errors: details,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

