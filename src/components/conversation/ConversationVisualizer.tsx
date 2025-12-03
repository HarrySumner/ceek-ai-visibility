import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  cffVariant?: 'minimal' | 'frontloaded' | 'stepwise';
}

interface ConversationVisualizerProps {
  keyword: string;
  modelName: string;
  isPlaying?: boolean;
  speed?: number; // 1-10, higher = faster
  onComplete?: () => void;
}

const CFF_PROMPTS = {
  minimal: "Just answer the question naturally.",
  frontloaded: "Please compare options using a table or checklist format, then provide your recommendation.",
  stepwise: "First define your evaluation criteria, then systematically assess each option before concluding."
};

const SAMPLE_RESPONSES = {
  minimal: "Based on my knowledge, I'd recommend considering Hermès for their exceptional craftsmanship and heritage. Louis Vuitton offers great versatility, while Chanel provides timeless elegance. Each brand has distinct strengths depending on your priorities.",
  frontloaded: `| Brand | Heritage | Craftsmanship | Resale Value | Versatility |
|-------|----------|---------------|--------------|-------------|
| Hermès | ★★★★★ | ★★★★★ | ★★★★★ | ★★★☆☆ |
| Louis Vuitton | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| Gucci | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★☆ |
| Chanel | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★☆ |

**Recommendation:** For investment pieces, Hermès and Chanel lead in resale value.`,
  stepwise: `**Evaluation Criteria:**
1. Brand Heritage & History
2. Craftsmanship Quality
3. Investment/Resale Value
4. Style Versatility

**Assessment:**
- *Hermès*: Founded 1837, hand-stitched leather goods, highest resale (up to 500%), limited versatility
- *Louis Vuitton*: Founded 1854, excellent quality, strong resale, highly versatile
- *Gucci*: Founded 1921, Italian craftsmanship, moderate resale, trend-forward
- *Chanel*: Founded 1910, iconic designs, excellent resale, timeless appeal

**Conclusion:** For pure investment, Hermès. For everyday luxury, Louis Vuitton.`
};

export const ConversationVisualizer: React.FC<ConversationVisualizerProps> = ({
  keyword,
  modelName,
  isPlaying = true,
  speed = 7,
  onComplete
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'minimal' | 'frontloaded' | 'stepwise' | 'complete'>('minimal');
  const containerRef = useRef<HTMLDivElement>(null);

  const typeSpeed = Math.max(5, 50 - (speed * 5)); // Convert speed to ms per char

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const phases: Array<'minimal' | 'frontloaded' | 'stepwise'> = ['minimal', 'frontloaded', 'stepwise'];
    let phaseIndex = 0;
    let cancelled = false;

    const runPhase = async (phase: typeof phases[number]) => {
      if (cancelled) return;
      
      setCurrentPhase(phase);
      
      // Add user message instantly
      const userMessage = phase === 'minimal' 
        ? `${keyword}\n\n${CFF_PROMPTS[phase]}`
        : CFF_PROMPTS[phase];
      
      setMessages(prev => [...prev, { role: 'user', content: userMessage, cffVariant: phase }]);
      scrollToBottom();
      
      await new Promise(r => setTimeout(r, 300));
      if (cancelled) return;
      
      // Type assistant response
      setIsTyping(true);
      const response = SAMPLE_RESPONSES[phase];
      
      for (let i = 0; i <= response.length; i++) {
        if (cancelled) return;
        setCurrentText(response.slice(0, i));
        scrollToBottom();
        await new Promise(r => setTimeout(r, typeSpeed));
      }
      
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: response, cffVariant: phase }]);
      setCurrentText('');
      
      await new Promise(r => setTimeout(r, 500));
    };

    const runConversation = async () => {
      for (const phase of phases) {
        await runPhase(phase);
        phaseIndex++;
      }
      if (!cancelled) {
        setCurrentPhase('complete');
        onComplete?.();
      }
    };

    runConversation();

    return () => {
      cancelled = true;
    };
  }, [isPlaying, keyword, speed, onComplete]);

  const getCffBadgeColor = (variant?: string) => {
    switch (variant) {
      case 'minimal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'frontloaded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'stepwise': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">{modelName}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {(['minimal', 'frontloaded', 'stepwise'] as const).map((phase) => (
            <span
              key={phase}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border transition-all duration-300",
                currentPhase === phase || (currentPhase === 'complete' && phases.indexOf(phase) <= 2)
                  ? getCffBadgeColor(phase)
                  : "bg-muted/30 text-muted-foreground/50 border-transparent"
              )}
            >
              {phase}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-3",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card border border-border"
                )}
              >
                {msg.cffVariant && msg.role === 'user' && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border mb-2 inline-block",
                    msg.role === 'user' ? "bg-white/20 border-white/30" : getCffBadgeColor(msg.cffVariant)
                  )}>
                    {msg.cffVariant} prompt
                  </span>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && currentText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-card border border-border">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full border mb-2 inline-block",
                getCffBadgeColor(currentPhase)
              )}>
                {currentPhase} response
              </span>
              <p className="text-sm whitespace-pre-wrap">{currentText}</p>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-primary ml-1"
              />
            </div>
          </motion.div>
        )}

        {/* Completion indicator */}
        {currentPhase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center py-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Conversation complete • 3 CFF variants analyzed</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const phases = ['minimal', 'frontloaded', 'stepwise'] as const;
