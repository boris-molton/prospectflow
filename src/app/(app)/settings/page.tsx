import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="mt-1 text-slate-600">
          Configuration de ton compte et des intégrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connexion Gmail</CardTitle>
          <p className="text-sm text-slate-500">
            Connecte-toi avec Google pour envoyer et suivre tes emails. Les
            permissions Gmail sont demandées lors de la connexion.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Déconnecte-toi et reconnecte-toi avec Google pour actualiser les
            tokens d&apos;accès si nécessaire.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variables d&apos;environnement</CardTitle>
          <p className="text-sm text-slate-500">
            Configure dans ton fichier .env :
          </p>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm">
          <p>DATABASE_URL - PostgreSQL</p>
          <p>NEXTAUTH_SECRET - Secret pour les sessions</p>
          <p>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET - OAuth Google</p>
          <p>OPENAI_API_KEY - Pour la génération d&apos;emails</p>
        </CardContent>
      </Card>
    </div>
  );
}
