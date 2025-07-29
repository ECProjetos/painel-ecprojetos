import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import PontoForm from "./inicio/ponto";
import RelatorioColaborador from "./inicio/relatorio-colaborador";

export function TabGeneral(){
    return (
        <div className="mt-10">
        <Tabs defaultValue="ponto">
          <TabsList className="flex border-gray-200 bg-white gap-1 px-4 pt-2 mx-4">
            <TabsTrigger
              value="ponto"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              📝 Registro de ponto
            </TabsTrigger>
            <TabsTrigger
              value="relatorio"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              👤 Meu Relatório
            </TabsTrigger>

          </TabsList>

          <TabsContent value="ponto">
            <PontoForm />
          </TabsContent>
          <TabsContent value="relatorio">
            <RelatorioColaborador />
          </TabsContent>
        </Tabs>
      </div>
    )
}