/**
 * Sentiment Analysis
 * Feature 4: PROMPT 9
 * Simple keyword-based sentiment detection
 */

import type { ReviewSentiment, Review } from '@/types/reviews';

const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'amazing', 'love', 'perfect', 'quality', 'fast',
  'best', 'wonderful', 'fantastic', 'awesome', 'beautiful', 'recommend',
  'happy', 'satisfied', 'delighted', 'impressed', 'outstanding'
];

const NEGATIVE_KEYWORDS = [
  'bad', 'poor', 'terrible', 'slow', 'damaged', 'wrong', 'disappointed',
  'worst', 'horrible', 'awful', 'delayed', 'defective', 'broken',
  'unhappy', 'unsatisfied', 'misleading', 'fraud', 'waste'
];

/**
 * Analyze sentiment of a single review comment
 */
export const analyzeSentiment = (comment: string): ReviewSentiment => {
  const lowerComment = comment.toLowerCase();
  
  let posCount = 0;
  let negCount = 0;

  POSITIVE_KEYWORDS.forEach(word => {
    if (lowerComment.includes(word)) posCount++;
  });

  NEGATIVE_KEYWORDS.forEach(word => {
    if (lowerComment.includes(word)) negCount++;
  });

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
};

/**
 * Calculate overall sentiment distribution for multiple reviews
 */
export const calculateSentimentDistribution = (reviews: Review[]): {
  positive: number;
  neutral: number;
  negative: number;
} => {
  if (reviews.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const sentiments = reviews.map(r => analyzeSentiment(r.comment));
  
  const positive = sentiments.filter(s => s === 'positive').length;
  const neutral = sentiments.filter(s => s === 'neutral').length;
  const negative = sentiments.filter(s => s === 'negative').length;

  return {
    positive: (positive / reviews.length) * 100,
    neutral: (neutral / reviews.length) * 100,
    negative: (negative / reviews.length) * 100,
  };
};

/**
 * Extract top keywords from reviews
 */
export const extractTopKeywords = (reviews: Review[], limit: number = 10): Array<{
  word: string;
  count: number;
}> => {
  const wordCount = new Map<string, number>();
  
  // Combine all review comments
  const allText = reviews.map(r => r.comment).join(' ').toLowerCase();
  
  // Remove punctuation and split into words
  const words = allText.replace(/[^\w\s]/g, '').split(/\s+/);
  
  // Count meaningful words (>3 chars, not common words)
  const stopWords = ['the', 'and', 'for', 'with', 'this', 'that', 'was', 'are', 'have'];
  
  words.forEach(word => {
    if (word.length > 3 && !stopWords.includes(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });

  // Sort by count and return top N
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

/**
 * Get common complaints from negative reviews
 */
export const getCommonComplaints = (reviews: Review[]): Array<{
  issue: string;
  count: number;
}> => {
  const negativeReviews = reviews.filter(r => 
    analyzeSentiment(r.comment) === 'negative' || r.rating <= 2
  );

  const issues = new Map<string, number>();
  
  negativeReviews.forEach(review => {
    const comment = review.comment.toLowerCase();
    
    if (comment.includes('delay') || comment.includes('late') || comment.includes('slow')) {
      issues.set('Delayed delivery', (issues.get('Delayed delivery') || 0) + 1);
    }
    if (comment.includes('damage') || comment.includes('broken')) {
      issues.set('Damaged product', (issues.get('Damaged product') || 0) + 1);
    }
    if (comment.includes('wrong') || comment.includes('incorrect')) {
      issues.set('Wrong item sent', (issues.get('Wrong item sent') || 0) + 1);
    }
    if (comment.includes('package') || comment.includes('packaging')) {
      issues.set('Packaging issues', (issues.get('Packaging issues') || 0) + 1);
    }
    if (comment.includes('quality')) {
      issues.set('Quality concerns', (issues.get('Quality concerns') || 0) + 1);
    }
  });

  return Array.from(issues.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([issue, count]) => ({ issue, count }));
};

