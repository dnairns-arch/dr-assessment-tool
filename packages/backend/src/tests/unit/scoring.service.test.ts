import { ScoringService } from '../../services/scoring.service';
import { prisma } from '../../config/database';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    highLevelResponse: {
      findMany: jest.fn()
    }
  }
}));

describe('ScoringService', () => {
  let scoringService: ScoringService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    scoringService = new ScoringService(prisma);
    jest.clearAllMocks();
  });

  describe('calculateHighLevelScore', () => {
    it('should calculate score correctly with all yes responses', async () => {
      // Mock responses - all true
      mockPrisma.highLevelResponse.findMany.mockResolvedValue([
        { id: '1', assessmentId: 'test-id', questionId: 'bcp_001', response: true, notes: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', assessmentId: 'test-id', questionId: 'bcp_002', response: true, notes: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', assessmentId: 'test-id', questionId: 'backup_001', response: true, notes: null, createdAt: new Date(), updatedAt: new Date() }
      ] as any);

      const result = await scoringService.calculateHighLevelScore('test-id');

      expect(result.overallScore).toBe(100);
      expect(result.answeredQuestions).toBe(3);
    });

    it('should calculate score correctly with mixed responses', async () => {
      // Mock responses - 50% true
      mockPrisma.highLevelResponse.findMany.mockResolvedValue([
        { id: '1', assessmentId: 'test-id', questionId: 'bcp_001', response: true, notes: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', assessmentId: 'test-id', questionId: 'bcp_002', response: false, notes: null, createdAt: new Date(), updatedAt: new Date() }
      ] as any);

      const result = await scoringService.calculateHighLevelScore('test-id');

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(100);
      expect(result.answeredQuestions).toBe(2);
    });

    it('should handle no responses', async () => {
      mockPrisma.highLevelResponse.findMany.mockResolvedValue([]);

      const result = await scoringService.calculateHighLevelScore('test-id');

      expect(result.overallScore).toBe(0);
      expect(result.answeredQuestions).toBe(0);
      expect(result.totalQuestions).toBeGreaterThan(0);
    });

    it('should skip null responses', async () => {
      mockPrisma.highLevelResponse.findMany.mockResolvedValue([
        { id: '1', assessmentId: 'test-id', questionId: 'bcp_001', response: true, notes: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', assessmentId: 'test-id', questionId: 'bcp_002', response: null, notes: null, createdAt: new Date(), updatedAt: new Date() }
      ] as any);

      const result = await scoringService.calculateHighLevelScore('test-id');

      expect(result.answeredQuestions).toBe(1); // Only one answered
    });
  });

  describe('getScoreRating', () => {
    it('should return "Excellent" for scores >= 90', () => {
      expect(scoringService.getScoreRating(95)).toBe('Excellent');
      expect(scoringService.getScoreRating(90)).toBe('Excellent');
    });

    it('should return "Good" for scores 80-89', () => {
      expect(scoringService.getScoreRating(85)).toBe('Good');
      expect(scoringService.getScoreRating(80)).toBe('Good');
    });

    it('should return "Fair" for scores 70-79', () => {
      expect(scoringService.getScoreRating(75)).toBe('Fair');
      expect(scoringService.getScoreRating(70)).toBe('Fair');
    });

    it('should return "Needs Improvement" for scores 60-69', () => {
      expect(scoringService.getScoreRating(65)).toBe('Needs Improvement');
      expect(scoringService.getScoreRating(60)).toBe('Needs Improvement');
    });

    it('should return "Poor" for scores < 60', () => {
      expect(scoringService.getScoreRating(50)).toBe('Poor');
      expect(scoringService.getScoreRating(0)).toBe('Poor');
    });
  });

  describe('getAssessmentProgress', () => {
    it('should calculate progress percentage correctly', async () => {
      // 25 out of 50+ questions answered
      mockPrisma.highLevelResponse.findMany.mockResolvedValue(
        Array(25).fill(null).map((_, i) => ({
          id: `${i}`,
          assessmentId: 'test-id',
          questionId: `q_${i}`,
          response: true,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })) as any
      );

      const result = await scoringService.getAssessmentProgress('test-id');

      expect(result.answeredCount).toBe(25);
      expect(result.totalCount).toBeGreaterThan(25);
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(100);
    });

    it('should return 100% for all questions answered', async () => {
      // Mock all 50+ questions as answered
      const allQuestions = Array(52).fill(null).map((_, i) => ({
        id: `${i}`,
        assessmentId: 'test-id',
        questionId: `q_${i}`,
        response: i % 2 === 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      mockPrisma.highLevelResponse.findMany.mockResolvedValue(allQuestions as any);

      const result = await scoringService.getAssessmentProgress('test-id');

      expect(result.percentage).toBe(100);
    });
  });
});
