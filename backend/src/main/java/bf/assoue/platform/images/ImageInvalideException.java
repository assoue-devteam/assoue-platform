package bf.assoue.platform.images;

/** Format interdit ou contenu qui n'est pas une image → 415, message en français. */
public class ImageInvalideException extends RuntimeException {

    public ImageInvalideException(String message) {
        super(message);
    }
}
