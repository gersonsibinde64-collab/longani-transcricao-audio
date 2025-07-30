
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Clock, Target, TrendingUp, Plus } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-standard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-normal text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 font-light">
            Visão geral das suas transcrições e estatísticas
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 font-light focus-blue">
          <Plus className="w-4 h-4 mr-2" strokeWidth={1} />
          Nova Transcrição
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-standard">
        <Card className="bg-white border-border card-shadow hover:card-shadow-lg transition-shadow duration-200">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-light text-muted-foreground">
                Total de Transcrições
              </CardTitle>
              <FileText className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard pt-0">
            <div className="text-2xl font-kpi text-foreground">247</div>
            <p className="text-xs text-muted-foreground font-light mt-1">
              <span className="text-green-600">+12%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border card-shadow hover:card-shadow-lg transition-shadow duration-200">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-light text-muted-foreground">
                Tempo Total
              </CardTitle>
              <Clock className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard pt-0">
            <div className="text-2xl font-kpi text-foreground">89h 32m</div>
            <p className="text-xs text-muted-foreground font-light mt-1">
              <span className="text-green-600">+8%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border card-shadow hover:card-shadow-lg transition-shadow duration-200">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-light text-muted-foreground">
                Precisão Média
              </CardTitle>
              <Target className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard pt-0">
            <div className="text-2xl font-kpi text-foreground">94.2%</div>
            <p className="text-xs text-muted-foreground font-light mt-1">
              <span className="text-green-600">+2.1%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-standard">
        {/* Recent Activity */}
        <Card className="bg-white border-border card-shadow">
          <CardHeader className="p-standard">
            <CardTitle className="text-lg font-normal text-foreground">
              Atividade Recente
            </CardTitle>
            <CardDescription className="font-light">
              Últimas transcrições processadas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-standard pb-standard">
            <div className="space-y-4">
              {[
                { title: "Reunião de Equipe", time: "2 min atrás", status: "Concluída" },
                { title: "Entrevista Cliente", time: "15 min atrás", status: "Processando" },
                { title: "Webinar Marketing", time: "1h atrás", status: "Concluída" },
                { title: "Call Vendas", time: "2h atrás", status: "Concluída" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-light text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-light">{item.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-light ${
                    item.status === 'Concluída' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-white border-border card-shadow">
          <CardHeader className="p-standard">
            <CardTitle className="text-lg font-normal text-foreground">
              Estatísticas Rápidas
            </CardTitle>
            <CardDescription className="font-light">
              Resumo do desempenho
            </CardDescription>
          </CardHeader>
          <CardContent className="px-standard pb-standard">
            <div className="space-y-standard">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Esta Semana</p>
                  <p className="text-2xl font-kpi text-foreground">23</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" strokeWidth={1} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-kpi text-foreground">18min</p>
                </div>
                <Clock className="w-6 h-6 text-primary" strokeWidth={1} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Taxa de Sucesso</p>
                  <p className="text-2xl font-kpi text-foreground">98.7%</p>
                </div>
                <Target className="w-6 h-6 text-green-500" strokeWidth={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
