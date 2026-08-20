'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  MessageSquare, 
  Bot, 
  User, 
  Sparkles,
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase/provider';
import { doc, onSnapshot } from 'firebase/firestore';
import { sirajAiChat } from '@/ai/flows/siraj-ai-chat';
import Image from 'next/image';

type Message = {
  role: 'user' | 'model';
  content: { text: string }[];
};

export default function SirajAiChat() {
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, "settings", "ai_config"), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
  }, [db]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!config || !config.visible) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', content: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sirajAiChat({
        message: input,
        history: messages,
        knowledge: config.knowledgeBase
      });

      const aiMsg: Message = { role: 'model', content: [{ text: response.text }] };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: [{ text: 'عذراً، حدث خطأ ما في معالجة طلبك.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen && messages.length === 0) {
      setMessages([{ role: 'model', content: [{ text: config.welcomeMessage }] }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end" dir="rtl">
      {/* نافذة الدردشة */}
      {isOpen && (
        <Card className={cn(
          "mb-4 w-[320px] md:w-[400px] border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-10",
          isMinimized ? "h-[64px]" : "h-[500px] md:h-[600px]"
        )}>
          {/* رأس النافذة */}
          <div className="bg-primary p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <Image src="/SirajAi.png" alt="AI" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <p className="font-black text-sm leading-none">سراج AI</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold opacity-70">متصل الآن</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 hover:bg-white/10 text-white">
                 {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
               </Button>
               <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8 hover:bg-white/10 text-white">
                 <X className="w-5 h-5" />
               </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* منطقة الرسائل */}
              <ScrollArea className="flex-1 p-4 h-[calc(100%-128px)]" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex items-start gap-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                        msg.role === 'user' ? "bg-muted border-border" : "bg-primary/5 border-primary/10"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-[1.2rem] text-xs md:text-sm font-medium leading-relaxed max-w-[80%]",
                        msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-muted/50 text-primary rounded-tl-none"
                      )}>
                        {msg.content[0].text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center"><Bot className="w-4 h-4 text-primary animate-bounce" /></div>
                       <div className="bg-muted/30 p-3 rounded-2xl rounded-tl-none"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* منطقة الإدخال */}
              <div className="p-4 bg-muted/20 border-t border-border/50">
                {!config.enabled ? (
                  <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-700">سيتوفر المساعد الذكي قريباً جداً ⏳</p>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full bg-white border border-primary/10 rounded-2xl h-12 pr-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                      placeholder="اكتب سؤالك هنا..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-center gap-1 opacity-30">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Siraj Intelligence</span>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* زر التفعيل العائم */}
      <button
        onClick={toggleChat}
        className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-[2.5rem] bg-white luxury-shadow border-4 border-white overflow-hidden transition-all duration-500 hover:scale-110 active:scale-95 group relative",
          isOpen && "translate-y-24 opacity-0 scale-50"
        )}
      >
        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity" />
        <Image src="/SirajAi.png" alt="Siraj AI" fill className="object-cover p-2" />
      </button>
    </div>
  );
}
