package bf.assoue.platform.stock.dto;

import jakarta.validation.constraints.Min;

public record AjustementStockRequest(@Min(0) int quantite) {
}
