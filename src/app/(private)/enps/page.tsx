import { fetchAllEnps } from '@/app/actions/satisfacao/criar-enps'
import CriarEnpsForm from '@/components/satisfacao/form-enps'
import AllEnps from '@/components/satisfacao/all-enps'
import ParaCsv from '@/components/satisfacao/csv'

export default async function createEnpsPage() {
    const allEnps = await fetchAllEnps()
    return (
        <>
            <CriarEnpsForm />
            {allEnps.data && allEnps.data.length > 0 && <AllEnps />}
        </>
    )

}