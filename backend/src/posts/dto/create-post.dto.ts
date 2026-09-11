import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PostType } from '../entities/post-type.enum.js';
import { IsFutureDate } from '../../common/validators/is-future-date.validator.js';

export class CreatePostDto {
  @IsEnum(PostType, { message: 'Type must be either OFFERING or LOOKING' })
  type!: PostType;

  @IsString()
  @MinLength(2, { message: 'Origin must be at least 2 characters long' })
  @MaxLength(160, { message: 'Origin must be shorter than 160 characters' })
  origin!: string;

  @IsString()
  @MinLength(2, { message: 'Destination must be at least 2 characters long' })
  @MaxLength(160, { message: 'Destination must be shorter than 160 characters' })
  destination!: string;

  @IsISO8601({}, { message: 'Departure date/time must be a valid date' })
  @IsFutureDate()
  departureAt!: string;

  @IsInt({ message: 'Seats available must be a whole number' })
  @Min(1, { message: 'At least 1 seat must be available' })
  @Max(8, { message: 'Seats available cannot exceed 8' })
  seatsAvailable!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must be shorter than 500 characters' })
  notes?: string;
}
