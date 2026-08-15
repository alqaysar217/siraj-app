
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, PartyPopper, XCircle, RotateCcw } from "lucide-react";
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
            تنبيه: يتم احتساب نقاط هذا التقويم من أول محاولة إجابة فقط.
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
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
             <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">الأسئلة الصحيحة</p>
                <p className="text-2xl font-black text-primary">{score} / {quizData.length}</p>
             </div>
             <div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">النقاط المكتسبة</p>
                <p className="text-2xl font-black text-secondary">{pointsEarned}</p>
             </div>
          </div>
        </div>
        <Button onClick={reset} variant="outline" className="gap-2 rounded-2xl h-14 px-10 font-black border-primary/10">
          <RotateCcw className="w-5 h-5" /> مراجعة التقويم ثانية
        </Button>
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
        {currentStep === quizData.length - 1 ? "إنهاء النتيجة" : "التالي"}
      </Button>
    </div>
  );
}
