
import { Tabs, TabsList } from "@radix-ui/react-tabs";
import { SoftSkillsDashboard } from "@/components/plano-carreira/soft-skills-vw";
import { TabsContent, TabsTrigger } from "@/components/ui/tabs";

import { HardSkillsVwTable } from "@/components/plano-carreira/hard-skills-vw";
import { ComentarioGeral } from "@/components/plano-carreira/comentario-geral";


export default function ViewColaboradorPage() {
    return (

        <div className="m-10">
            <Tabs defaultValue="hard" >
                <TabsList className="mb-4">
                    <TabsTrigger value="hard" className="text-lg font-semibold" >
                        Hard Skills
                    </TabsTrigger>
                    <TabsTrigger value="soft" className="text-lg font-semibold">
                        Soft Skills
                    </TabsTrigger>
                </TabsList>

                <div className="rounded-md border">
                    <ComentarioGeral />
                    <TabsContent value="hard">
                        <HardSkillsVwTable />
                    </TabsContent>
                    <TabsContent value="soft">
                        <SoftSkillsDashboard />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
