/**
 * Article View Component
 * Feature 12: PROMPT 12 - Help Center
 * Displays help articles with markdown rendering
 * Mobile-first design (320px base)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";

interface HelpArticle {
  id: string;
  title: string;
  content: string; // Markdown
  category: string;
  tags: string[];
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface ArticleViewProps {
  article: HelpArticle;
  onBack?: () => void;
}

/**
 * Help Article Display
 * Renders markdown content with syntax highlighting
 * Includes helpful voting and related articles
 */
export const ArticleView = ({ article, onBack }: ArticleViewProps) => {
  const { toast } = useToast();
  const [voted, setVoted] = useState<'helpful' | 'not_helpful' | null>(null);
  const [submittingVote, setSubmittingVote] = useState(false);

  const handleVote = async (helpful: boolean) => {
    if (voted) return; // Already voted

    setSubmittingVote(true);
    try {
      const { error } = await supabase
        .from('help_articles')
        .update({
          helpful_count: helpful ? article.helpful_count + 1 : article.helpful_count,
          not_helpful_count: !helpful ? article.not_helpful_count + 1 : article.not_helpful_count,
        })
        .eq('id', article.id);

      if (error) throw error;

      setVoted(helpful ? 'helpful' : 'not_helpful');
      toast({
        title: helpful ? "Thanks for your feedback!" : "We'll improve this article",
        description: helpful
          ? "Glad this helped you"
          : "Your feedback helps us create better content",
        duration: 3000,
      });
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setSubmittingVote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={onBack} className="cursor-pointer">
              Help Center
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{article.category}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">{article.title}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Article Content */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="text-2xl">{article.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{article.category}</Badge>
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(article.updated_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })} • {article.views} views
            </p>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Custom styling for markdown elements
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
            }}
          >
            {article.content}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* Helpful Voting */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="font-medium">Was this article helpful?</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={voted === 'helpful' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote(true)}
                disabled={submittingVote || voted !== null}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes
                {article.helpful_count > 0 && (
                  <span className="text-xs">({article.helpful_count})</span>
                )}
              </Button>
              <Button
                variant={voted === 'not_helpful' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote(false)}
                disabled={submittingVote || voted !== null}
                className="gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                No
                {article.not_helpful_count > 0 && (
                  <span className="text-xs">({article.not_helpful_count})</span>
                )}
              </Button>
            </div>

            {/* Contact Support Link */}
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Still need help?
              </p>
              <Button variant="link" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

