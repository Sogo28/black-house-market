// Vérification de santé pour Docker et Coolify : répond tant que le serveur Node tourne.
// Elle ne touche pas à la base exprès : si Supabase est en panne, redémarrer le conteneur
// n'y changerait rien et Coolify le redémarrerait pour rien.

export function GET() {
  return Response.json({ status: "ok" });
}
