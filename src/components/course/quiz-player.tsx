"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, PartyPopper, XCircle, RotateCcw, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizPlayerProps {
  quizData: any[];
  onComplete: (score: number) => void;
  alreadyAnswered: boolean;
  previousScore?: number;
}

export default function QuizPlayer({ quizData, onComplete, alreadyAnswered, previousScore }: QuizPlayerProps) {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);

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
    setIsReviewMode(false);
    onComplete(correctCount);
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setIsReviewMode(false);
    setStarted(true);
  };

  const openReviewMode = () => {
    setIsReviewMode(true);
    setShowResult(true);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="bg-card p-5 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-border text-center space-y-6 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-orange-50 text-orange-500">
          <AlertCircle className="w-10 h-10 md:w-12 md:h-12" />
        </div>
        
        <div className="space-y-4 px-2">
          <h2 className="text-xl md:text-3xl font-black text-primary font-headline">تقويم الوحدة التعليمية</h2>
          
          {alreadyAnswered && (
            <div className="bg-green-50 p-6 rounded-[1.5rem] border border-green-100 space-y-3 animate-in slide-in-from-top-4 duration-500">
              <p className="text-green-800 font-black text-sm md:text-lg flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> لقد اجتزت هذا التقويم بنجاح!
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-[8px] md:text-[10px] text-green-600 font-bold uppercase tracking-wider">آخر نتيجة مسجلة</p>
                  <p className="text-xl md:text-3xl font-black text-green-700">{previousScore} / {quizData.length}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-muted-foreground text-xs md:text-lg leading-relaxed max-w-lg mx-auto font-medium">
            {alreadyAnswered 
              ? "يمكنك مراجعة الأسئلة مع حلولها الصحيحة أو إعادة المحاولة للتدريب." 
              : "تنبيه: يتم احتساب نقاط هذا التقويم وإضافتها لرصيدك من أول محاولة إجابة فقط."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => setStarted(true)} className="h-12 md:h-14 px-10 rounded-xl md:rounded-2xl bg-primary text-white font-black text-sm md:text-lg shadow-lg">
            {alreadyAnswered ? "إعادة المحاولة للتدريب" : "ابدأ التقويم الآن"}
          </Button>
          
          {alreadyAnswered && (
            <Button onClick={openReviewMode} variant="outline" className="h-12 md:h-14 px-10 rounded-xl md:rounded-2xl border-primary/10 font-black text-sm md:text-lg gap-2">
              <Eye className="w-5 h-5" /> مراجعة الأسئلة والحلول
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (showResult) {
    const finalScore = isReviewMode ? (previousScore || 0) : score;
    const isSuccess = finalScore >= quizData.length / 2;
    const pointsEarned = 10 + (finalScore * 5);

    return (
      <div className="bg-card p-4 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-border text-center space-y-6 md:space-y-8 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-muted/30">
          {isSuccess ? <PartyPopper className="w-10 h-10 md:w-12 md:h-12 text-secondary" /> : <XCircle className="w-10 h-10 md:w-12 md:h-12 text-destructive" />}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-4xl font-black text-primary font-headline">
              {isReviewMode ? "دليل مراجعة الوحدة" : (isSuccess ? "أحسنت يا بطل! 🎉" : "محاولة جيدة")}
            </h2>
            <p className="text-xs md:text-lg text-muted-foreground font-bold">ملخص أدائك التعليمي</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-md mx-auto">
             <div className="bg-primary/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-primary/10">
                <p className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">الإجابات الصحيحة</p>
                <p className="text-lg md:text-2xl font-black text-primary">{finalScore} / {quizData.length}</p>
             </div>
             <div className="bg-secondary/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-secondary/10">
                <p className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">النقاط المضافة</p>
                <p className="text-lg md:text-2xl font-black text-secondary">
                  {(alreadyAnswered && !isReviewMode) ? "0" : `+${pointsEarned}`}
                </p>
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-border/50 text-right" dir="rtl">
           <h3 className="font-black text-primary text-base md:text-xl flex items-center gap-2 mb-2">
             <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary" /> الأسئلة والحلول النموذجية:
           </h3>
           <div className="grid gap-3">
              {quizData.map((question, idx) => {
                const isCorrect = isReviewMode ? true : (answers[idx] === question.correctAnswer);
                return (
                  <div key={idx} className="flex items-start justify-between p-3 md:p-4 bg-muted/20 rounded-xl border border-primary/5 gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                       <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 mt-0.5">{idx + 1}</span>
                       <div className="text-right flex-1">
                          <p className="text-[11px] md:sm font-bold text-primary leading-relaxed">
                            {question.question}
                          </p>
                          <p className="text-[10px] text-secondary font-black mt-1">الحل الصحيح: {question.correctAnswer}</p>
                       </div>
                    </div>
                    {!isReviewMode && (
                      <div className="shrink-0 pt-0.5">
                        {isCorrect ? (
                          <Badge className="bg-green-100 text-green-700 border-none px-2 py-0.5 md:px-3 md:py-1 gap-1 text-[9px] md:text-[10px] font-black whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> صحيحة
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-none px-2 py-0.5 md:px-3 md:py-1 gap-1 text-[9px] md:text-[10px] font-black whitespace-nowrap">
                            <XCircle className="w-2.5 h-2.5 md:w-3 md:h-3" /> خاطئة
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
           </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
           <Button onClick={reset} variant="outline" className="w-full gap-2 rounded-xl md:rounded-2xl h-12 md:h-14 font-black border-primary/10 hover:bg-primary/5 text-xs md:text-base">
             <RotateCcw className="w-4 h-4 md:w-5 md:h-5" /> خروج والعودة للبداية
           </Button>
        </div>
      </div>
    );
  }

  const q = quizData[currentStep];

  return (
    <div className="bg-card p-4 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-border luxury-shadow space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-border/50 pb-4 md:pb-6">
        <span className="text-base md:text-2xl font-black text-primary font-headline">تقويم الوحدة</span>
        <span className="text-[10px] md:text-xs font-black bg-primary/5 text-primary px-2 py-1 md:px-3 md:py-1.5 rounded-full">سؤال {currentStep + 1} من {quizData.length}</span>
      </div>
      <div className="space-y-6 md:space-y-8 text-right" dir="rtl">
        <h3 className="text-base md:text-3xl font-black text-primary leading-snug md:leading-tight px-1">{q.question}</h3>
        <div className="grid gap-2 md:gap-4">
          {(q.type === "true-false" ? ["صح", "خطأ"] : (q.options || [])).filter(Boolean).map((opt: string, i: number) => {
            const isSelected = answers[currentStep] === opt;
            return (
              <button
                key={i} 
                onClick={() => handleAnswer(opt)}
                className={cn(
                  "flex items-center justify-between p-3.5 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 text-right group",
                  isSelected ? "border-secondary bg-secondary/5 shadow-md" : "border-muted hover:border-secondary/20"
                )}>
                <span className={cn("text-xs md:text-xl font-bold transition-colors", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary")}>{opt}</span>
                <div className={cn("w-4 h-4 md:w-6 md:h-6 rounded-full border-2 transition-all", isSelected ? "border-secondary bg-secondary scale-110" : "border-muted group-hover:border-secondary/40")} />
              </button>
            );
          })}
        </div>
      </div>
      <Button disabled={!answers[currentStep]} onClick={next} className="w-full h-12 md:h-14 bg-primary text-white rounded-xl md:rounded-2xl text-sm md:text-lg font-black shadow-lg active:scale-95 transition-transform">
        {currentStep === quizData.length - 1 ? "إظهار النتيجة النهائية" : "السؤال التالي"}
      </Button>
    </div>
  );
}