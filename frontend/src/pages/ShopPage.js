import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Zap, Lock, Check, ShoppingBag } from "lucide-react";
import { toast, Toaster } from "sonner";

const RARITY_STYLES = {
  common: { border: "border-zinc-500/30", glow: "", text: "text-zinc-400", label: "Comum" },
  rare: { border: "border-blue-500/30", glow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]", text: "text-blue-400", label: "Raro" },
  epic: { border: "border-purple-500/30", glow: "hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]", text: "text-purple-400", label: "Epico" },
  legendary: { border: "border-yellow-500/30", glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]", text: "text-yellow-400", label: "Lendario" },
};

const TYPE_LABELS = { frame: "Molduras", color: "Cores", badge: "Badges", banner: "Banners" };

export default function ShopPage() {
  const { refreshUser } = useAuth();
  const [shopData, setShopData] = useState({ items: [], total_xp: 0 });
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      try { const res = await api.get("/shop"); setShopData(res.data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleBuy = async (itemId) => {
    setBuying(itemId);
    try {
      await api.post(`/shop/buy/${itemId}`);
      toast.success("Item comprado!");
      refreshUser();
      const res = await api.get("/shop");
      setShopData(res.data);
    } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
    finally { setBuying(null); }
  };

  const filtered = typeFilter === "all" ? shopData.items : shopData.items.filter((i) => i.type === typeFilter);
  const grouped = { legendary: filtered.filter(i => i.rarity === "legendary"), epic: filtered.filter(i => i.rarity === "epic"), rare: filtered.filter(i => i.rarity === "rare"), common: filtered.filter(i => i.rarity === "common") };

  return (
    <div className="space-y-5" data-testid="shop-page">
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(255,26,26,0.2)', color: '#f2f2f2' }}} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest">GASTAR XP</p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white mt-1">LOJA</h1>
        </div>
        <div className="glass-strong px-4 py-2 flex items-center gap-2" data-testid="shop-balance">
          <Zap className="h-4 w-4 text-neon-red" />
          <span className="font-stat text-xl font-bold text-white">{shopData.total_xp}</span>
          <span className="text-[10px] font-mono text-zinc-500">XP</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ v: "all", l: "Todos" }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ v: k, l: v }))].map((t) => (
          <button key={t.v} onClick={() => setTypeFilter(t.v)} data-testid={`filter-${t.v}`}
            className={`px-3 py-1.5 text-xs font-heading font-bold tracking-wider rounded-lg border transition-all ${
              typeFilter === t.v ? "bg-neon-red/15 text-neon-red border-neon-red/30 neon-border" : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([rarity, items]) => {
            if (items.length === 0) return null;
            const s = RARITY_STYLES[rarity];
            return (
              <div key={rarity}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${rarity === "legendary" ? "bg-yellow-400" : rarity === "epic" ? "bg-purple-400" : rarity === "rare" ? "bg-blue-400" : "bg-zinc-400"}`} />
                  <h2 className={`font-heading text-sm font-bold tracking-wider ${s.text}`}>{s.label}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <div key={item.item_id} className={`glass-card border-2 ${s.border} ${s.glow} p-4 transition-all`} data-testid={`shop-item-${item.item_id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{item.description}</p>
                        </div>
                        <Badge className={`${s.text} bg-transparent border-current/20 text-[9px] font-mono`}>{TYPE_LABELS[item.type]}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-neon-red" />
                          <span className="font-stat text-lg font-bold text-white">{item.price}</span>
                        </div>
                        {item.owned ? (
                          <Badge className="bg-neon-red/10 text-neon-red border-neon-red/20 text-[10px] font-mono">
                            <Check className="h-3 w-3 mr-0.5" /> Adquirido
                          </Badge>
                        ) : (
                          <button onClick={() => handleBuy(item.item_id)} disabled={buying === item.item_id || shopData.total_xp < item.price}
                            className="h-8 px-3 rounded-lg bg-neon-red/15 text-neon-red text-xs font-heading font-bold tracking-wider border border-neon-red/20 hover:bg-neon-red/25 disabled:opacity-30 transition-all"
                            data-testid={`buy-${item.item_id}`}>
                            {shopData.total_xp < item.price ? <><Lock className="h-3 w-3 mr-1 inline" />XP</> : <><ShoppingBag className="h-3 w-3 mr-1 inline" />Comprar</>}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
