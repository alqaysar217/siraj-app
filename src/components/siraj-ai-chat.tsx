'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  User, 
  Minimize2, 
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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
    const unsubscribe = onSnapshot(doc(db, "settings", "ai_config"), (snap) => {
      if (snap.exists()) setConfig(snap.data());
      else setConfig({ visible: true, enabled: true, welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟" });
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  if (!config || config.visible === false) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', content: [{ text: input }] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await sirajAiChat({
        message: currentInput,
        history: messages,
        knowledge: config.knowledgeBase
      });
      const aiMsg: Message = { role: 'model', content: [{ text: response.text }] };
      setMessages([...newMessages, aiMsg]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', content: [{ text: 'عذراً، واجهت مشكلة في الاتصال.' }] }]);
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
      {isOpen && (
        <Card className={cn(
          "mb-4 w-[95vw] sm:w-[400px] border border-primary/10 shadow-2xl rounded-3xl overflow-hidden bg-white flex flex-col transition-all duration-300 ease-in-out",
          "fixed inset-0 sm:relative sm:inset-auto", // ملء الشاشة على الجوال
          isMinimized ? "h-[64px]" : "h-[100dvh] sm:h-[600px] sm:max-h-[85vh]"
        )}>
          {/* رأس النافذة */}
          <div className="bg-primary p-4 md:p-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                <Image src="/SirajAi.png" alt="AI" width={40} height={40} className="object-cover" />
              </div>
              <div className="text-right">
                <p className="font-black text-sm md:text-base leading-none">سراج AI</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                   <span className="text-[10px] text-white/70 font-bold">مستعد لخدمتك</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-9 w-9 hover:bg-white/10 text-white hidden sm:flex">
                 {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
               </Button>
               <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-9 w-9 hover:bg-white/10 text-white">
                 <X className="w-5 h-5" />
               </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/50" ref={scrollRef}>
                <div className="space-y-5">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm overflow-hidden",
                        msg.role === 'user' ? "bg-white border-primary/10" : "bg-white border-secondary/10"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Image src="/SirajAi.png" alt="AI" width={32} height={32} />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm md:text-base shadow-sm max-w-[85%] leading-relaxed",
                        msg.role === 'user' ? "bg-white text-slate-800 rounded-tr-none border border-primary/5" : "bg-primary text-white rounded-tl-none"
                      )}>
                        {msg.content[0].text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-3 flex-row-reverse">
                       <div className="w-8 h-8 rounded-xl bg-white border border-secondary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          <Image src="/SirajAi.png" alt="AI" width={32} height={32} />
                       </div>
                       <div className="bg-primary/10 p-4 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 md:p-6 bg-white border-t border-border/40 shrink-0">
                {!config.enabled ? (
                  <div className="text-center py-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-black text-amber-700">خدمة المساعد متوقفة للصيانة حالياً.</p>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2">
                    <Input
                      className="flex-1 bg-slate-100/50 border-none rounded-2xl h-12 md:h-14 pr-4 focus-visible:ring-2 focus-visible:ring-primary/10 text-sm md:text-base"
                      placeholder="كيف يمكنني مساعدتك يا بطل؟"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="h-12 w-12 md:h-14 md:w-14 p-0 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg active:scale-95 transition-transform"
                    >
                      <Send className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
                    </Button>
                  </div>
                )}
                <div className="h-safe-area-bottom sm:hidden" /> {/* مساحة أمان للجوال */}
              </div>
            </>
          )}
        </Card>
      )}

      {!isOpen && (
        <button
          onClick={toggleChat}
          className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-500 hover:scale-110 active:scale-90 hover:rotate-6 flex items-center justify-center group"
        >
          <Image src="/SirajAi.png" alt="Siraj AI" width={80} height={80} className="object-cover group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}
    </div>
  );
}
