import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function TextSubmit() {
    return (
        <>
            <Textarea />
            <Button type="submit" className="mt-8 w-full text-white py-3">
                Enviar Avaliação
            </Button>
        </>
    )
};