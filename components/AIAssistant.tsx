'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type Feedback = {
  messageId: string;
  rating: 'positive' | 'negative';
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m here to help you with questions about Tanja Unlimited, our collection, webshop, and website. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<Record<string, boolean>>({});
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, 'positive' | 'negative'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingFeedback((prev) => ({ ...prev, [assistantMessage.id]: true }));
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact us directly at +46 706 332 220.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setPendingFeedback((prev) => ({ ...prev, [errorMessage.id]: true }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    // Mark feedback as submitted immediately for better UX
    setSubmittedFeedback((prev) => ({ ...prev, [messageId]: rating }));
    setPendingFeedback((prev) => ({ ...prev, [messageId]: false }));

    try {
      await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          rating,
          message: message.content,
          userMessage: messages[messages.findIndex((m) => m.id === messageId) - 1]?.content || '',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
      // Revert on error
      setSubmittedFeedback((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      setPendingFeedback((prev) => ({ ...prev, [messageId]: true }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo text-ivory shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[calc(100vh-8rem)] bg-ivory border border-ochre/20 shadow-2xl rounded-lg flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo text-ivory p-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-medium text-lg">AI Assistant</h3>
                <p className="text-xs text-ivory/80">Tanja Unlimited</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-indigo text-ivory'
                        : 'bg-warmIvory text-graphite border border-ochre/20'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ochre/20">
                        {submittedFeedback[message.id] ? (
                          <span className="text-xs text-ochre flex items-center gap-1">
                            {submittedFeedback[message.id] === 'positive' ? (
                              <>
                                <ThumbsUp className="w-4 h-4" />
                                <span>Thank you for your feedback!</span>
                              </>
                            ) : (
                              <>
                                <ThumbsDown className="w-4 h-4" />
                                <span>Thank you for your feedback!</span>
                              </>
                            )}
                          </span>
                        ) : pendingFeedback[message.id] ? (
                          <>
                            <button
                              onClick={() => sendFeedback(message.id, 'positive')}
                              className="flex items-center gap-1 text-xs text-graphite hover:text-ochre transition-colors"
                              aria-label="Thumbs up"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>Helpful</span>
                            </button>
                            <button
                              onClick={() => sendFeedback(message.id, 'negative')}
                              className="flex items-center gap-1 text-xs text-graphite hover:text-ochre transition-colors"
                              aria-label="Thumbs down"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>Not helpful</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-warmIvory border border-ochre/20 rounded-lg p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-ochre" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-ochre/20 p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-2 border border-ochre/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ochre/50 text-graphite bg-cream"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-indigo text-ivory rounded-lg hover:bg-indigo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

