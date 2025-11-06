import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMap } from "@/routes";
import { Send, Paperclip, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeGetItem, safeSetItem } from "@/lib/mock-storage";
import { cn } from "@/lib/utils";

/**
 * SupportChat - Swiggy 2025 Pattern
 * 
 * In-app chat with support:
 * - Order context
 * - File attachments
 * - Message history
 */
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  attachments?: Array<{ id: string; name: string; url: string }>;
}

export const SupportChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load chat history
    loadChatHistory();
    // Auto-scroll to bottom
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem('wyshkit_support_chat');
      if (stored) {
        const history = JSON.parse(stored);
        setMessages(history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })));
      } else {
        // Initial welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          text: 'Hi! How can I help you today?',
          sender: 'support',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const saveChatHistory = (newMessages: ChatMessage[]) => {
    try {
      localStorage.setItem('wyshkit_support_chat', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setInputText('');

    // Simulate support response
    setIsTyping(true);
    setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        text: 'Thank you for your message. Our support team will get back to you shortly. In the meantime, is there anything specific about your order you\'d like help with?',
        sender: 'support',
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, supportMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      setIsTyping(false);
    }, 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Mock file upload
    const fileUrl = URL.createObjectURL(file);
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: `Sent: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      attachments: [{
        id: `file_${Date.now()}`,
        name: file.name,
        url: fileUrl,
      }],
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);

    toast({
      title: 'File uploaded',
      description: 'Your file has been sent to support.',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <Helmet>
        <title>Support Chat | Wyshkit</title>
        <meta name="description" content="Chat with our support team" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px] flex flex-col">
        <CustomerMobileHeader title="Support Chat" showBackButton />

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.sender === 'user'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}>
                <p className="text-sm">{message.text}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline flex items-center gap-1"
                      >
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
                <p className={cn(
                  "text-xs mt-1",
                  message.sender === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start gap-2">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4 md:px-6 lg:px-8">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="h-10 w-10"
              disabled={!inputText.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <CustomerBottomNav />
      </div>
    </>
  );
};


