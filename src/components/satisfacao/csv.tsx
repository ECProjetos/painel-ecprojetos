'use client';

import { fetchEnpsAtivo } from "@/app/actions/criar-enps";
import { useEffect, useState } from "react"


export default function ParaCsv() {
    const [allEnpsResult, setEnpsResult] = useState<object | null>(null);

    useEffect(() => {
        fetchEnpsAtivo().then(setEnpsResult);
    }, []);

    return (
        <div>
            {allEnpsResult && <pre>{JSON.stringify(allEnpsResult, null, 2)}</pre>}
        </div>
    );
}