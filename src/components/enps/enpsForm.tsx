'use client';

import { useActionState } from 'react';

export default function FormEnps (){
  const [state, setFormState] = useActionState(SendEnpsForm, undefined);

  const linearScaleOptions = [1, 2, 3, 4, 5];

  const renderLinearScale = (name: string, label: string) => (
    <div>
      <p><strong>{label}</strong></p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {linearScaleOptions.map((val) => (
          <label key={`${name}-${val}`}>
            <input type="radio" name={name} value={val} required />
            {val}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <form action={SendEnpsForm} method="post">
      <div>
        <label htmlFor="department"><strong>Qual é o seu departamento?</strong></label><br />
        <select id="department" name="department" required>
          <option value="">Selecione</option>
          <option value="Administrativo">Administrativo</option>
          <option value="Financeiro">Financeiro</option>
          <option value="Marketing">Marketing</option>
          <option value="Comercial">Comercial</option>
          <option value="Engenharia">Engenharia</option>
          <option value="Meio Ambiente">Meio Ambiente</option>
          <option value="Economia">Economia</option>
          <option value="Desenvolvimento de Tecnologias">Desenvolvimento de Tecnologias</option>
        </select>
      </div>
      <div>
        <label htmlFor="enpsScore"><strong>Em uma escala de 0 a 10, o quanto você recomendaria a EC a um colega ou amigo como um bom lugar para trabalhar?</strong></label><br />
        <input type="number" id="enpsScore" name="enpsScore" min={0} max={10} required />
      </div>

      <div>
        <label htmlFor="enpsReason"><strong>Por favor, conte brevemente por que você escolheu essa nota:</strong></label><br />
        <textarea id="enpsReason" name="enpsReason" rows={4} cols={50} required />
      </div>

      {renderLinearScale("centradoCliente", "3.1 Centrado no Cliente")}
      {renderLinearScale("qualidadeAssegurada", "3.2 Qualidade Assegurada")}
      {renderLinearScale("avancoTecnologico", "3.3 Avanço Tecnológico")}
      {renderLinearScale("eficienciaDinamica", "3.4 Eficiência Dinâmica")}
      {renderLinearScale("colaboracaoIntegral", "3.5 Colaboração Integral")}

      {renderLinearScale("gestaoDireta", "O quanto a sua gestão direta te valoriza, te escuta, apoia e te ajuda a se desenvolver como profissional?")}

      {renderLinearScale("visaoFuturo", "Visão de futuro na empresa")}

      <div>
        <button type="submit">Enviar</button>
      </div>
    </form>
  );
};

