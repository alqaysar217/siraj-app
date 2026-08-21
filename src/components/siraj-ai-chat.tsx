'use client';

import { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  Smartphone,
  LayoutDashboard,
  Facebook,
  Youtube,
  Music2,
  Twitter
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
    <div className="my-3 rounded-xl overflow-hidden bg-slate-900 text-slate-100 border border-white/10" dir="ltr">
      <div className="bg-white/5 px-4 py-1.5 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-400">Code Snippet</span>
        <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
          <Copy className="w-3 h-3" />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * محرك عرض ردود المساعد - يحول النصوص لبطاقات تفاعلية وأزرار
 */
function AiResponseRenderer({ text }: { text: string }) {
  const cleanUrl = (url: string) => url.replace(/[()\[\]]/g, '').trim();

  // معالجة الأكواد البرمجية
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

  // 1. بطاقة دورة تدريبية
  const courseMatch = text.match(/دورة:\s*(.*?)\nالسعر:\s*(.*?)\nالمدرب:\s*(.*?)\nالرابط:\s*(https?:\/\/\S+)/);
  if (courseMatch) {
    const [full, name, price, instructor, url] = courseMatch;
    return (
      <Card className="my-3 rounded-2xl border-secondary/20 bg-white overflow-hidden shadow-md">
        <div className="bg-secondary/5 p-2 px-4 flex items-center justify-between border-b border-secondary/10">
          <span className="font-black text-secondary text-[10px] uppercase tracking-wider">تفاصيل الدورة</span>
          <GraduationCap className="w-4 h-4 text-secondary" />
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-black text-primary text-base leading-tight">{name.trim()}</h3>
          <div className="grid grid-cols-2 gap-2">
             <div className="bg-primary/5 p-2 rounded-xl border border-primary/5">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">السعر</p>
                <div className="flex items-center gap-1.5 font-black text-primary text-xs">
                  <BadgeDollarSign className="w-3 h-3 text-secondary" /> {price.trim()}
                </div>
             </div>
             <div className="bg-primary/5 p-2 rounded-xl border border-primary/5">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">المدرب</p>
                <div className="flex items-center gap-1.5 font-black text-primary text-xs">
                  <UserCheck className="w-3 h-3 text-secondary" /> {instructor.trim()}
                </div>
             </div>
          </div>
          <Button asChild className="w-full h-10 bg-primary text-white rounded-xl font-black text-xs gap-2 shadow-lg">
            <a href={cleanUrl(url)} target="_blank">عرض الدورة الآن <ExternalLink className="w-3.5 h-3.5" /></a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. بطاقة كتاب
  const bookMatch = text.match(/كتاب:\s*(.*?)\nالكاتب:\s*(.*?)\nالسعر:\s*(.*?)\nالرابط:\s*(https?:\/\/\S+)/);
  if (bookMatch) {
    const [full, name, author, price, url] = bookMatch;
    return (
      <Card className="my-3 rounded-2xl border-primary/10 bg-white overflow-hidden shadow-md">
        <div className="bg-primary/5 p-2 px-4 flex items-center justify-between border-b border-primary/10">
          <span className="font-black text-primary text-[10px] uppercase tracking-wider">إصدار علمي</span>
          <Library className="w-4 h-4 text-primary" />
        </div>
        <CardContent className="p-4 flex gap-4">
          <div className="w-12 h-16 bg-muted rounded shadow-sm flex items-center justify-center shrink-0 border border-primary/5">
             <BookOpen className="w-6 h-6 text-secondary opacity-40" />
          </div>
          <div className="text-right space-y-2 flex-1">
            <h3 className="font-black text-primary text-sm leading-tight line-clamp-1">{name.trim()}</h3>
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold text-muted-foreground">بواسطة: {author.trim()}</span>
               <span className="text-[10px] font-black text-secondary">{price.trim()}</span>
            </div>
            <Button asChild variant="outline" className="w-full h-8 rounded-lg border-primary/20 text-primary font-black text-[10px] gap-2">
              <a href={cleanUrl(url)} target="_blank">تصفح الكتاب <ChevronLeft className="w-3 h-3" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. روابط التواصل الاجتماعية الحقيقية
  if (text.includes('واتساب') || text.includes('إيميل') || text.includes('انستقرام') || text.includes('فيسبوك') || text.includes('تيك توك') || text.includes('يوتيوب') || text.includes('إكس')) {
    const lines = text.split('\n');
    return (
      <div className="my-3 space-y-2">
        {lines.map((line, i) => {
          if (line.includes('واتساب')) {
            const num = line.split(':')[1]?.trim() || '+967735952927';
            return (
              <a key={i} href={`https://wa.me/${num.replace(/\D/g, '')}`} target="_blank" className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#25D366] rounded-lg text-white shadow-md"><MessageCircle className="w-4 h-4" /></div>
                  <span className="text-xs font-black text-green-900">تواصل عبر واتساب</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-green-400" />
              </a>
            );
          }
          if (line.includes('إيميل')) {
            const email = line.split(':')[1]?.trim() || 'siraj.io@gmail.com';
            return (
              <a key={i} href={`mailto:${email}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#EA4335] rounded-lg text-white shadow-md"><Mail className="w-4 h-4" /></div>
                  <span className="text-xs font-black text-blue-900">مراسلة الجيميل</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-blue-400" />
              </a>
            );
          }
          if (line.includes('فيسبوك')) {
            return (
              <a key={i} href="https://facebook.com" target="_blank" className="flex items-center justify-between p-3 bg-[#1877F2]/5 rounded-xl border border-[#1877F2]/20 hover:bg-[#1877F2]/10 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#1877F2] rounded-lg text-white shadow-md"><Facebook className="w-4 h-4" /></div>
                  <span className="text-xs font-black text-[#1877F2]">صفحة فيسبوك</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-[#1877F2]/40" />
              </a>
            );
          }
          if (line.includes('انستقرام')) {
             return (
              <a key={i} href="https://instagram.com" target="_blank" className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-200 hover:bg-pink-100 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-lg text-white shadow-md"><Instagram className="w-4 h-4" /></div>
                  <span className="text-xs font-black text-pink-900">حساب انستقرام</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-pink-400" />
              </a>
            );
          }
          if (line.includes('يوتيوب')) {
            return (
              <a key={i} href="https://youtube.com" target="_blank" className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#FF0000] rounded-lg text-white shadow-md"><Youtube className="w-4 h-4" /></div>
                  <span className="text-xs font-black text-red-900">قناة يوتيوب</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-red-400" />
              </a>
            );
          }
          if (line.includes('تيك توك')) {
            return (
              <a key={i} href="https://tiktok.com" target="_blank" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-black rounded-lg text-white shadow-md"><Music2 className="w-4 h-4" /></div>
                  <span className="text-xs font-black text-slate-900">حساب تيك توك</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </a>
            );
          }
          return line.trim() ? <p key={i} className="text-xs font-bold text-slate-700 px-2 py-1">{line}</p> : null;
        })}
      </div>
    );
  }

  // 4. تحويل أي رابط يبدأ بـ https إلى زر
  const genericUrlMatch = text.match(/رابط:\s*(https?:\/\/\S+)/);
  if (genericUrlMatch) {
     const url = cleanUrl(genericUrlMatch[1]);
     return (
       <Button asChild className="w-full h-11 my-2 rounded-xl bg-primary text-white font-black text-xs gap-2 shadow-lg">
         <a href={url} target="_blank">فتح الرابط المباشر <ExternalLink className="w-4 h-4" /></a>
       </Button>
     );
  }

  // 5. معالجة الخطوات والترقيم
  const stepsMatch = text.match(/^\d+\.\s.*(?:\n\d+\.\s.*)*/m);
  if (stepsMatch) {
    const steps = stepsMatch[0].split('\n').filter(Boolean);
    return (
      <div className="my-4 space-y-3">
        {steps.map((step, i) => {
          const content = step.replace(/^\d+\.\s/, '');
          return (
            <div key={i} className="flex items-start gap-3 animate-in slide-in-from-right duration-300" style={{ delay: `${i * 100}ms` }}>
              <div className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-md">
                {i + 1}
              </div>
              <p className="text-sm font-bold text-slate-700 leading-relaxed py-0.5">{content}</p>
            </div>
          );
        })}
      </div>
    );
  }

  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/### (.*)/g, '$1')
    .replace(/## (.*)/g, '$1')
    .replace(/^- (.*)/gm, '• $1');

  return (
    <p className="text-sm md:text-base leading-[1.8] font-bold text-slate-800 whitespace-pre-wrap break-words text-right" style={{ direction: 'rtl' }}>
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
        <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-auto bg-black/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:p-4 sm:items-end">
          <Card className={cn(
            "w-full bg-[#FDFCFB] flex flex-col transition-all duration-500 ease-in-out shadow-2xl border-none overflow-hidden",
            "sm:w-[420px] sm:max-w-[95vw] sm:rounded-[2.5rem] sm:border sm:border-primary/10",
            isMinimized 
              ? "h-[30vh] sm:h-[250px]" 
              : "h-[100dvh] sm:h-[80vh] sm:max-h-[750px]"
          )}>
            {/* Header */}
            <div className="bg-primary p-3 md:p-4 flex items-center justify-between text-white shrink-0 sm:rounded-t-[2.5rem] shadow-md">
              <div className="flex items-center gap-3 pr-1">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg border border-white/20 shrink-0">
                  <Image src="/SirajAi.png" alt="سراج" width={36} height={36} className="object-cover" />
                </div>
                <div className="text-right">
                  <p className="font-black text-sm leading-none tracking-tight">مساعد سراج</p>
                  <div className="flex items-center gap-1 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                     <span className="text-[8px] text-white/50 font-black tracking-widest uppercase">متاح لخدمتك</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 hover:bg-white/10 text-white rounded-lg">
                   {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10 text-white rounded-lg">
                   <X className="w-4 h-4" />
                 </Button>
              </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm overflow-hidden",
                      msg.role === 'user' ? "bg-white border-primary/5" : "bg-white border-secondary/10"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Image src="/SirajAi.png" alt="AI" width={32} height={32} />}
                    </div>
                    <div className={cn(
                      "p-3.5 md:p-4 rounded-2xl text-sm shadow-sm max-w-[88%] leading-relaxed word-break break-words",
                      msg.role === 'user' 
                        ? "bg-primary text-white rounded-tr-none font-bold" 
                        : "bg-white text-slate-800 rounded-tl-none border border-primary/10 font-medium"
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
                  <div className="flex items-center gap-2.5 flex-row-reverse">
                     <div className="w-8 h-8 rounded-xl bg-white border border-secondary/10 flex items-center justify-center overflow-hidden shrink-0">
                        <Image src="/SirajAi.png" alt="AI" width={32} height={32} />
                     </div>
                     <div className="bg-primary/5 p-4 rounded-2xl rounded-tl-none border border-primary/5">
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

            {/* Input Area */}
            <div className="p-3 md:p-5 bg-white border-t border-border/30 shrink-0 sm:rounded-b-[2.5rem] shadow-inner">
              {!config.enabled ? (
                <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-700">المساعد في وضع الصيانة حالياً.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 bg-slate-100/80 border-none rounded-xl h-11 md:h-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary/10 text-sm font-bold text-slate-800"
                    placeholder="اكتب استفسارك هنا..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="h-11 w-11 md:h-12 md:w-12 p-0 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-all"
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
        <div className="fixed bottom-6 left-6 pointer-events-auto">
          <button
            onClick={toggleChat}
            className="w-16 h-16 md:w-18 md:h-18 rounded-[2rem] bg-white shadow-2xl border-4 border-white overflow-hidden transition-all duration-700 hover:scale-110 active:scale-90 flex items-center justify-center group animate-float-siraj"
          >
            <Image 
              src="/SirajAi.png" 
              alt="سراج" 
              width={80} 
              height={80} 
              className="object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </button>
          
          <div className="absolute -top-10 left-0 bg-primary text-white text-[9px] font-black px-4 py-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl flex items-center gap-2">
            اسأل سراج <ChevronLeft className="w-3 h-3 rotate-180" />
          </div>
        </div>
      )}
    </div>
  );
}
