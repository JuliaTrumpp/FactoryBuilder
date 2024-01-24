package de.swtpro.factorybuilder.controller;

import de.swtpro.factorybuilder.DTO.entity.MoveRequestDTO;
import de.swtpro.factorybuilder.DTO.entity.PlaceRequestDTO;
import de.swtpro.factorybuilder.DTO.entity.PlacedModelDTO;
import de.swtpro.factorybuilder.DTO.entity.RotateRequestDTO;
import de.swtpro.factorybuilder.DTO.factory.DeleteRequestDTO;
import de.swtpro.factorybuilder.DTO.factory.FactoryEnterDTO;
import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.entity.Model;
import de.swtpro.factorybuilder.entity.PlacedModel;
import de.swtpro.factorybuilder.service.FactoryService;

import de.swtpro.factorybuilder.service.ModelService;
import de.swtpro.factorybuilder.service.PlacedModelService;
import de.swtpro.factorybuilder.utility.ModelType;
import de.swtpro.factorybuilder.utility.Position;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/entity")
public class EntityRestAPIController {

    private static final Logger LOGGER = LoggerFactory.getLogger(EntityRestAPIController.class);
    ModelService modelService;
    FactoryService factoryService;
    PlacedModelService placedModelService;

    EntityRestAPIController(ModelService modelService, FactoryService factoryService,
            PlacedModelService placedModelService) {
        this.modelService = modelService;
        this.factoryService = factoryService;
        this.placedModelService = placedModelService;
    }

    @CrossOrigin
    @PostMapping("/place")
    public ResponseEntity<Long> place(@RequestBody PlaceRequestDTO placeRequestDTO) {

        Position pos = new Position(placeRequestDTO.x(), placeRequestDTO.y(), placeRequestDTO.z());
        Model model = modelService.getByName(placeRequestDTO.modelId()).orElseThrow();
        PlacedModel placedModel = placedModelService.createPlacedModel(model, pos, placeRequestDTO.factoryID());

        LOGGER.info(placedModel.toString());

        // Entity wir in Datenbank erzeugt, und id wird gesendet
        return ResponseEntity.ok(placedModel.getId());
    }

    @CrossOrigin
    @PostMapping("/delete")
    public ResponseEntity<Boolean> delete(@RequestBody DeleteRequestDTO deleteRequestDTO) {
        boolean deleted = placedModelService.removeModelFromFactory(deleteRequestDTO.id());
        return ResponseEntity.ok(deleted);
    }

    @CrossOrigin
    @PostMapping("/rotate")
    public ResponseEntity<Boolean> rotate(@RequestBody RotateRequestDTO rotateRequestDTO) {
        // Position pos = new Position(placeRequestDTO.x, placeRequestDTO.y,
        // placeRequestDTO.z);

        // boolean rotated = placedModelService.rotateModel(idToRotate, pos,
        // factoryService.getFactoryById(placeRequestDTO.factoryID).orElseThrow());

        // LOGGER.info("rotate entity: " + String.valueOf(idToRotate) +
        // String.valueOf(rotated));

        LOGGER.info(rotateRequestDTO.toString());
        return ResponseEntity.ok(true);
    }

    @CrossOrigin
    @PostMapping("/move")
    public ResponseEntity<Boolean> move(@RequestBody MoveRequestDTO moveRequestDTO) {
        Position pos = new Position(moveRequestDTO.x(), moveRequestDTO.y(), moveRequestDTO.z());
        boolean moved = placedModelService.moveModel(moveRequestDTO.id(), pos);
        LOGGER.info(moveRequestDTO.toString());
        LOGGER.info("move entity: " + moveRequestDTO.id() + moved);
        return ResponseEntity.ok(true);
    }

    @CrossOrigin
    @GetMapping("/getAll")
    public List<Model> getAll() {
        return modelService.getAllByTypes(ModelType.MACHINE, ModelType.TRANSPORT, ModelType.OTHER,
                ModelType.ITEM_PROCESSED, ModelType.ITEM_RESOURCE, ModelType.ITEM_PRODUCT);
    }

    @CrossOrigin
    @GetMapping("/get/' + {entityId}")
    public PlacedModelDTO getPlacedEntity(@PathVariable long entityId) {
        try {
            PlacedModel placedModel = placedModelService.getPlacedModelById(entityId).orElseThrow();
            Model m = modelService.getByID(placedModel.getModelId()).orElse(null);

            assert placedModel != null;
            PlacedModelDTO dto = new PlacedModelDTO(
                    placedModel.getFactoryID(),
                    placedModel.getId(),
                    placedModel.getOrientation(),
                    placedModel.getRootPos().getX(),
                    placedModel.getRootPos().getY(),
                    placedModel.getRootPos().getZ(),
                    m.getModelFile(), // Füge den Pfad hinzu, wie erforderlich (? Kommentar von getAll in factoryAPI
                                      // übernommen)
                    m.getName()
            // hier muss wenn script branch gemerged ist, noch placedModel.getScript() hin
            // -> DTO abändern...
            // -> an jeder anderen Stelle wo Entities aus BE geholt werden z.B auch
            // getAll(), load() etc.
            );

            return dto;
        } catch (Exception e) {
            LOGGER.info("Fehler beim Laden des Entitys aus dem BE, um dieses im FE zu aktualisieren");
        }

        return null;
    }

}
