'use client';

import CadastroInventario from "@/components/inventário/cadastro-inventario";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export default function PaginaInventario() {
  return (
    <div className="m-10 flex-col justify-center">
      <Card className="p-8 w-full mb-5">
        <CardHeader>
          <h1 className="font-semibold text-3xl">Sistema de Inventário</h1>
          <p className="text-sm text-gray-500">
            Consultoria em Engenharia - Controle de Patrimônio
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="cadastro">
        <TabsList className="w-full">
          <TabsTrigger value="cadastro">📝 Cadastro</TabsTrigger>
          <TabsTrigger value="estoque">📊 Estoque</TabsTrigger>
          <TabsTrigger value="relatorio">📋 Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro">
          <CadastroInventario/>
        </TabsContent>
        <TabsContent value="estoque">
          <p>Conteúdo de Estoque</p>
        </TabsContent>
        <TabsContent value="relatorio">
          <p>Conteúdo de Relatório</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
