
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo de volta! Aqui está um resumo das suas transcrições.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/nova-transcricao">
            <Upload className="w-4 h-4 mr-2" />
            Nova Transcrição
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/transcricoes">
            <FileText className="w-4 h-4 mr-2" />
            Ver Todas
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 font-medium">
                  {stat.trend}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  vs mês passado
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transcriptions */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Transcrições Recentes
          </CardTitle>
          <CardDescription>
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
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Concluída' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
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
