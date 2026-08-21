'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  User, 
  Minimize2, 
  Maximize2,
  GraduationCap,
  BadgeDollarSign,
  UserCheck,
  ExternalLink,
  BookOpen,
  Library,
  Info,
  CheckCircle2,
  MessageCircle,
  Mail,
  Instagram,
  Trophy,
  SearchCheck,
  Copy,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase/provider';
import { doc, onSnapshot } from 'firebase/firestore';
import { sirajAiChat } from '@/ai/flows/siraj-ai-chat';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'model';
  content: { text: string }[];
};

/**
 * مكون لعرض الأكواد البرمجية مع خاصية النسخ
 */
function CodeBlock({ code }: { code: string }) {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "تم نسخ الكود ✓" });
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden bg-slate-900 text-slate-100 border border-white/10" dir="ltr">
      <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-400">Code Snippet</span>
        <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * محرك عرض ردود المساعد - يحول النصوص لبطاقات تفاعلية
 */
function AiResponseRenderer({ text }: { text: string }) {
  // دالة لتنظيف الروابط من أي نصوص محيطة بها
  const cleanUrl = (url: string) => url.replace(/[()\[\]]/g, '').trim();

  // معالجة الأكواد البرمجية (Triple Backticks)
  if (text.includes('```')) {
    const parts = text.split('```');
    return (
      <div className="space-y-1">
        {parts.map((part, i) => (
          i % 2 === 1 ? <CodeBlock key={i} code={part.trim()} /> : <AiResponseRenderer key={i} text={part} />
        ))}
      </div>
    );
  }

  // 1. اكتشاف بطاقة دورة
  const courseMatch = text.match(/دورة:\s*(.*?)\nالسعر:\s*(.*?)\nالمدرب:\s*(.*?)\nالرابط:\s*(https?:\/\/\S+)/);
  if (courseMatch) {
    const [full, name, price, instructor, url] = courseMatch;
    return (
      <Card className="my-4 rounded-[1.5rem] border-secondary/20 bg-secondary/5 overflow-hidden luxury-shadow">
        <div className="bg-secondary/10 p-3 flex items-center gap-2 border-b border-secondary/10">
          <GraduationCap className="w-5 h-5 text-secondary" />
          <span className="font-black text-primary text-sm">تفاصيل الدورة التدريبية</span>
        </div>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-black text-primary text-lg leading-tight">{name.trim()}</h3>
          <div className="grid grid-cols-1 gap-3">
             <div className="flex items-center gap-2 bg-white/50 p-2.5 rounded-xl border border-primary/5">
                <BadgeDollarSign className="w-4 h-4 text-secondary" />
                <div className="text-right">
                  <p className="text-[8px] font-black text-muted-foreground uppercase">رسوم الاستثمار</p>
                  <p className="text-sm font-black text-primary">{price.trim()}</p>
                </div>
             </div>
             <div className="flex items-center gap-2 bg-white/50 p-2.5 rounded-xl border border-primary/5">
                <UserCheck className="w-4 h-4 text-secondary" />
                <div className="text-right">
                  <p className="text-[8px] font-black text-muted-foreground uppercase">خبير التدريب</p>
                  <p className="text-sm font-black text-primary">{instructor.trim()}</p>
                </div>
             </div>
          </div>
          <Button asChild className="w-full h-11 bg-primary text-white rounded-xl font-black text-xs gap-2">
            <a href={cleanUrl(url)} target="_blank">عرض تفاصيل المنهج <ExternalLink className="w-3.5 h-3.5" /></a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. اكتشاف بطاقة كتاب
  const bookMatch = text.match(/كتاب:\s*(.*?)\nالكاتب:\s*(.*?)\nالسعر:\s*(.*?)\nالرابط:\s*(https?:\/\/\S+)/);
  if (bookMatch) {
    const [full, name, author, price, url] = bookMatch;
    return (
      <Card className="my-4 rounded-[1.5rem] border-primary/10 bg-primary/5 overflow-hidden luxury-shadow">
        <div className="bg-primary/10 p-3 flex items-center gap-2 border-b border-primary/10">
          <Library className="w-5 h-5 text-primary" />
          <span className="font-black text-primary text-sm">إصدار علمي جديد</span>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center border border-primary/5 shrink-0">
               <BookOpen className="w-6 h-6 text-secondary opacity-40" />
            </div>
            <div className="text-right space-y-1">
              <h3 className="font-black text-primary text-base leading-tight">{name.trim()}</h3>
              <p className="text-xs font-bold text-muted-foreground">تأليف: {author.trim()}</p>
              <p className="text-sm font-black text-secondary">{price.trim()}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full h-11 rounded-xl border-primary/20 text-primary font-black text-xs gap-2">
            <a href={cleanUrl(url)} target="_blank">تصفح الكتاب <ChevronLeft className="w-3.5 h-3.5" /></a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. معالجة الروابط الخاصة بالمنصة وتحويلها لأزرار
  if (text.includes('https://siraj-app.vercel.app/verify-certificate')) {
    return (
      <div className="my-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white"><SearchCheck className="w-5 h-5" /></div>
          <p className="text-sm font-black text-blue-900">نظام التحقق من الشهادات</p>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed font-bold">يمكنك التأكد من صحة أي شهادة أو وسام صادر من سراج عبر بوابة التحقق الرسمية.</p>
        <Button asChild className="w-full bg-blue-600 text-white rounded-xl h-10 text-xs font-black">
          <a href="/verify-certificate">التحقق من الشهادة الآن</a>
        </Button>
      </div>
    );
  }

  if (text.includes('https://siraj-app.vercel.app/leaderboard')) {
    return (
      <div className="my-4 p-5 bg-yellow-50 rounded-2xl border border-yellow-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-600 rounded-xl text-white"><Trophy className="w-5 h-5" /></div>
          <p className="text-sm font-black text-yellow-900">قائمة شرف طلاب سراج</p>
        </div>
        <Button asChild className="w-full bg-yellow-600 text-white rounded-xl h-10 text-xs font-black">
          <a href="/leaderboard">عرض قائمة المتصدرين</a>
        </Button>
      </div>
    );
  }

  // 4. معالجة القوائم والخطوات (Stepper)
  const stepsMatch = text.match(/^\d+\.\s.*(?:\n\d+\.\s.*)*/m);
  if (stepsMatch) {
    const steps = stepsMatch[0].split('\n').filter(Boolean);
    return (
      <div className="my-4 space-y-3 pr-2">
        {steps.map((step, i) => {
          const content = step.replace(/^\d+\.\s/, '');
          return (
            <div key={i} className="flex items-start gap-3 group">
              <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[10px] font-black shrink-0 mt-1 border border-secondary/20 group-hover:bg-secondary group-hover:text-white transition-colors">
                {i + 1}
              </div>
              <p className="text-sm font-bold text-primary/80 leading-relaxed py-1">{content}</p>
            </div>
          );
        })}
      </div>
    );
  }

  // 5. معالجة معلومات التواصل
  if (text.includes('واتساب') || text.includes('إيميل') || text.includes('انستقرام')) {
    const lines = text.split('\n');
    return (
      <div className="my-4 grid grid-cols-1 gap-2">
        {lines.map((line, i) => {
          if (line.includes('واتساب')) {
            const num = line.split(':')[1]?.trim() || '+967735952927';
            return (
              <a key={i} href={`https://wa.me/${num.replace(/\D/g, '')}`} target="_blank" className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-black text-green-800">تواصل عبر واتساب</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-green-600" dir="ltr">{num}</span>
              </a>
            );
          }
          if (line.includes('إيميل')) {
            const email = line.split(':')[1]?.trim() || 'siraj.io@gmail.com';
            return (
              <a key={i} href={`mailto:${email}`} className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black text-primary">البريد الرسمي</span>
                </div>
                <span className="text-[10px] font-bold text-primary/60">{email}</span>
              </a>
            );
          }
          return <p key={i} className="text-xs font-bold text-muted-foreground px-2">{line}</p>;
        })}
      </div>
    );
  }

  // النص العادي مع معالجة RTL/LTR للنصوص المختلطة
  // نزيل رموز المارك داون الخام مثل النجوم المزدوجة
  const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/### (.*)/g, '$1').replace(/## (.*)/g, '$1');

  return (
    <p className="text-sm md:text-base leading-[1.8] font-bold text-primary/90 whitespace-pre-wrap [unicode-bidi:plaintext]" style={{ direction: 'rtl', textAlign: 'right' }}>
      {cleanText}
    </p>
  );
}

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
            "sm:w-[420px] sm:max-w-[95vw] sm:rounded-[2.5rem] sm:border sm:border-primary/5",
            isMinimized 
              ? "h-[35vh] sm:h-[300px]" 
              : "h-[100dvh] sm:h-[80vh] sm:max-h-[750px]"
          )}>
            {/* Header - Modern & Slim */}
            <div className="bg-primary p-3 md:p-4 flex items-center justify-between text-white shrink-0 sm:rounded-t-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border-2 border-white/20">
                  <Image src="/SirajAi.png" alt="AI" width={40} height={40} className="object-cover" />
                </div>
                <div className="text-right">
                  <p className="font-black text-sm md:text-base leading-none tracking-tight">سراج</p>
                  <div className="flex items-center gap-1 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                     <span className="text-[8px] text-white/50 font-black tracking-widest uppercase">نشط الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-9 w-9 hover:bg-white/10 text-white rounded-xl">
                   {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-9 w-9 hover:bg-white/10 text-white rounded-xl">
                   <X className="w-5 h-5" />
                 </Button>
              </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 md:p-6 bg-[#FDFCFB]" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm overflow-hidden",
                      msg.role === 'user' ? "bg-white border-primary/5" : "bg-white border-secondary/10"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Image src="/SirajAi.png" alt="AI" width={36} height={36} />}
                    </div>
                    <div className={cn(
                      "p-4 md:p-5 rounded-[1.8rem] text-sm md:text-base shadow-sm max-w-[88%] leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-white text-slate-800 rounded-tr-none border border-primary/5 font-bold" 
                        : "bg-primary text-white rounded-tl-none font-medium"
                    )}>
                      {msg.role === 'user' ? (
                        <p className="text-right" style={{ direction: 'rtl' }}>{msg.content[0].text}</p>
                      ) : (
                        <AiResponseRenderer text={msg.content[0].text} />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 flex-row-reverse">
                     <div className="w-9 h-9 rounded-2xl bg-white border-2 border-secondary/10 flex items-center justify-center overflow-hidden shrink-0">
                        <Image src="/SirajAi.png" alt="AI" width={36} height={36} />
                     </div>
                     <div className="bg-primary/5 p-4 rounded-3xl rounded-tl-none">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-primary/20 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-primary/20 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-primary/20 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-border/40 shrink-0 sm:rounded-b-[2.5rem]">
              {!config.enabled ? (
                <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-700 flex items-center justify-center gap-2"><Info className="w-3 h-3" /> المساعد في وضع الصيانة حالياً.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 max-w-2xl mx-auto">
                  <Input
                    className="flex-1 bg-slate-100/70 border-none rounded-2xl h-12 md:h-14 pr-5 focus-visible:ring-2 focus-visible:ring-primary/10 text-sm md:text-base font-bold placeholder:text-muted-foreground/50"
                    placeholder="اكتب سؤالك هنا..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="h-12 w-12 md:h-14 md:w-14 p-0 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-2xl active:scale-95 transition-all"
                  >
                    <Send className="w-5 h-5 rotate-180" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-8 left-8 pointer-events-auto">
          <button
            onClick={toggleChat}
            className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-700 hover:scale-110 active:scale-90 flex items-center justify-center group animate-float-siraj"
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
          
          <div className="absolute -top-12 left-0 bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none luxury-shadow flex items-center gap-2">
            اسأل سراج المبدع! <ChevronLeft className="w-3 h-3 rotate-180" />
          </div>
        </div>
      )}
    </div>
  );
}
