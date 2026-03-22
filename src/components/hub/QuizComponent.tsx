import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizQuestion } from "@/data/mockData";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  quiz: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function QuizComponent({ quiz, onComplete }: Props) {
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [enviado, setEnviado] = useState(false);
  const [score, setScore] = useState(0);
  
  const handleSubmit = () => {
    let correctas = 0;
    quiz.forEach((q, i) => {
      if (respuestas[i] === q.correctIndex) correctas++;
    });
    const finalScore = Math.round((correctas / quiz.length) * 100);
    setScore(finalScore);
    setEnviado(true);
    onComplete(finalScore);
  };
  
  if (enviado) {
    const isSuccess = score >= 70;
    return (
      <Card className={`border-2 ${isSuccess ? 'border-green-500/20 bg-green-50/50' : 'border-orange-500/20 bg-orange-50/50'}`}>
        <CardContent className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
            {isSuccess ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            ) : (
                <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
            )}
          <div className={`text-6xl font-black tracking-tight ${isSuccess ? 'text-green-600' : 'text-orange-600'}`}>
            {score}%
          </div>
          <p className="text-xl font-medium mt-4 text-slate-700">
            {isSuccess ? '¡Excelente trabajo! Has superado el test.' : 'No te preocupes, puedes intentarlo de nuevo.'}
          </p>
          <Button size="lg" className="mt-8 font-bold px-8 shadow-sm" variant={isSuccess ? "outline" : "default"} onClick={() => {
            setEnviado(false);
            setRespuestas({});
          }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Evaluación de la clase</h3>
        <p className="text-muted-foreground mt-1">Responde las siguientes {quiz.length} preguntas para validar tu conocimiento.</p>
      </div>

      {quiz.map((question, qIndex) => (
        <Card key={qIndex} className="shadow-sm border-muted">
          <CardContent className="p-6 sm:p-8">
            <p className="font-semibold text-lg mb-6 leading-relaxed">
              <span className="text-muted-foreground mr-2">{qIndex + 1}.</span> 
              {question.question}
            </p>
            <RadioGroup 
              value={respuestas[qIndex]?.toString()} 
              onValueChange={(v) => setRespuestas(prev => ({ ...prev, [qIndex]: parseInt(v) }))}
              className="space-y-3"
            >
              {question.options.map((option, oIndex) => (
                <div 
                    key={oIndex} 
                    className={`flex items-start space-x-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                        respuestas[qIndex] === oIndex 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-muted hover:bg-muted/50'
                    }`}
                    onClick={() => setRespuestas(prev => ({ ...prev, [qIndex]: oIndex }))}
                >
                  <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} className="mt-0.5" />
                  <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer text-base font-medium leading-normal flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
      
      <div className="pt-4 border-t flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
            {Object.keys(respuestas).length} de {quiz.length} respondidas
        </p>
        <Button 
            onClick={handleSubmit} 
            disabled={Object.keys(respuestas).length !== quiz.length}
            size="lg"
            className="px-8 font-bold shadow-md"
        >
            Enviar respuestas
        </Button>
      </div>
    </div>
  );
}
