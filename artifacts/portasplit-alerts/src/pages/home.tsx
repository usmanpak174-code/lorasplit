import * as React from "react";
import { Link } from "wouter";
import { 
  useGetProduct, 
  useGetStockMap, 
  useGetStockSummary, 
  useListPlans 
} from "@workspace/api-client-react";
import type { Plan } from "@workspace/api-client-react";
import { 
  Radar, 
  Activity, 
  Store, 
  Clock, 
  Zap, 
  BellRing, 
  MapPin, 
  CheckCircle2 
} from "lucide-react";

import { Layout } from "@/components/layout";
import { StockMap } from "@/components/map/stock-map";
import { AlertForm } from "@/components/alerts/alert-form";
import { StoreList } from "@/components/store-list";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PRODUCT_ID = 1;

export default function HomePage() {
  const { data: product } = useGetProduct(PRODUCT_ID);
  const { data: mapData = [] } = useGetStockMap({ productId: PRODUCT_ID });
  const { data: summary } = useGetStockSummary({ productId: PRODUCT_ID });
  const { data: plans = [] } = useListPlans();

  const isOutOfStock = summary?.inStockCount === 0;

  // Detect return from Polar checkout
  const urlParams = new URLSearchParams(window.location.search);
  const justPaid = urlParams.get("paid") === "true";

  return (
    <Layout>
      {/* Post-payment success banner */}
      {justPaid && (
        <div className="bg-green-600 text-white py-3 px-4 text-center text-sm font-mono font-medium tracking-wide flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Paiement confirmé ! Vérifiez votre email pour activer vos alertes.
        </div>
      )}

      {/* Announcement Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-xs font-mono font-medium tracking-wide">
        <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
        SYSTÈME ACTIF : Soyez alerté dès que le {product?.name || "PortaSplit"} revient en stock.
      </div>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Title & Form */}
          <div className="space-y-8 flex flex-col justify-center min-h-[400px]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-semibold font-mono text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Radar className="mr-1.5 h-3 w-3 text-primary" />
                Tracker en direct
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                {product?.name || "Midea PortaSplit"}
                <span className="block text-muted-foreground mt-2 text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight">
                  Radar de stock
                </span>
              </h1>
              
              <div className="flex items-center gap-3 pt-2">
                <StatusBadge 
                  status={isOutOfStock ? "out_of_stock" : (summary?.inStockCount ? "in_stock" : "out_of_stock")} 
                  className="text-sm px-3 py-1.5"
                />
                <span className="text-sm font-mono text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  Surveillé toutes les {product?.checkIntervalSeconds ? product.checkIntervalSeconds / 60 : 5} min en France
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-xl blur opacity-30" />
              <AlertForm productId={PRODUCT_ID} plans={plans} />
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="h-[400px] lg:h-[600px] rounded-xl overflow-hidden shadow-2xl ring-1 ring-border relative group">
            <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur px-3 py-2 rounded border border-border shadow-sm flex items-center gap-2 font-mono text-xs">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              EN DIRECT
            </div>
            <StockMap points={mapData} />
          </div>

        </div>
      </section>

      {/* Stats Bar */}
      <div className="border-y border-border/50 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 divide-x divide-border/50">
            <div className="px-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tighter">
                {summary?.totalStores || 282}
              </div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1 flex items-center justify-center gap-1">
                <Store className="h-3 w-3" /> Magasins surveillés
              </div>
            </div>
            <div className="px-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tighter text-amber-500">
                {summary?.outOfStockCount || 0}
              </div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1 flex items-center justify-center gap-1">
                Épuisés
              </div>
            </div>
            <div className="px-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tighter text-green-500">
                {summary?.inStockCount || 0}
              </div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1 flex items-center justify-center gap-1">
                Unités disponibles
              </div>
            </div>
            <div className="px-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tighter flex items-center justify-center">
                <Clock className="h-5 w-5 mr-2 text-primary" /> En direct
              </div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1 flex items-center justify-center gap-1">
                Fréquence de mise à jour
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database View / Store List */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-mono">Répertoire des magasins</h2>
            <p className="text-muted-foreground mt-2">Filtrez et recherchez dans la base de données des magasins.</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
            Base de données synchronisée
          </Badge>
        </div>
        <StoreList productId={PRODUCT_ID} />
      </section>

      {/* How it works */}
      <section className="bg-muted py-16 md:py-24 border-y border-border/50 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Comment ça marche</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Nous exécutons des scripts automatisés 24h/24 qui vérifient le stock du PortaSplit dans des centaines d'APIs de détaillants, à votre place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background/50 border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>1. Définir votre zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Indiquez votre code postal et la distance maximale que vous acceptez pour récupérer l'appareil.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>2. Nous surveillons</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nos serveurs interrogent les systèmes d'inventaire de tous les grands détaillants toutes les 5 minutes, 24h/24.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 border-border/50 shadow-sm ring-1 ring-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 text-primary-foreground">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>3. Alerte instantanée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Dès qu'une unité apparaît dans votre rayon, nous envoyons un email à votre boîte de réception pour que vous puissiez commander avant tout le monde.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24" id="pricing">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight font-mono">Choisir la durée</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Paiements uniques et simples. Sans abonnement, sans frais cachés. Choisissez combien de temps vous souhaitez que nous surveillions pour vous.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.length > 0 ? (
            plans.map((plan: Plan) => (
              <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-primary ring-1 ring-primary shadow-lg scale-105 z-10' : ''}`}>
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold font-mono text-center py-1 uppercase tracking-wider">
                    Le plus populaire
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-mono">{plan.name}</CardTitle>
                  <CardDescription>Paiement unique</CardDescription>
                  <div className="text-4xl font-bold mt-4 font-mono">
                    €{plan.priceEur.toFixed(2)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{plan.durationDays} jours de surveillance 24h/24</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Vérifications toutes les {plan.checkIntervalSeconds / 60} minutes</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Alertes email illimitées</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Tous les {summary?.totalStores || 282} magasins couverts</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full font-mono font-bold" variant={plan.popular ? "default" : "outline"}>
                    <a href="#alerts">Choisir {plan.name}</a>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground font-mono">
              Chargement des forfaits...
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12 font-mono">FAQ</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold">Quelle est la rapidité des alertes ?</h3>
            <p className="text-muted-foreground mt-2">
              Nous vérifions les APIs de tous les détaillants pris en charge toutes les 5 minutes. Dès que notre système détecte du stock positif, un email est envoyé en quelques millisecondes.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Pourquoi dois-je payer ?</h3>
            <p className="text-muted-foreground mt-2">
              Effectuer des vérifications à haute fréquence sur plus de 280 APIs de magasins nécessite des ressources serveur importantes et une infrastructure proxy pour éviter d'être bloqué. Nous facturons un petit frais unique pour couvrir ces coûts.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Puis-je annuler mon alerte ?</h3>
            <p className="text-muted-foreground mt-2">
              Oui, chaque email d'alerte contient un lien de désabonnement en 1 clic. Vous ne serez plus jamais facturé, car il s'agit d'un paiement unique.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Le paiement est-il sécurisé ?</h3>
            <p className="text-muted-foreground mt-2">
              Oui. Nous utilisons Polar.sh pour tous les traitements de paiement. Nous ne voyons ni ne stockons jamais vos informations de carte bancaire.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
