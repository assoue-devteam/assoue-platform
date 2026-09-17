package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.service.CommandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;

    @PostMapping
    public ResponseEntity<CommandeResponse> creer(@Valid @RequestBody CommandeRequest requete, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commandeService.creer(requete, principal.getName()));
    }

    @GetMapping("/{id}")
    public CommandeResponse consulter(@PathVariable Long id, Principal principal) {
        return commandeService.consulter(id, principal.getName());
    }

}
