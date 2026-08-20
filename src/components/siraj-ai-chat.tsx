'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
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
    
    // استماع مباشر للتغييرات في الإعدادات
    const unsubscribe = onSnapshot(doc(db, "settings", "ai_config"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      } else {
        // قيم افتراضية في حال عدم وجود إعدادات
        setConfig({
          visible: true,
          enabled: true,
          welcomeMessage: "مرحباً! أنا مساعدك الذكي في منصة سراج. كيف يمكنني مساعدتك اليوم؟"
        });
      }
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen, isMinimized]);

  // التحكم في الظهور بناءً على إعدادات لوحة التحكم
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
        history: messages, // نرسل التاريخ القديم قبل الرسالة الجديدة للتدفق
        knowledge: config.knowledgeBase
      });

      const aiMsg: Message = { role: 'model', content: [{ text: response.text }] };
      setMessages([...newMessages, aiMsg]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages([...newMessages, { role: 'model', content: [{ text: 'عذراً، حدث خطأ ما. يرجى التأكد من إعداد مفتاح الـ API بشكل صحيح.' }] }]);
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
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start font-sans" dir="rtl">
      {/* نافذة الدردشة */}
      {isOpen && (
        <Card className={cn(
          "mb-4 w-[90vw] sm:w-[380px] border border-primary/10 shadow-2xl rounded-2xl overflow-hidden bg-white flex flex-col transition-all duration-300",
          isMinimized ? "h-[64px]" : "h-[550px] max-h-[80vh]"
        )}>
          {/* رأس النافذة */}
          <div className="bg-primary p-4 flex items-center justify-between text-white cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/SirajAi.png" alt="AI" width={40} height={40} className="object-cover" />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm leading-none">سراج AI</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-400" />
                   <span className="text-[10px] text-white/80">متصل الآن</span>
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
              <ScrollArea className="flex-1 p-4 bg-slate-50" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex items-start gap-2", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border overflow-hidden",
                        msg.role === 'user' ? "bg-white border-primary/10" : "bg-white border-secondary/10"
                      )}>
                        {msg.role === 'user' ? 
                          <User className="w-4 h-4 text-primary" /> : 
                          <Image src="/SirajAi.png" alt="AI" width={32} height={32} />
                        }
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm max-w-[85%]",
                        msg.role === 'user' ? "bg-white text-slate-800 rounded-tr-none" : "bg-primary text-white rounded-tl-none"
                      )}>
                        {msg.content[0].text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 flex-row-reverse">
                       <div className="w-8 h-8 rounded-full bg-white border border-secondary/10 flex items-center justify-center overflow-hidden">
                          <Image src="/SirajAi.png" alt="AI" width={32} height={32} />
                       </div>
                       <div className="bg-primary text-white p-3 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* منطقة الإدخال */}
              <div className="p-4 bg-white border-t border-border/50">
                {!config.enabled ? (
                  <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-700">خدمة الرد الآلي متوقفة مؤقتاً</p>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2">
                    <Input
                      className="flex-1 bg-slate-50 border-none rounded-xl h-11 pr-4 focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
                      placeholder="اكتب رسالتك هنا..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="h-11 w-11 p-0 bg-primary text-white rounded-xl flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {/* زر التفعيل العائم */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="w-16 h-16 rounded-full bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12 flex items-center justify-center"
        >
          <Image src="/SirajAi.png" alt="Siraj AI" width={64} height={64} className="object-cover" />
        </button>
      )}
    </div>
  );
}
