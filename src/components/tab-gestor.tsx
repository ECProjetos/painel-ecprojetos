import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import PontoForm from "./inicio/ponto";
import BancoHorasPage from "./inicio/banco-horas";
import { ColaboradoresPage } from "./inicio/colaboradores_page";
import RelatorioColaborador from "./inicio/relatorio-colaborador";
import RelatorioRh from "./inicio/relatorio-rh";

export function TabGestor(){
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
              value="banco"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              ⏰ Horas Trabalhadas
            </TabsTrigger>
            <TabsTrigger
              value="relatorios"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              📊 Relatórios
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
            <TabsTrigger
              value="configuracoes"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              ⚙️ Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ponto">
            <PontoForm />
          </TabsContent>
          <TabsContent value="banco">
            <BancoHorasPage />
          </TabsContent>
          <TabsContent value="relatorios">
            <RelatorioRh/>
          </TabsContent>
          <TabsContent value="relatorio">
            <RelatorioColaborador />
          </TabsContent>
          <TabsContent value="configuracoes">
            <ColaboradoresPage />
          </TabsContent>
        </Tabs>
      </div>
    )
}