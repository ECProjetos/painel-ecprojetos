import { MarcarPonto } from "./marcar-ponto";
import { StatusUsuario } from "./satatus-usuario";

export function PainelPonto({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <StatusUsuario userId={userId} />

      <MarcarPonto userId={userId} />
    </div>
  );
}
