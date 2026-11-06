# Sécurité et maintenance de la démo

## Protections applicatives

Les données du profil sont sélectionnées explicitement dans `src/lib/profile.ts`. Aucun hash de mot de passe ou de code de sécurité ne doit être transmis à un composant client.

La connexion client utilise un lien e-mail de 15 minutes. À la saisie de l'adresse, le serveur sélectionne le mode de connexion. Une adresse administrateur déclenche la demande du mot de passe, puis le code de sécurité reste obligatoire. Cette différence de parcours permet de confirmer une adresse administrateur candidate. La vérification est limitée par adresse e-mail, par IP et globalement. Le fournisseur e-mail refuse la validation d'un lien pour un compte administrateur, y compris par appel direct à l'API.

Les JWT contiennent une empreinte HMAC des justificatifs actuels et un identifiant de connexion aléatoire. L'empreinte est vérifiée en base à chaque lecture de session. La modification du mot de passe, du code ou du rôle, ainsi que la suppression du compte, invalident les anciens JWT. Le cookie de code de sécurité est signé, limité à 30 minutes, lié au compte, aux justificatifs et à la connexion concernée.

Le code à 6 chiffres reste un secret permanent ; il ne constitue pas un facteur indépendant comme une passkey ou TOTP. Son remplacement par une méthode MFA avec enrôlement et récupération doit faire l'objet d'une évolution dédiée pour éviter de bloquer l'administrateur.

Les quotas utilisent un seul `INSERT ... ON CONFLICT ... RETURNING` PostgreSQL pour réserver une tentative. Ils ne nécessitent pas de nouvelle migration. Les identifiants des compteurs sont hachés par HMAC ; un quota global et un quota réseau précèdent les quotas par compte. En dehors de Vercel, l'origine réseau est regroupée dans un quota local, sans faire confiance aux en-têtes transmis par un client arbitraire. Un reverse proxy auto-hébergé devra être configuré explicitement avant d'utiliser ses adresses transmises.

Les routes de paiement et de téléversement vérifient l'origine du navigateur et leurs quotas. Le webhook Stripe conserve sa vérification de signature, indépendante des contrôles d'origine du navigateur. Les images sont décodées et réencodées par sharp, avec une limite de pixels et suppression des métadonnées.

Le proxy fournit une CSP avec un nonce par requête. Le layout attend une connexion pour garantir le rendu dynamique et l'application des nonces, également transmis à Framer Motion. Les scripts et blocs de styles inline exigent le nonce. Seuls les attributs de style nécessaires à React et aux animations utilisent `style-src-attr 'unsafe-inline'` ; cette exception n'autorise ni script inline ni `eval` en production. Les pages sensibles vérifient leurs autorisations au plus près des lectures, et les actions serveur vérifient les leurs indépendamment.

La démo utilise `X-Robots-Tag: noindex, nofollow`. `robots.txt` n'énumère aucun espace privé et n'annonce pas de sitemap inexistant. Lors du lancement commercial, `SITE_INDEXABLE=true` autorisera l'indexation des pages publiques, tout en conservant la non-indexation des espaces de connexion, de compte, d'administration et de commande. Le fichier robots autorise le parcours des pages pour que les moteurs puissent lire l'en-tête `noindex` ; il ne constitue pas un mécanisme d'authentification.

Les fichiers statiques publics et `robots.txt` peuvent recevoir un CORS `*` de la plateforme. Cela ne donne aucun accès aux données de session : les API sensibles ne renvoient ni origine CORS permissive ni autorisation de credentials intersites. Ne pas ajouter de politique CORS globale pour satisfaire un scanner qui ne distingue pas ces ressources.

## Variables à conserver côté serveur

Configurer `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, les accès SMTP, les clés serveur Stripe et les paramètres Supabase dans l'environnement du déploiement. Seule la clé Stripe publiable peut utiliser le préfixe `NEXT_PUBLIC_`.

Choisir un `NEXTAUTH_SECRET` aléatoire avec au moins 32 octets d'entropie. Le code accepte encore une ancienne valeur non vide afin qu'une mise à jour du code ne coupe pas toute connexion avant sa rotation. Lors de la rotation, actualiser de manière coordonnée le déploiement et l'environnement local ; tous les utilisateurs devront se reconnecter.

Les images Supabase doivent appartenir au domaine défini dans `SUPABASE_URL`. Le bucket de médias publics ne doit contenir que des médias publiables ; sa clé serveur ne doit jamais être envoyée au navigateur. Le projet ne contrôle pas les règles RLS ni les permissions des services cloud.

## Rotation des accès administrateur

Avec les variables de la base réellement utilisée par la démo :

```powershell
npm run security:rotate-admin
```

La commande privilégie `DIRECT_URL`, conserve le même administrateur et ne modifie ni produit ni commande. Elle génère un mot de passe aléatoire et un nouveau code à 6 chiffres, les écrit dans `.private/admin-access-<date>.json`, puis remplace les empreintes et supprime les sessions en base et liens e-mail de cet administrateur. L'empreinte des justificatifs du code corrigé révoque ses anciens JWT et cookies 2FA.

Le fichier privé est créé avant la transaction pour conserver les accès même en cas de résultat réseau ambigu. Si `applied` n'est pas confirmé, vérifier le résultat avant de relancer. Ne jamais copier ce fichier dans une issue, un message ou un commit. Le déplacer dans un gestionnaire de mots de passe et retirer la copie une fois la connexion vérifiée.

## Contrôles avant publication

```powershell
npm run test:security
npx tsc --noEmit
npm run build
npm audit --audit-level=high
npm run security:scan
```

Le scanner normal analyse l'index Git, donc les fichiers doivent être ajoutés avec `git add` avant le contrôle. Pour vérifier l'historique :

```powershell
node scripts/check-secrets.mjs --history
```

Ce scanner est un contrôle par motifs, pas une garantie d'absence de secrets arbitraires. Le workflow GitHub contrôle l'historique et les dépendances et exécute les tests de sécurité. Dependabot propose les mises à jour npm et GitHub Actions. Compléter ces fichiers par Secret Scanning et Push Protection dans les réglages GitHub du dépôt.

Les tests PostgreSQL de concurrence utilisent PGlite en mémoire. Les tests des callbacks de connexion remplacent uniquement la lecture utilisateur par des fixtures et ne contactent pas la base distante. Aucun e-mail ni paiement n'est envoyé par cette suite.

## Historique contenant des données sensibles

Un commit de suppression ne suffit pas à retirer un ancien secret. Renouveler les accès, sauvegarder localement, réécrire une copie de l'historique puis comparer les fichiers actuels avant tout remplacement distant. Retirer toutes les versions de `dev.db` et de `prisma/data_dump.json` et remplacer le seed historique contenant des littéraux par sa version utilisant l'environnement.

La réécriture change les SHA des commits concernés. Utiliser un `--force-with-lease` limité à la branche prévue pour éviter d'écraser un nouveau travail distant. Les autres clones doivent repartir de l'historique nettoyé, sans fusionner l'ancien. Les copies déjà téléchargées, sauvegardes locales et éventuelles références GitHub mises en cache demandent un traitement séparé ; ne pas considérer les anciennes valeurs comme redevenues secrètes.

## Vérifications réalisées le 30 octobre 2026

- Compilation de production et contrôle TypeScript réussis.
- Treize tests de sécurité réussis, dont 40 requêtes concurrentes dans PostgreSQL embarqué avec exactement 5 réservations acceptées.
- Audit npm complet : aucune vulnérabilité signalée après mise à jour.
- Vérification des nouveaux justificatifs contre la base distante et rejet des anciennes valeurs exposées.
- Tests HTTP sur le serveur local de production connecté directement à la base de la démo : connexion administrateur, obligation du PIN, validation du PIN, lecture des commandes après validation, profil sans empreintes, CSP avec nonce, refus des accès anonymes, refus d'une origine étrangère et d'un webhook sans signature.
- Aucun produit, commande ou paiement créé par ces tests. Aucun e-mail envoyé. Les tests de connexion consomment des compteurs de limitation de tentatives.
- Le lint global contient des erreurs préexistantes dans les anciens écrans et scripts ; le lint des modules de sécurité et des principaux fichiers corrigés est contrôlé séparément. Il n'a pas été désactivé globalement.

Ces vérifications locales ne prouvent pas le déploiement du correctif sur Vercel, la délivrabilité des e-mails, le paiement de bout en bout ou les réglages privés GitHub/Supabase.
