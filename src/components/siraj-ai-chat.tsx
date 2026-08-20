'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
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
    // استماع مباشر للتغييرات في الإعدادات من لوحة التحكم
    const unsubscribe = onSnapshot(doc(db, "settings", "ai_config"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      }
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  // إذا كانت الإعدادات غير موجودة أو خيار "مرئي" غير مفعل، لا تظهر شيئاً
  if (!config || config.visible === false) return null;

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
      setMessages([{ role: 'model', content: [{ text: config.welcomeMessage || "مرحباً بك في سراج!" }] }]);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start" dir="rtl">
      {/* نافذة الدردشة */}
      {isOpen && (
        <Card className={cn(
          "mb-4 w-[85vw] sm:w-[350px] border border-primary/10 shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl transition-all duration-300 origin-bottom-left",
          isMinimized ? "h-[64px]" : "h-[500px]"
        )}>
          {/* رأس النافذة */}
          <div className="bg-primary p-4 flex items-center justify-between text-white cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <Image src="/SirajAi.png" alt="AI" width={28} height={28} className="object-contain" />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm leading-none">سراج AI</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] opacity-70">متصل الآن</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="h-8 w-8 hover:bg-white/10 text-white">
                 {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
               </Button>
               <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="h-8 w-8 hover:bg-white/10 text-white">
                 <X className="w-5 h-5" />
               </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* منطقة الرسائل */}
              <ScrollArea className="flex-1 p-4 h-[370px]" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex items-start gap-2", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                        msg.role === 'user' ? "bg-primary/5 border-primary/10" : "bg-secondary/10 border-secondary/10"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-secondary" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-xs font-medium leading-relaxed max-w-[80%]",
                        msg.role === 'user' ? "bg-muted/50 text-primary rounded-tr-none" : "bg-primary text-white rounded-tl-none"
                      )}>
                        {msg.content[0].text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 flex-row-reverse">
                       <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center"><Bot className="w-4 h-4 text-secondary animate-bounce" /></div>
                       <div className="bg-primary text-white p-3 rounded-2xl rounded-tl-none"><Loader2 className="w-4 h-4 animate-spin" /></div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* منطقة الإدخال */}
              <div className="p-4 bg-muted/20 border-t border-border/50">
                {!config.enabled ? (
                  <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-700">سأكون متاحاً للرد قريباً جداً ⏳</p>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full bg-white border border-primary/10 rounded-xl h-11 pr-4 pl-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      placeholder="كيف يمكنني مساعدتك؟"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary text-white rounded-lg flex items-center justify-center transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-center gap-1 opacity-20">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Siraj AI Assistant</span>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* زر التفعيل العائم */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
        >
          <Image src="/SirajAi.png" alt="Siraj AI" width={64} height={64} className="object-cover" />
        </button>
      )}
    </div>
  );
}
