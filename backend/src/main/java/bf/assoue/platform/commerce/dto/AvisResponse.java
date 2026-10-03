package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.commerce.model.Avis;

import java.time.LocalDateTime;
import java.util.List;

public record AvisResponse(int note, String commentaire, String auteur, LocalDateTime date) {

    public static AvisResponse depuis(Avis avis) {
        return new AvisResponse(avis.getNote(), avis.getCommentaire(), auteur(avis.getClient()), avis.getDateCreation());
    }

    /** « Awa O. » : assez pour inspirer confiance sans exposer le nom complet ni l'email. */
    private static String auteur(Utilisateur client) {
        String prenom = client.getPrenom() == null ? "" : client.getPrenom().trim();
        String nom = client.getNom() == null ? "" : client.getNom().trim();
        if (prenom.isEmpty()) return "Client AS'SOUÉ";
        return nom.isEmpty() ? prenom : prenom + " " + nom.charAt(0) + ".";
    }

    public record Liste(Double moyenne, long nombre, List<AvisResponse> avis) {
    }

    public record Mien(boolean peutDonnerAvis, AvisResponse monAvis) {
    }

}
