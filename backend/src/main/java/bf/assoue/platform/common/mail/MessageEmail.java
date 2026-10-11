package bf.assoue.platform.common.mail;

public record MessageEmail(String destinataire, String sujet, String contenuHtml, String contenuTexte) {
}
