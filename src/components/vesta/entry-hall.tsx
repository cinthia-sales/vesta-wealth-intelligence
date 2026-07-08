import vestaHero from "@/assets/vesta-lineart.png";
import type { ProfileId } from "@/lib/profile-derive";

export type HallView = {
  id: ProfileId;
  name: string;
  subtitle: string;
  initials: string;
  consolidated?: boolean;
  waitingForData?: boolean;
};

export type HallDomus = {
  id: string;
  name: string;
  vestaName?: string;
  memberCount: number;
  canManage: boolean;
  views: HallView[];
};

export type HallPending = {
  id: string;
  domusId?: string;
  label: string;
  detail: string;
  kind: "request" | "data" | "action";
};

export function EntryHall({
  name,
  domus,
  pending,
  onOpenView,
  onManageDomus,
  onReviewPending,
  onLogout,
}: {
  name: string;
  domus: HallDomus[];
  pending: HallPending[];
  onOpenView: (domusId: string, profileId: ProfileId) => void;
  onManageDomus: (domusId: string) => void;
  onReviewPending: (domusId: string) => void;
  onLogout: () => void;
}) {
  return (
    <main className="vesta-hall">
      <header className="vesta-hall__hero">
        <img src={vestaHero} alt="" className="vesta-hall__deusa" />
        <div>
          <p className="public-domus-kicker">Vesta · Domus et Patrimonium</p>
          <h1>Bem-vinda, {name}</h1>
          <p>Escolha um Domus e a visão que deseja acompanhar.</p>
        </div>
        <button className="vesta-hall__logout" onClick={onLogout}>Sair</button>
      </header>

      {pending.length > 0 && (
        <section className="vesta-hall__pending" aria-label="Pendências">
          <div className="vesta-hall__section-title">
            <span>Pendências</span><b>{pending.length}</b>
          </div>
          <div className="vesta-hall__pending-grid">
            {pending.map((item) => (
              <article key={item.id} className={`vesta-hall__pending-item is-${item.kind}`}>
                <span className="vesta-hall__pending-dot" />
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                {item.domusId && (
                  <button className="vesta-hall__pending-action" onClick={() => onReviewPending(item.domusId!)}>
                    Analisar pedido
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="vesta-hall__domus-list">
        {domus.map((item) => (
          <article className="vesta-hall__domus" key={item.id}>
            <header className="vesta-hall__domus-head">
              <div>
                <span className="vesta-hall__eyebrow">Domus</span>
                <h2>{item.name}</h2>
                <p>
                  {item.vestaName ? `Sob supervisão de ${item.vestaName}` : "Sob supervisão da Vesta"}
                  {` · ${item.memberCount} ${item.memberCount === 1 ? "membro" : "membros"}`}
                </p>
              </div>
              {item.canManage && (
                <button className="vesta-hall__manage" onClick={() => onManageDomus(item.id)}>
                  Gerir Domus
                </button>
              )}
            </header>

            {item.views.length > 0 ? (
              <div className="vesta-hall__views">
                {item.views.map((view) => (
                  <button
                    key={view.id}
                    className={`vesta-hall__view${view.consolidated ? " is-consolidated" : ""}`}
                    onClick={() => onOpenView(item.id, view.id)}
                  >
                    <span className="vesta-hall__avatar">{view.initials}</span>
                    <span className="vesta-hall__view-copy">
                      <strong>{view.name}</strong>
                      <small>{view.subtitle}</small>
                      {view.waitingForData && <em>Aguardando importação</em>}
                    </span>
                    <span className="vesta-hall__open">
                      Abrir carteira →
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="vesta-hall__empty">Nenhuma visão disponível neste Domus.</div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
