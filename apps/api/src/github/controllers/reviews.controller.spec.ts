import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { PrismaService } from '@mergemind/database';
import { GithubService } from '../services/github.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('@mergemind/database');
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          createCommitComment: jest.fn(),
        },
      },
    })),
  };
});
jest.mock('@octokit/auth-app', () => {
  return {
    createAppAuth: jest.fn(),
  };
});

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let githubService: GithubService;

  const mockPrismaService = {};
  const mockGithubService = {
    applyCommitPatch: jest
      .fn()
      .mockResolvedValue({ success: true, sha: 'mock-sha' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    githubService = module.get<GithubService>(GithubService);
  });

  describe('applyFix validation', () => {
    it('should throw BadRequestException if suggestion has a syntax error (JS/TS)', async () => {
      await expect(
        controller.applyFix({
          pullRequestId: 'pr-id',
          filePath: 'src/main.ts',
          suggestion: 'const x = ; // syntax error',
          lineNumber: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if suggestion has a JSON syntax error', async () => {
      await expect(
        controller.applyFix({
          pullRequestId: 'pr-id',
          filePath: 'config.json',
          suggestion: '{ "invalid": ',
          lineNumber: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply patch successfully if code suggestion syntax is clean (JS/TS)', async () => {
      const result = await controller.applyFix({
        pullRequestId: 'pr-id',
        filePath: 'src/main.ts',
        suggestion: 'const x = 42;\nconsole.log(x);',
        lineNumber: 10,
      });

      expect(result).toEqual({ success: true, sha: 'mock-sha' });
      expect(githubService.applyCommitPatch).toHaveBeenCalledWith(
        'pr-id',
        'src/main.ts',
        'const x = 42;\nconsole.log(x);',
        10,
      );
    });

    it('should apply patch successfully if JSON suggestion syntax is clean', async () => {
      const result = await controller.applyFix({
        pullRequestId: 'pr-id',
        filePath: 'config.json',
        suggestion: '{ "valid": true }',
        lineNumber: 5,
      });

      expect(result).toEqual({ success: true, sha: 'mock-sha' });
    });
  });
});
