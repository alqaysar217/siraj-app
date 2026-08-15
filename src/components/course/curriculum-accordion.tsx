
"use client";

import { BookOpen, PlayCircle, CheckCircle2, Lock, Trophy, ChevronLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface CurriculumAccordionProps {
  lessons: any[];
  allCompletedIds: string[];
  selectedLessonId: string | null;
  selectLesson: (id: string) => void;
  isLessonLocked: (lesson: any, index: number) => boolean;
  setIsFinishing: (val: boolean) => void;
  setSelectedLessonId: (id: string | null) => void;
  isAllLessonsCompleted: boolean;
  isFinishing: boolean;
  onClose?: () => void;
}

export default function CurriculumAccordion({
  lessons,
  allCompletedIds,
  selectedLessonId,
  selectLesson,
  isLessonLocked,
  setIsFinishing,
  setSelectedLessonId,
  isAllLessonsCompleted,
  isFinishing,
  onClose
}: CurriculumAccordionProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <Accordion type="single" collapsible className="space-y-4">
        {lessons && lessons.length > 0 ? Object.entries(
          lessons.reduce((acc: any, lesson: any) => {
            const unit = lesson.unitTitle || "مقدمة المنهج";
            if (!acc[unit]) acc[unit] = [];
            acc[unit].push(lesson);
            return acc;
          }, {})
        ).map(([unitTitle, unitLessons]: [string, any], uIdx) => (
          <AccordionItem key={unitTitle} value={`unit-${uIdx}`} className="border rounded-2xl overflow-hidden bg-card border-primary/5">
            <AccordionTrigger className="hover:no-underline py-5 px-5 bg-muted/20 text-right [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-4 text-right">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-md shrink-0"><BookOpen className="w-5 h-5" /></div>
                <div className="text-right flex-1">
                  <h4 className="text-base font-black text-primary">{unitTitle}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold">{unitLessons.length} عناصر</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-3 space-y-1.5">
              {unitLessons.map((lesson: any, lIdx: number) => {
                const gIndex = lessons?.findIndex(l => l.id === lesson.id) ?? 0;
                const isLocked = isLessonLocked(lesson, gIndex);
                const isActive = selectedLessonId === lesson.id;
                const isDone = allCompletedIds.includes(lesson.id);
                return (
                  <button key={lesson.id} disabled={isLocked} onClick={() => { selectLesson(lesson.id); onClose?.(); }}
                    className={cn("w-full text-right p-4 rounded-xl flex items-center justify-between transition-all", isActive ? "bg-secondary text-white shadow-lg scale-[1.02]" : "hover:bg-primary/5", isLocked && "opacity-40")}>
                    <div className="flex items-center gap-4 text-right">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0", isActive ? "bg-white/20" : "bg-muted text-primary")}>{lIdx + 1}</div>
                      <div className="text-right flex-1">
                        <div className="text-sm font-bold">{lesson.title}</div>
                      </div>
                    </div>
                    <div className="shrink-0">{isLocked ? <Lock className="w-4 h-4 opacity-50" /> : isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <PlayCircle className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />}</div>
                  </button>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        )) : (
          <div className="text-center py-10 opacity-40 italic text-sm font-bold">
            لم يتم رفع دروس لهذه الدورة بعد.
          </div>
        )}

        {lessons && lessons.length > 0 && (
          <div className="mt-4 border rounded-2xl overflow-hidden bg-card border-secondary/20 luxury-shadow">
            <button 
              disabled={!isAllLessonsCompleted}
              onClick={() => { setIsFinishing(true); setSelectedLessonId(null); onClose?.(); }}
              className={cn(
                "w-full text-right p-6 flex items-center justify-between transition-all",
                isFinishing ? "bg-primary text-white" : "bg-muted/10",
                !isAllLessonsCompleted && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl shadow-md shrink-0", isAllLessonsCompleted ? "bg-secondary text-white" : "bg-muted text-muted-foreground")}>
                  {isAllLessonsCompleted ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div className="text-right">
                  <h4 className="text-base font-black">الخطوة الأخيرة: التقييم والشهادة</h4>
                  <p className="text-[10px] font-bold opacity-70">
                    {isAllLessonsCompleted ? "افتح الآن لاستلام إنجازك" : "ستُفتح بعد إتمام كافة الدروس"}
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </Accordion>
    </div>
  );
}
