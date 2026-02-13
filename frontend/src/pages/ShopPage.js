import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ShoppingBag, Zap, Lock, Check } from "lucide-react";
import { toast, Toaster } from "sonner";

const RARITY_STYLES = {
  common: { border: "border-zinc-500", text: "text-zinc-400", bg: "bg-zinc-500/10", label: "Comum" },
  rare: { border: "border-blue-500", text: "text-blue-400", bg: "bg-blue-500/10", label: "Raro" },
  epic: { border: "border-purple-500", text: "text-purple-400", bg: "bg-purple-500/10", label: "Epico" },
  legendary: { border: "border-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10", label: "Lendario" },
};

const TYPE_LABELS = {
  frame: "Molduras",
  color: "Cores",
  badge: "Badges",
  banner: "Banners",
};

export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const [shopData, setShopData] = useState({ items: [], total_xp: 0 });
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.get("/shop");
        setShopData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []);

  const handleBuy = async (itemId) => {
    setBuying(itemId);
    try {
      await api.post(`/shop/buy/${itemId}`);
      toast.success("Item comprado!");
      refreshUser();
      const res = await api.get("/shop");
      setShopData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao comprar");
    } finally {
      setBuying(null);
    }
  };

  const filteredItems = typeFilter === "all"
    ? shopData.items
    : shopData.items.filter((i) => i.type === typeFilter);

  const groupedByRarity = {
    legendary: filteredItems.filter((i) => i.rarity === "legendary"),
    epic: filteredItems.filter((i) => i.rarity === "epic"),
    rare: filteredItems.filter((i) => i.rarity === "rare"),
    common: filteredItems.filter((i) => i.rarity === "common"),
  };

  return (
    <div className="space-y-6" data-testid="shop-page">
      <Toaster position="top-right" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Gastar XP</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight">Loja</h1>
        </div>
        <div className="flex items-center gap-2 p-3 border border-border bg-card" data-testid="shop-balance">
          <Zap className="h-4 w-4" />
          <span className="font-heading text-xl font-black">{shopData.total_xp}</span>
          <span className="text-xs font-mono text-muted-foreground">XP</span>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "all", label: "Todos" }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))].map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            data-testid={`filter-${t.value}`}
            className={`px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider border transition-colors ${
              typeFilter === t.value
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByRarity).map(([rarity, items]) => {
            if (items.length === 0) return null;
            const style = RARITY_STYLES[rarity];
            return (
              <div key={rarity}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 ${style.border.replace("border", "bg")}`} />
                  <h2 className={`font-heading text-lg font-bold uppercase tracking-wider ${style.text}`}>
                    {style.label}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <Card
                      key={item.item_id}
                      className={`bg-card border-2 ${style.border} hover:${style.bg} transition-all`}
                      data-testid={`shop-item-${item.item_id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                          <Badge className={`${style.bg} ${style.text} border-0 text-[10px] font-mono`}>
                            {TYPE_LABELS[item.type] || item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span className="font-heading text-lg font-black">{item.price}</span>
                          </div>
                          {item.owned ? (
                            <Badge variant="secondary" className="text-xs font-mono">
                              <Check className="h-3 w-3 mr-1" /> Adquirido
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleBuy(item.item_id)}
                              disabled={buying === item.item_id || shopData.total_xp < item.price}
                              className="h-8 bg-foreground text-background font-heading font-bold uppercase text-xs tracking-wider"
                              data-testid={`buy-${item.item_id}`}
                            >
                              {buying === item.item_id ? "..." : shopData.total_xp < item.price ? (
                                <><Lock className="h-3 w-3 mr-1" /> XP</>
                              ) : (
                                <><ShoppingBag className="h-3 w-3 mr-1" /> Comprar</>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
