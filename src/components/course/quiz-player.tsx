"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, PartyPopper, XCircle, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizPlayerProps {
  quizData: any[];
  onComplete: (score: number) => void;
  alreadyAnswered: boolean;
}

export default function QuizPlayer({ quizData, onComplete, alreadyAnswered }: QuizPlayerProps) {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (val: string) => {
    if (showResult) return;
    setAnswers({ ...answers, [currentStep]: val });
  };

  const next = () => {
    if (currentStep < quizData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    quizData.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correctCount++;
    });
    setScore(correctCount);
    setShowResult(true);
    onComplete(correctCount);
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="bg-card p-6 md:p-12 rounded-[2rem] border border-border text-center space-y-6 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-orange-50 text-orange-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl md:text-3xl font-black text-primary font-headline">تقويم الوحدة التعليمية</h2>
          <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-lg mx-auto">
            {alreadyAnswered 
              ? "لقد قمت بحل هذا التقويم سابقاً، يمكنك إعادته للمراجعة ولكن لن يتم إضافة نقاط جديدة لرصيدك." 
              : "تنبيه: يتم احتساب نقاط هذا التقويم من أول محاولة إجابة فقط."}
          </p>
        </div>
        <Button onClick={() => setStarted(true)} className="h-14 px-12 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg">
          ابدأ التقويم الآن
        </Button>
      </div>
    );
  }

  if (showResult) {
    const isSuccess = score >= quizData.length / 2;
    const pointsEarned = 10 + (score * 5);

    return (
      <div className="bg-card p-6 md:p-12 rounded-[2rem] border border-border text-center space-y-8 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-muted/30">
          {isSuccess ? <PartyPopper className="w-12 h-12 text-secondary" /> : <XCircle className="w-12 h-12 text-destructive" />}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-4xl font-black text-primary font-headline">
              {isSuccess ? "أحسنت يا بطل! 🎉" : "محاولة جيدة"}
            </h2>
            <p className="text-muted-foreground font-bold">لقد أتممت تقويم الوحدة بنجاح</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
             <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">الإجابات الصحيحة</p>
                <p className="text-xl md:text-2xl font-black text-primary">{score} / {quizData.length}</p>
             </div>
             <div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
                <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">النقاط المكتسبة</p>
                <p className="text-xl md:text-2xl font-black text-secondary">
                  {alreadyAnswered ? "0 (سبق الحل)" : `+${pointsEarned}`}
                </p>
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-border/50 text-right" dir="rtl">
           <h3 className="font-black text-primary text-lg md:text-xl flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5 text-secondary" /> مراجعة الأداء الرقمي:
           </h3>
           <div className="grid gap-3">
              {quizData.map((question, idx) => {
                const isCorrect = answers[idx] === question.correctAnswer;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-primary/5">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">{idx + 1}</span>
                       <p className="text-xs md:text-sm font-bold text-primary truncate pr-2">{question.question}</p>
                    </div>
                    {isCorrect ? (
                      <Badge className="bg-green-100 text-green-700 border-none px-3 py-1 gap-1 text-[10px] font-black">
                        <CheckCircle2 className="w-3 h-3" /> صحيحة
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-none px-3 py-1 gap-1 text-[10px] font-black">
                        <XCircle className="w-3 h-3" /> خاطئة
                      </Badge>
                    )}
                  </div>
                );
              })}
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
           <Button onClick={reset} variant="outline" className="flex-1 gap-2 rounded-2xl h-14 font-black border-primary/10 hover:bg-primary/5">
             <RotateCcw className="w-5 h-5" /> إعادة محاولة التقويم
           </Button>
           <div className="flex-1 bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-center text-amber-700 font-bold text-[10px] leading-relaxed">
             ملاحظة: يمكنك الإعادة للمراجعة والتدريب، ولكن لن تتغير نقاطك المسجلة في المرة الأولى.
           </div>
        </div>
      </div>
    );
  }

  const q = quizData[currentStep];

  return (
    <div className="bg-card p-5 md:p-12 rounded-[2rem] border border-border luxury-shadow space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-border/50 pb-6">
        <span className="text-lg md:text-2xl font-black text-primary font-headline">تقويم الوحدة</span>
        <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1.5 rounded-full">سؤال {currentStep + 1} من {quizData.length}</span>
      </div>
      <div className="space-y-8 text-right" dir="rtl">
        <h3 className="text-lg md:text-3xl font-black text-primary leading-tight">{q.question}</h3>
        <div className="grid gap-3 md:gap-4">
          {(q.type === "true-false" ? ["صح", "خطأ"] : (q.options || [])).filter(Boolean).map((opt: string, i: number) => {
            const isSelected = answers[currentStep] === opt;
            return (
              <button
                key={i} 
                onClick={() => handleAnswer(opt)}
                className={cn(
                  "flex items-center justify-between p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-right",
                  isSelected ? "border-secondary bg-secondary/5 shadow-md" : "border-muted hover:border-secondary/20"
                )}>
                <span className={cn("text-sm md:text-xl font-bold", isSelected ? "text-primary" : "text-muted-foreground")}>{opt}</span>
                <div className={cn("w-6 h-6 rounded-full border-2", isSelected ? "border-secondary bg-secondary" : "border-muted")} />
              </button>
            );
          })}
        </div>
      </div>
      <Button disabled={!answers[currentStep]} onClick={next} className="w-full h-14 bg-primary text-white rounded-2xl text-lg font-black">
        {currentStep === quizData.length - 1 ? "إظهار النتيجة النهائية" : "السؤال التالي"}
      </Button>
    </div>
  );
}
