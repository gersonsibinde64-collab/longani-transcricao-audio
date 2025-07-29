
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Upload, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const stats = [
    {
      title: "Total de Transcrições",
      value: "12",
      description: "3 novas esta semana",
      icon: FileText,
      trend: "+20%"
    },
    {
      title: "Tempo Total",
      value: "2h 45m",
      description: "Áudio transcrito",
      icon: Clock,
      trend: "+15%"
    },
    {
      title: "Esta Semana",
      value: "3",
      description: "Transcrições realizadas",
      icon: Upload,
      trend: "+100%"
    },
    {
      title: "Precisão Média",
      value: "94%",
      description: "Qualidade das transcrições",
      icon: TrendingUp,
      trend: "+2%"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2 font-light">
          Bem-vindo de volta! Aqui está um resumo das suas transcrições.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button asChild className="bg-primary hover:bg-primary/90 font-light">
          <Link to="/nova-transcricao">
            <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Nova Transcrição
          </Link>
        </Button>
        <Button variant="outline" asChild className="font-light">
          <Link to="/transcricoes">
            <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Ver Todas
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-card-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light text-foreground mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground font-light mb-2">
                {stat.description}
              </p>
              <div className="flex items-center">
                <span className="text-xs text-green-600 font-light">
                  {stat.trend}
                </span>
                <span className="text-xs text-muted-foreground ml-1 font-light">
                  vs mês passado
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transcriptions */}
      <Card className="bg-white border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-normal text-card-foreground">
            Transcrições Recentes
          </CardTitle>
          <CardDescription className="font-light">
            Suas últimas transcrições de áudio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Reunião de Equipe - 29/07", duration: "45 min", status: "Concluída" },
              { name: "Entrevista Cliente", duration: "22 min", status: "Processando" },
              { name: "Palestra Marketing", duration: "1h 15min", status: "Concluída" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-5 border border-border rounded-lg bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-normal text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground font-light">{item.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-light ${
                    item.status === 'Concluída' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
