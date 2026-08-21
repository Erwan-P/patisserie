export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl space-y-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-serif font-bold">Informations Légales</h1>
        <p className="text-muted-foreground uppercase tracking-widest text-sm">
          Tout ce que vous devez savoir sur vos droits et notre fonctionnement.
        </p>
      </div>

      <section id="cgv" className="scroll-mt-32 space-y-6">
        <h2 className="text-2xl font-serif font-bold uppercase tracking-widest text-primary border-b border-border pb-4">
          Conditions Générales de Vente (CGV)
        </h2>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            Les présentes conditions générales de vente (CGV) régissent les ventes de produits effectuées sur le site <strong>[Nom du Site]</strong> par la société <strong>[Nom de la Société]</strong>.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">1. Objet</h3>
          <p>
            Les présentes CGV visent à définir les relations contractuelles entre <strong>[Nom de la Société]</strong> et l'acheteur, ainsi que les conditions applicables à tout achat effectué par le biais du site marchand. L'acquisition d'un produit à travers le présent site implique une acceptation sans réserve par l'acheteur des présentes CGV.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">2. Produits et Prix</h3>
          <p>
            Les produits proposés sont ceux qui figurent sur le site <strong>[Nom du Site]</strong>, dans la limite des stocks disponibles. <strong>[Nom de la Société]</strong> se réserve le droit de modifier à tout moment l'assortiment de produits. Les prix figurant sur le site sont des prix TTC en euros tenant compte de la TVA applicable au jour de la commande.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">3. Commandes et Paiement</h3>
          <p>
            L'acheteur peut passer commande en ligne. Le paiement est exigible immédiatement à la commande. Le règlement des achats s'effectue par carte bancaire ou tout autre moyen de paiement proposé sur le site.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">4. Retrait et Livraison</h3>
          <p>
            Les produits sont à retirer en boutique (Click & Collect) à l'adresse <strong>[Adresse de la Boutique]</strong> ou peuvent être livrés selon les modalités définies lors de la commande. Les délais ne sont donnés qu'à titre indicatif.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">5. Droit de rétractation</h3>
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas à la fourniture de biens susceptibles de se détériorer ou de se périmer rapidement (denrées périssables telles que nos pâtisseries).
          </p>
        </div>
      </section>

      <section id="mentions-legales" className="scroll-mt-32 space-y-6">
        <h2 className="text-2xl font-serif font-bold uppercase tracking-widest text-primary border-b border-border pb-4">
          Mentions Légales
        </h2>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, il est précisé aux utilisateurs du site <strong>[Nom du Site]</strong> l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">Éditeur du site</h3>
          <p>
            Le site <strong>[Nom du Site]</strong> est édité par :<br />
            <strong>[Nom de la Société]</strong>, Société par Actions Simplifiée (SAS) au capital de <strong>[Montant]</strong> euros.<br />
            Siège social : <strong>[Adresse Complète]</strong><br />
            RCS : <strong>[Numéro SIRET/RCS]</strong><br />
            TVA Intracommunautaire : <strong>[Numéro TVA]</strong>
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">Création du site</h3>
          <p>
            Site web réalisé par : <strong>[Ton Prénom / Nom - Étudiant/Développeur]</strong>.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">Directeur de la publication</h3>
          <p>
            Le directeur de la publication est <strong>[Nom du Dirigeant]</strong>.<br />
            Contact : <strong>[Email de Contact]</strong> ou <strong>[Numéro de Téléphone]</strong>.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">Hébergement</h3>
          <p>
            Le site est hébergé par <strong>[Nom de l'Hébergeur]</strong>.<br />
            Siège social : <strong>[Adresse de l'Hébergeur]</strong><br />
            Contact de l'hébergeur : <strong>[Site ou Téléphone de l'Hébergeur]</strong>
          </p>
        </div>
      </section>

      <section id="politique-confidentialite" className="scroll-mt-32 space-y-6">
        <h2 className="text-2xl font-serif font-bold uppercase tracking-widest text-primary border-b border-border pb-4">
          Politique de Confidentialité
        </h2>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            <strong>[Nom de la Société]</strong> accorde une grande importance à la protection et au respect de votre vie privée. La présente politique vise à vous informer de nos pratiques concernant la collecte, l'utilisation et le partage des informations que vous êtes amenés à nous fournir par le biais de notre site.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">1. Données collectées</h3>
          <p>
            En utilisant notre site, vous êtes amenés à nous transmettre des informations, dont certaines sont de nature à vous identifier ("Données Personnelles"). C'est notamment le cas lorsque vous remplissez un formulaire de création de compte, de commande ou de contact (Nom, prénom, adresse e-mail, adresse postale, numéro de téléphone).
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">2. Utilisation des données</h3>
          <div className="space-y-2">
            Les données que nous collectons nous permettent de :
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Traiter et expédier vos commandes.</li>
              <li>Communiquer avec vous concernant vos commandes, des factures, ou vos requêtes.</li>
              <li>Améliorer et optimiser notre site web.</li>
            </ul>
          </div>
          <h3 className="text-foreground font-bold text-lg mt-6">3. Vos droits</h3>
          <p>
            Conformément à la loi Informatique et Libertés et au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos Données Personnelles. Vous pouvez exercer ce droit en nous contactant à <strong>[Email de Contact DPO/Vie Privée]</strong>.
          </p>
        </div>
      </section>

      <section id="cookies" className="scroll-mt-32 space-y-6">
        <h2 className="text-2xl font-serif font-bold uppercase tracking-widest text-primary border-b border-border pb-4">
          Gestion des Cookies
        </h2>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            Le site <strong>[Nom du Site]</strong> peut-être amené à vous demander l'acceptation des cookies pour des besoins de statistiques et d'affichage. Un cookie est une information déposée sur votre disque dur par le serveur du site que vous visitez.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">1. Qu'est-ce qu'un cookie ?</h3>
          <p>
            Un cookie est un petit fichier texte sauvegardé sur votre ordinateur ou appareil mobile puis récupéré lors de vos visites ultérieures. Nous utilisons les cookies pour améliorer et simplifier vos visites.
          </p>
          <h3 className="text-foreground font-bold text-lg mt-6">2. Types de cookies utilisés</h3>
          <div className="space-y-2">
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Cookies strictement nécessaires :</strong> Ils sont indispensables au fonctionnement du site (par exemple : maintien de votre panier d'achat).</li>
              <li><strong>Cookies de performance / analytiques :</strong> Ils nous permettent de recueillir des données statistiques sur la fréquentation et l'utilisation de notre site afin de l'améliorer.</li>
            </ul>
          </div>
          <h3 className="text-foreground font-bold text-lg mt-6">3. Refus des cookies</h3>
          <p>
            Vous pouvez à tout moment configurer votre navigateur pour vous opposer en partie ou en totalité au dépôt de cookies. Cependant, le refus de certains cookies peut altérer votre expérience utilisateur ou vous empêcher d'accéder à certains services (comme la validation d'une commande).
          </p>
        </div>
      </section>
    </div>
  );
}
