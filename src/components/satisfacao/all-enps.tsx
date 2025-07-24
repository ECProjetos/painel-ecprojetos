'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchAllEnps } from "@/app/actions/satisfacao/criar-enps"
import { Card } from "../ui/card";


import { useEffect, useState } from "react";
import DownloadEnpsButton from "./csv";

export default function AllEnps() {
    const [allEnpsResult, setAllEnpsResult] = useState<any>(null);

    useEffect(() => {
        fetchAllEnps().then(setAllEnpsResult);
    }, []);
    function getStatusLabel(status: any) {
        return (
            <span className={status ? "text-green-600" : "text-red-600"}>
                {status ? "Ativo" : "Inativo"}
            </span>
        );
    }

    return (
        <>
            <h1 className="font-bold text-3xl text-center mb-7">Formulários existentes</h1>
            {allEnpsResult?.data && Array.isArray(allEnpsResult.data) && allEnpsResult.data.length > 0
                ? (
                    <div className="mx-auto w-5xl flex flex-col gap-5">
                        {allEnpsResult.data.map((item: any, idx: number) => (
                            <Card className="text-center" key={idx}>
                                <div className="p-6 flex flex-col items-center">
                                    <div className="text-xl font-semibold mb-2">
                                        {process.env.NEXT_PUBLIC_FRONTEND_URL}enps/{item.ano}/{item.periodo}
                                    </div>
                                    <div className="mt-2">
                                        <DownloadEnpsButton ano={item.ano} periodo={item.periodo} />
                                    </div>

                                    <div className="mt-2">
                                        Status: <span className="font-medium">{getStatusLabel(item.status)}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
                : (
                    <Card className="mx-auto w-5xl text-center">
                        Nenhum resultado encontrado
                    </Card>
                )
            }
        </>
    );
}