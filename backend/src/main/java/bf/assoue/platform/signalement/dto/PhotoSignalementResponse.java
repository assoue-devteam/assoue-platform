package bf.assoue.platform.signalement.dto;

public record PhotoSignalementResponse(Long id, String cle, String contentType) {
    public static PhotoSignalementResponse de(bf.assoue.platform.signalement.model.PhotoSignalement p) {
        return new PhotoSignalementResponse(p.getId(), p.getCle(), p.getContentType());
    }
}