'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  User, 
  Minimize2, 
  Maximize2,
  ChevronDown,
  LayoutGrid,
  Bot
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
  const [isMinimized, setIsMinimized] = useState(false); // هذا الوضع يجعل الشات في ربع الشاشة
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(doc(db, "settings", "ai_config"), (snap) => {
      if (snap.exists()) setConfig(snap.data());
      else setConfig({ visible: true, enabled: true, welcomeMessage: "مرحباً بك في سراج! أنا سراج AI، مساعدك الذكي." });
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isOpen, isMinimized, isLoading]);

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
      setMessages([{ role: 'model', content: [{ text: config.welcomeMessage || "مرحباً بك في سراج! أنا سراج AI، كيف أخدمك اليوم؟" }] }]);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" dir="rtl">
      {isOpen && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-auto bg-black/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:p-6 sm:items-start sm:justify-end">
          <Card className={cn(
            "w-full bg-white flex flex-col transition-all duration-500 ease-in-out luxury-shadow border-none",
            "sm:w-[450px] sm:max-w-[90vw] sm:rounded-[2.5rem] sm:border sm:border-primary/5",
            isMinimized 
              ? "h-[35vh] sm:h-[400px]" // وضع الربع السفلي
              : "h-[100dvh] sm:h-[80vh] sm:max-h-[800px]" // وضع ملء الشاشة
          )}>
            {/* رأس النافذة - ثابت دائماً */}
            <div className="bg-primary p-5 flex items-center justify-between text-white shrink-0 sm:rounded-t-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border-2 border-white/20">
                  <Image src="/SirajAi.png" alt="AI" width={48} height={48} className="object-cover" />
                </div>
                <div className="text-right">
                  <p className="font-black text-base md:text-lg leading-none">سراج AI</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                     <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                     <span className="text-[10px] text-white/70 font-black tracking-widest uppercase">متصل الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-10 w-10 hover:bg-white/10 text-white rounded-full">
                   {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-10 w-10 hover:bg-white/10 text-white rounded-full">
                   <X className="w-6 h-6" />
                 </Button>
              </div>
            </div>

            {/* منطقة المحادثة - تتجاوب مع الحجم المتبقي */}
            <ScrollArea className="flex-1 p-5 md:p-8 bg-slate-50/50" ref={scrollRef}>
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm overflow-hidden",
                      msg.role === 'user' ? "bg-white border-primary/10" : "bg-white border-secondary/10"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-primary" /> : <Image src="/SirajAi.png" alt="AI" width={40} height={40} />}
                    </div>
                    <div className={cn(
                      "p-4 md:p-5 rounded-[1.5rem] text-sm md:text-base shadow-sm max-w-[85%] leading-relaxed font-medium",
                      msg.role === 'user' 
                        ? "bg-white text-slate-800 rounded-tr-none border border-primary/5" 
                        : "bg-primary text-white rounded-tl-none"
                    )}>
                      {msg.content[0].text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 flex-row-reverse">
                     <div className="w-10 h-10 rounded-2xl bg-white border-2 border-secondary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <Image src="/SirajAi.png" alt="AI" width={40} height={40} />
                     </div>
                     <div className="bg-primary/10 p-5 rounded-[1.5rem] rounded-tl-none">
                        <div className="flex gap-2">
                          <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce"></span>
                          <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* منطقة الإدخال - ثابتة في الأسفل وتتفاعل مع الكيبورد */}
            <div className="p-5 md:p-8 bg-white border-t border-border/40 shrink-0 sm:rounded-b-[2.5rem]">
              {!config.enabled ? (
                <div className="text-center py-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-sm font-black text-amber-700">مساعد سراج في استراحة قصيرة للصيانة.</p>
                </div>
              ) : (
                <div className="relative flex items-center gap-3 max-w-3xl mx-auto">
                  <Input
                    className="flex-1 bg-slate-100/80 border-none rounded-2xl h-14 md:h-16 pr-6 focus-visible:ring-2 focus-visible:ring-primary/10 text-base md:text-lg font-bold"
                    placeholder="اسأل سراج أي شيء..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="h-14 w-14 md:h-16 md:w-16 p-0 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-2xl active:scale-95 transition-all hover:bg-primary/90"
                  >
                    <Send className="w-6 h-6 md:w-7 md:h-7 rotate-180" />
                  </Button>
                </div>
              )}
              {/* مساحة أمان للجوال لضمان عدم تغطية شريط التصفح */}
              <div className="h-2 sm:hidden" />
            </div>
          </Card>
        </div>
      )}

      {/* زر الفتح العائم - مع تأثير العوم الهادئ */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 pointer-events-auto">
          <button
            onClick={toggleChat}
            className="w-16 h-16 md:w-24 md:h-24 rounded-[2.2rem] bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-700 hover:scale-110 active:scale-90 hover:-rotate-3 flex items-center justify-center group animate-float-siraj"
          >
            <Image 
              src="/SirajAi.png" 
              alt="Siraj AI" 
              width={100} 
              height={100} 
              className="object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm" />
            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          {/* تلميح صغير فوق الزر */}
          <div className="absolute -top-10 left-0 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none luxury-shadow">
            سراج AI هنا للمساعدة!
          </div>
        </div>
      )}
    </div>
  );
}