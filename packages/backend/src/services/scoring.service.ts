import { prisma } from '../config/database';
import { HIGH_LEVEL_QUESTIONS, CATEGORY_WEIGHTS } from '../config/highLevelQuestions';

export interface ScoreResult {
  overallScore: number;
  categoryScores: Record<string, number>;
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
}

export interface ScoreRating {
  label: string;
  color: string;
  description: string;
}

export class ScoringService {
  /**
   * Calculate high-level assessment score
   */
  async calculateHighLevelScore(assessmentId: string): Promise<ScoreResult> {
    // Get all responses for this assessment
    const responses = await prisma.highLevelResponse.findMany({
      where: { assessmentId }
    });

    let totalScore = 0;
    let answeredWeight = 0;
    const totalQuestions = HIGH_LEVEL_QUESTIONS.length;
    let answeredQuestions = 0;

    // Calculate overall score
    for (const response of responses) {
      if (response.response !== null) {
        answeredQuestions++;
        const question = HIGH_LEVEL_QUESTIONS.find((q) => q.id === response.questionId);
        if (question) {
          answeredWeight += question.weight;
          if (response.response === true) {
            totalScore += question.weight;
          }
        }
      }
    }

    // Normalize to 100-point scale
    const overallScore = answeredWeight > 0 ? (totalScore / answeredWeight) * 100 : 0;

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(responses);

    // Calculate completion percentage
    const completionPercentage = (answeredQuestions / totalQuestions) * 100;

    // Update assessment with overall score
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { overallScore }
    });

    return {
      overallScore,
      categoryScores,
      totalQuestions,
      answeredQuestions,
      completionPercentage
    };
  }

  /**
   * Calculate scores per category
   */
  private calculateCategoryScores(responses: any[]): Record<string, number> {
    const categoryMap = new Map<
      string,
      { totalWeight: number; earnedWeight: number; answeredWeight: number }
    >();

    // Initialize all categories
    for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
      categoryMap.set(category, { totalWeight: weight, earnedWeight: 0, answeredWeight: 0 });
    }

    // Calculate earned weight per category
    for (const response of responses) {
      const question = HIGH_LEVEL_QUESTIONS.find((q) => q.id === response.questionId);
      if (!question) continue;

      const categoryData = categoryMap.get(question.category);
      if (!categoryData) continue;

      if (response.response !== null) {
        categoryData.answeredWeight += question.weight;
        if (response.response === true) {
          categoryData.earnedWeight += question.weight;
        }
      }
    }

    // Normalize to 100-point scale per category
    const categoryScores: Record<string, number> = {};
    for (const [category, data] of categoryMap) {
      if (data.answeredWeight > 0) {
        categoryScores[category] = (data.earnedWeight / data.answeredWeight) * 100;
      } else {
        categoryScores[category] = 0;
      }
    }

    return categoryScores;
  }

  /**
   * Get score rating based on overall score
   */
  getScoreRating(score: number): ScoreRating {
    if (score >= 90) {
      return {
        label: 'Excellent',
        color: '#28a745',
        description: 'Your DR posture is exceptional. Continue maintaining these high standards.'
      };
    } else if (score >= 75) {
      return {
        label: 'Good',
        color: '#5cb85c',
        description: 'Your DR posture is solid with room for targeted improvements.'
      };
    } else if (score >= 60) {
      return {
        label: 'Fair',
        color: '#ffc107',
        description: 'Your DR posture has significant gaps that should be addressed.'
      };
    } else if (score >= 40) {
      return {
        label: 'Needs Improvement',
        color: '#fd7e14',
        description: 'Your DR posture has major deficiencies requiring immediate attention.'
      };
    } else {
      return {
        label: 'Critical',
        color: '#dc3545',
        description: 'Your DR posture is severely deficient and poses significant business risk.'
      };
    }
  }

  /**
   * Get assessment progress
   */
  async getAssessmentProgress(assessmentId: string): Promise<{
    totalQuestions: number;
    answeredQuestions: number;
    completionPercentage: number;
    categoriesCompleted: number;
    totalCategories: number;
  }> {
    const responses = await prisma.highLevelResponse.findMany({
      where: { assessmentId }
    });

    const totalQuestions = HIGH_LEVEL_QUESTIONS.length;
    const answeredQuestions = responses.filter((r) => r.response !== null).length;
    const completionPercentage = (answeredQuestions / totalQuestions) * 100;

    // Calculate category completion
    const categoryCompletion = new Map<string, { total: number; answered: number }>();
    for (const question of HIGH_LEVEL_QUESTIONS) {
      if (!categoryCompletion.has(question.category)) {
        categoryCompletion.set(question.category, { total: 0, answered: 0 });
      }
      const cat = categoryCompletion.get(question.category)!;
      cat.total++;

      const response = responses.find((r) => r.questionId === question.id);
      if (response && response.response !== null) {
        cat.answered++;
      }
    }

    const categoriesCompleted = Array.from(categoryCompletion.values()).filter(
      (c) => c.answered === c.total
    ).length;
    const totalCategories = categoryCompletion.size;

    return {
      totalQuestions,
      answeredQuestions,
      completionPercentage,
      categoriesCompleted,
      totalCategories
    };
  }
}
