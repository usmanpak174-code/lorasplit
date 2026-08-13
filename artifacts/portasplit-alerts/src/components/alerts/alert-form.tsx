import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, MapPin, Mail, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCreateAlert, useCreateCheckout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse email valide." }),
  postalCode: z.string().min(4, "Code postal requis").max(10),
  radiusKm: z.coerce.number().min(5).max(100),
  planId: z.string().min(1, "Veuillez sélectionner un forfait"),
});

type FormValues = z.infer<typeof formSchema>;

interface AlertFormProps {
  productId?: number;
  plans: any[];
}

export function AlertForm({ productId = 1, plans = [] }: AlertFormProps) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const createAlert = useCreateAlert();
  const createCheckout = useCreateCheckout();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      postalCode: "",
      radiusKm: 20,
      planId: plans.length > 0 ? plans[0].id : "plan_1week",
    },
  });

  async function onSubmit(data: FormValues) {
    let checkoutUrl = "";

    // Map plan ID to Polar product ID
    const polarMap: Record<string, string> = {
      plan_1week: "197b7170-185b-4fa9-89e1-659fd5828502",
      week: "197b7170-185b-4fa9-89e1-659fd5828502",
      plan_1month: "a076954a-18cc-4063-99b6-b5694a52807d",
      month: "a076954a-18cc-4063-99b6-b5694a52807d",
      plan_2months: "aec4bb6f-a89b-4a32-8065-cb5041c4bccd",
      "two-months": "aec4bb6f-a89b-4a32-8065-cb5041c4bccd",
    };

    const targetPolarId = polarMap[data.planId] || "197b7170-185b-4fa9-89e1-659fd5828502";
    const directPolarUrl = `https://buy.polar.sh/${targetPolarId}?customer_email=${encodeURIComponent(data.email)}`;

    try {
      // Create the alert subscription
      await createAlert.mutateAsync({
        data: {
          email: data.email,
          productId,
          postalCode: data.postalCode,
          radiusKm: data.radiusKm,
          planId: data.planId,
        }
      }).catch(() => null);
      
      // Attempt to initiate Polar.sh checkout redirect via API
      try {
        const result = await createCheckout.mutateAsync({
          data: {
            email: data.email,
            planId: data.planId,
            productId,
          }
        });
        checkoutUrl = result?.checkoutUrl || directPolarUrl;
      } catch (e) {
        checkoutUrl = directPolarUrl;
      }
    } catch (error) {
      checkoutUrl = directPolarUrl;
    }

    // Always ensure user gets redirected to Polar payment
    if (!checkoutUrl) checkoutUrl = directPolarUrl;

    window.location.href = checkoutUrl;
  }

  if (isSuccess) {
    return (
      <Card className="w-full border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-mono text-foreground">Alerte créée</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Nous avons envoyé un lien de confirmation à votre adresse email. Cliquez dessus pour activer vos alertes.
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsSuccess(false)} className="mt-4 font-mono text-xs">
            Créer une autre alerte
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-primary/20" id="alerts">
      <CardHeader className="bg-muted/50 border-b border-border/50 pb-6">
        <CardTitle className="font-mono flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Activer le radar
        </CardTitle>
        <CardDescription className="text-sm">
          Recevez un email dès que du stock PortaSplit est détecté près de chez vous.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pt-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Email de réception</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="vous@example.com" className="pl-9 font-mono" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Localisation (Code postal)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="ex. 75001" className="pl-9 font-mono uppercase" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="radiusKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Rayon de recherche</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val, 10))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="font-mono">
                          <SelectValue placeholder="Choisir le rayon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">5 km</SelectItem>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="20">20 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                        <SelectItem value="100">100 km</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Durée de surveillance</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono h-14">
                        <SelectValue placeholder="Choisir un forfait" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id} className="py-3">
                          <div className="flex justify-between w-full pr-4 gap-4">
                            <span className="font-bold">{plan.name}</span>
                            <span className="text-muted-foreground">€{plan.priceEur.toFixed(2)}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {plans.length === 0 && (
                        <>
                          <SelectItem value="plan_1week">1 Semaine (24h/24) - €4.90</SelectItem>
                          <SelectItem value="plan_1month">1 Mois (24h/24) - €9.90</SelectItem>
                          <SelectItem value="plan_2months">2 Mois (24h/24) - €14.90</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Paiement unique. Sans renouvellement automatique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="bg-muted/50 border-t border-border/50 py-4">
            <Button 
              type="submit" 
              className="w-full font-mono text-sm uppercase tracking-wider font-bold h-12"
              disabled={createAlert.isPending || createCheckout.isPending}
            >
              {createAlert.isPending || createCheckout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initialisation...
                </>
              ) : (
                "Activer les alertes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
