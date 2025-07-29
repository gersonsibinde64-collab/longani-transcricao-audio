
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Play, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Transcricoes() {
  const transcriptions = [
    {
      id: 1,
      title: "Reunião de Equipe - Segunda-feira",
      duration: "45:32",
      date: "29 de julho, 2024",
      status: "Concluída",
      accuracy: "96%",
      wordCount: 3245
    },
    {
      id: 2,
      title: "Entrevista com Cliente Potencial",
      duration: "22:15",
      date: "28 de julho, 2024",
      status: "Processando",
      accuracy: "92%",
      wordCount: 1890
    },
    {
      id: 3,
      title: "Palestra sobre Marketing Digital",
      duration: "1:15:22",
      date: "27 de julho, 2024",
      status: "Concluída",
      accuracy: "94%",
      wordCount: 5670
    },
    {
      id: 4,
      title: "Brainstorming de Produto",
      duration: "38:45",
      date: "26 de julho, 2024",
      status: "Concluída",
      accuracy: "89%",
      wordCount: 2890
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-foreground">Transcrições</h1>
          <p className="text-muted-foreground mt-2 font-light">
            Gerencie todas as suas transcrições de áudio
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 font-light">
          <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Nova Transcrição
        </Button>
      </div>

      {/* Transcriptions Grid */}
      <div className="grid gap-6">
        {transcriptions.map((transcription) => (
          <Card key={transcription.id} className="bg-white border-border shadow-card hover:shadow-card-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-normal text-card-foreground">
                      {transcription.title}
                    </CardTitle>
                    <CardDescription className="mt-1 font-light">
                      {transcription.date} • {transcription.duration}
                    </CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white shadow-card-lg">
                    <DropdownMenuItem className="font-light">
                      <Play className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Reproduzir
                    </DropdownMenuItem>
                    <DropdownMenuItem className="font-light">
                      <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Baixar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="font-light">
                      <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground font-light">Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-light ${
                      transcription.status === 'Concluída' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {transcription.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-light">Precisão</p>
                    <p className="font-light text-foreground">{transcription.accuracy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-light">Palavras</p>
                    <p className="font-light text-foreground">{transcription.wordCount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="font-light">
                    <Play className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Reproduzir
                  </Button>
                  <Button variant="outline" size="sm" className="font-light">
                    <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Baixar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
