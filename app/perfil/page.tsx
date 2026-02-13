import { cityOptions, schoolYearOptions, supportedAuthProviders } from "@/lib/platform-config";

export default function PerfilPage() {
  return (
    <section>
      <h1>Perfil Gamer</h1>
      <div className="card">
        <h3>Autenticação</h3>
        <p>Google Auth ativo + arquitetura preparada para Discord/Apple.</p>
        <p className="muted">Providers: {supportedAuthProviders.map((p) => `${p.id} (${p.status})`).join(", ")}</p>
      </div>
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card"><h3>Campos obrigatórios pós-login</h3><p>Nome único, cidade, escola, ano letivo e matérias iniciais.</p></div>
        <div className="card"><h3>Customizações</h3><p>Foto, banner, cor, moldura e badge ativa compráveis com Total XP.</p></div>
        <div className="card"><h3>Cidade e ano</h3><p>{cityOptions.join(" • ")}</p><p>{schoolYearOptions.join(" • ")}</p></div>
      </div>
    </section>
  );
}
