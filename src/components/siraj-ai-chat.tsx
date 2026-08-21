'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  User, 
  Minimize2, 
  Maximize2
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
      else setConfig({ visible: true, enabled: true, welcomeMessage: "مرحباً بك في سراج! أنا مساعدك الذكي." });
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isLoading]);

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
      setMessages([...newMessages, { role: 'model', content: [{ text: 'عذراً، واجهت مشكلة في الاتصال بالعقل الاصطناعي.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen && messages.length === 0) {
      setMessages([{ role: 'model', content: [{ text: config.welcomeMessage || "مرحباً بك في سراج! أنا مساعدك الذكي، كيف أخدمك اليوم؟" }] }]);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" dir="rtl">
      {isOpen && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-auto bg-black/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:p-6 sm:items-start sm:justify-end">
          <Card className={cn(
            "w-full bg-white flex flex-col transition-all duration-500 ease-in-out luxury-shadow border-none overflow-hidden",
            "sm:w-[400px] sm:max-w-[90vw] sm:rounded-[2rem] sm:border sm:border-primary/5",
            isMinimized 
              ? "h-[40vh] sm:h-[350px]" 
              : "h-[100dvh] sm:h-[75vh] sm:max-h-[700px]"
          )}>
            {/* Header - Compact Version */}
            <div className="bg-primary p-3 md:p-4 flex items-center justify-between text-white shrink-0 sm:rounded-t-[2rem]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                  <Image src="/SirajAi.png" alt="AI" width={36} height={36} className="object-cover" />
                </div>
                <div className="text-right">
                  <p className="font-black text-sm md:text-base leading-none">سراج</p>
                  <div className="flex items-center gap-1 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                     <span className="text-[8px] text-white/60 font-black tracking-widest uppercase">متصل</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                 <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 hover:bg-white/10 text-white rounded-full">
                   {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10 text-white rounded-full">
                   <X className="w-5 h-5" />
                 </Button>
              </div>
            </div>

            {/* Chat Area - Flexible & Scrollable */}
            <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/50" ref={scrollRef}>
              <div className="space-y-5">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-sm overflow-hidden",
                      msg.role === 'user' ? "bg-white border-primary/5" : "bg-white border-secondary/5"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Image src="/SirajAi.png" alt="AI" width={32} height={32} />}
                    </div>
                    <div className={cn(
                      "p-3.5 md:p-4 rounded-2xl text-xs md:text-sm shadow-sm max-w-[85%] leading-relaxed font-bold",
                      msg.role === 'user' 
                        ? "bg-white text-slate-800 rounded-tr-none border border-primary/5" 
                        : "bg-primary text-white rounded-tl-none"
                    )}>
                      {msg.content[0].text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2.5 flex-row-reverse">
                     <div className="w-8 h-8 rounded-xl bg-white border-2 border-secondary/5 flex items-center justify-center overflow-hidden shrink-0">
                        <Image src="/SirajAi.png" alt="AI" width={32} height={32} />
                     </div>
                     <div className="bg-primary/5 p-4 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area - Compact Design */}
            <div className="p-4 md:p-5 bg-white border-t border-border/40 shrink-0 sm:rounded-b-[2rem]">
              {!config.enabled ? (
                <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-700">المساعد في وضع الصيانة حالياً.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 max-w-2xl mx-auto">
                  <Input
                    className="flex-1 bg-slate-100/70 border-none rounded-xl h-11 md:h-12 pr-4 focus-visible:ring-1 focus-visible:ring-primary/10 text-xs md:text-sm font-bold"
                    placeholder="اكتب سؤالك هنا..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="h-11 w-11 md:h-12 md:w-12 p-0 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Floating Toggle Button - Slower Animation */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 pointer-events-auto">
          <button
            onClick={toggleChat}
            className="w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-700 hover:scale-110 active:scale-90 flex items-center justify-center group animate-float-siraj"
          >
            <Image 
              src="/SirajAi.png" 
              alt="Siraj" 
              width={80} 
              height={80} 
              className="object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </button>
          
          <div className="absolute -top-10 left-0 bg-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none luxury-shadow">
            سأل سراج!
          </div>
        </div>
      )}
    </div>
  );
}
