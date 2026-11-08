// One tab's safety net: an error while drawing it (bad data in a saved job, a bug) used to empty the whole window.
// Now only that tab shows what happened, with a way back; the error is reported like any other. When the tab's own
// saved work is what breaks it (store = its key), "Repartir de zéro" keeps a copy of it, then clears it.
import { Component, Fragment } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { kit } from '../lib/kit.js';

export class ScreenGuard extends Component {
  state = { error: null, round: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try {
      kit.report({ where: `écran:${this.props.name}`, message: String(error?.message ?? error), stack: `${error?.stack || ''}\n${info?.componentStack || ''}`, name: error?.name });
    } catch {}
  }

  async startOver() {
    const key = this.props.store;
    try {
      const saved = await kit.store.get(key, null);
      if (saved != null) await kit.store.set(`${key}-avant-erreur`, saved); // kept: nothing is lost for good
      await kit.store.set(key, null);
    } catch {}
    window.location.reload();
  }

  render() {
    const { error, round } = this.state;
    if (!error) return <Fragment key={round}>{this.props.children}</Fragment>;
    return (
      <div className="grid h-full place-items-center px-8" role="alert">
        <div className="card max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-warn" />
          <div className="text-[15px] font-semibold">L’onglet {this.props.name} a rencontré une erreur</div>
          <p className="mt-1.5 text-[12.5px] text-mute" data-selectable>{String(error?.message ?? error).slice(0, 300)}</p>
          <p className="mt-2 text-[12px] text-faint">Le reste de l’app continue de marcher. L’erreur a été envoyée dans les rapports (Réglages).</p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="btn" onClick={() => this.setState({ error: null, round: round + 1 })}><RotateCcw size={13} /> Réessayer</button>
            <button className="btn" onClick={() => window.location.reload()}>Recharger l’app</button>
          </div>
          {this.props.store && (
            <p className="mt-4 text-[12px] text-faint">
              L’erreur revient à chaque fois ? <button className="underline hover:text-ink" onClick={() => this.startOver()}>Repartir de zéro dans cet onglet</button> (son travail en cours est gardé de côté, dans les données de l’app).
            </p>
          )}
        </div>
      </div>
    );
  }
}
