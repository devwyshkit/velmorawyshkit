/**
 * Sentiment Analysis Utility
 * Simple keyword-based sentiment detection
 * No external API needed (simple and fast)
 */

import { Sentiment } from '@/types/reviews';

const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'amazing', 'love', 'perfect', 'quality',
  'fast', 'beautiful', 'wonderful', 'fantastic', 'awesome', 'best',
  'good', 'nice', 'happy', 'satisfied', 'recommend', 'loved'
];

const NEGATIVE_KEYWORDS = [
  'bad', 'poor', 'terrible', 'slow', 'damaged', 'wrong', 'disappointed',
  'awful', 'horrible', 'waste', 'worst', 'hate', 'never', 'refund',
  'broken', 'defective', 'fake', 'fraud', 'scam'
];

/**
 * Analyze sentiment of a single comment
 */
export const analyzeSentiment = (comment: string): Sentiment => {
  if (!comment || comment.trim().length === 0) return 'neutral';

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
 * Calculate overall sentiment from multiple reviews
 */
export const calculateOverallSentiment = (reviews: { comment: string }[]) => {
  if (reviews.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const sentiments = reviews.map(r => analyzeSentiment(r.comment));
  const total = sentiments.length;

  return {
    positive: Math.round((sentiments.filter(s => s === 'positive').length / total) * 100),
    neutral: Math.round((sentiments.filter(s => s === 'neutral').length / total) * 100),
    negative: Math.round((sentiments.filter(s => s === 'negative').length / total) * 100)
  };
};

/**
 * Extract top keywords from reviews
 */
export const extractTopKeywords = (reviews: { comment: string }[], limit = 10): { word: string; count: number }[] => {
  const wordCounts = new Map<string, number>();
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'it', 'this', 'that']);

  reviews.forEach(review => {
    const words = review.comment.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
  });

  return Array.from(wordCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

