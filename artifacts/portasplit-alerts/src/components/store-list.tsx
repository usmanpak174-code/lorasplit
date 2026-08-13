import * as React from "react";
import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, Building2, Clock } from "lucide-react";
import { useListStores, useListChains } from "@workspace/api-client-react";
import type { StoreWithStock, ChainStat } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface StoreListProps {
  productId?: number;
}

export function StoreList({ productId = 1 }: StoreListProps) {
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState<number[]>([50]);
  const [chain, setChain] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  
  const [filters, setFilters] = useState({
    postalCode: "",
    radius: 50,
    chain: "all",
    status: "all"
  });

  const { data: chains = [] } = useListChains();
  
  const queryParams = {
    productId,
    ...(filters.postalCode ? { postalCode: filters.postalCode, radiusKm: filters.radius } : {}),
    ...(filters.chain !== "all" ? { chain: filters.chain } : {}),
    ...(filters.status !== "all" ? { status: filters.status as any } : {}),
  };

  const { data: stores = [], isLoading } = useListStores(queryParams);

  const applyFilters = () => {
    setFilters({
      postalCode,
      radius: radius[0],
      chain,
      status
    });
  };

  const clearFilters = () => {
    setPostalCode("");
    setRadius([50]);
    setChain("all");
    setStatus("all");
    setFilters({
      postalCode: "",
      radius: 50,
      chain: "all",
      status: "all"
    });
  };

  const formatDistance = (dateStr: string | null) => {
    if (!dateStr) return "Inconnu";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) return `il y a ${diffMins} min`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    return `il y a ${Math.round(diffHours / 24)} j`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full flex-1">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase">Code postal</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="75001" 
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="pl-9 font-mono uppercase"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase flex justify-between">
              <span>Rayon</span>
              <span className="text-primary">{radius[0]} km</span>
            </label>
            <div className="pt-3 pb-2 px-1">
              <Slider 
                value={radius} 
                onValueChange={setRadius} 
                max={200} 
                step={5}
                disabled={!postalCode}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase">Enseigne</label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger className="font-mono">
                <SelectValue placeholder="Toutes les enseignes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les enseignes</SelectItem>
                {chains.map((c: ChainStat) => (
                  <SelectItem key={c.chain} value={c.chain}>{c.chain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase">Statut</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="font-mono">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="in_stock">En stock</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
                <SelectItem value="out_of_stock">Épuisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="icon" onClick={clearFilters} title="Effacer les filtres">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={applyFilters} className="flex-1 md:w-auto font-mono">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Appliquer les filtres
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground font-mono flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            Chargement des magasins...
          </div>
        ) : stores.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono">
            <MapPin className="mx-auto h-8 w-8 mb-4 opacity-50" />
            Aucun magasin trouvé selon vos critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-mono border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Magasin</th>
                  <th className="px-6 py-4 font-semibold">Localisation</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold text-right">Dernière vérif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stores.map((store: StoreWithStock) => (
                  <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{store.name}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-mono">
                        <Building2 className="h-3 w-3" />
                        {store.chain}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{store.city}</div>
                      <div className="text-xs text-muted-foreground font-mono">{store.postalCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={store.stockStatus} />
                        {store.stockQty != null && store.stockStatus !== 'out_of_stock' && (
                          <Badge variant="outline" className="font-mono bg-background">
                            {store.stockQty} unité{store.stockQty !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatDistance(store.lastCheckedAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
