import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class ApplyFixDto {
  @IsUUID()
  @IsNotEmpty()
  pullRequestId: string;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsInt()
  @Min(1)
  startLine: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  endLine?: number;

  @IsString()
  @IsNotEmpty()
  suggestion: string;

  @IsOptional()
  @IsUUID()
  commentId?: string;
}
