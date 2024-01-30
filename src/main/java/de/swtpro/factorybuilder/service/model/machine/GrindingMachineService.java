package de.swtpro.factorybuilder.service.model.machine;

import de.swtpro.factorybuilder.entity.*;
import de.swtpro.factorybuilder.entity.model.AbstractModel;
import de.swtpro.factorybuilder.entity.model.machine.GrindingMachine;
import de.swtpro.factorybuilder.service.FactoryService;
import de.swtpro.factorybuilder.service.FieldService;
import de.swtpro.factorybuilder.service.model.AbstractModelService;
import de.swtpro.factorybuilder.service.model.ManipulateAbstractModelService;
import de.swtpro.factorybuilder.service.model.PlacedModelServiceTemplate;
import de.swtpro.factorybuilder.utility.Position;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GrindingMachineService implements PlacedModelServiceTemplate {

    private static final Logger LOGGER = LoggerFactory.getLogger(AbstractModelService.class);
    FactoryService factoryService;
    FieldService fieldService;
    ManipulateAbstractModelService manipulateAbstractModelService;

    @Autowired
    public GrindingMachineService(FactoryService factoryService, FieldService fieldService, ManipulateAbstractModelService manipulateAbstractModelService) {
        this.factoryService = factoryService;
        this.fieldService = fieldService;
        this.manipulateAbstractModelService = manipulateAbstractModelService;
    }

    public GrindingMachine createPlacedModel(Position rootPosition, long factoryID) {
        try {
            Factory factory = factoryService.getFactoryById(factoryID).orElseThrow();
            GrindingMachine grindingMachine = new GrindingMachine(factory, rootPosition);
            if (!fillPlacedModelLists(grindingMachine)) return null;
            if (manipulateAbstractModelService.checkForPlacement(grindingMachine)) {
                for (Field f : grindingMachine.getPlacedFields())
                    fieldService.setPlacedModelOnField(grindingMachine, f);

                Map<String, String> inputMaterials = new HashMap<>();
                Map<String, String> outputMaterials = new HashMap<>();
                inputMaterials.put("Eisen_klumpen", "/models/items/processed/eisen_klumpen.gltf");
                outputMaterials.put("Eisen_barren", "/models/items/processed/eisen_barren.gltf");
                grindingMachine.setInputMaterial(inputMaterials);
                grindingMachine.setOutputMaterial(outputMaterials);

                setIconAndModelGltfAndTypeAndName(grindingMachine);

                return grindingMachine;
            }
        } catch (Exception e) {
            // TODO: REAL ERROR HANDLING
            throw new RuntimeException(e);
        }
        LOGGER.error("placing Model was not successful");
        return null;
    }

    private boolean fillPlacedModelLists(AbstractModel abstractModel) {
        try {
            Position rootPos = abstractModel.getRootPos();
            Factory factory = abstractModel.getFactory();
            long factoryID = factory.getFactoryID();
            List<Field> placedFields = new ArrayList<>();
            List<Input> placedInputs = new ArrayList<>();
            List<Output> placedOutputs = new ArrayList<>();

            placedFields.add(fieldService.getFieldByPosition(rootPos, factoryID).orElseThrow());
            placedInputs.add(createInput(fieldService.getFieldByPosition(rootPos, factoryID).orElseThrow(), "North"));
            placedInputs.add(createInput(fieldService.getFieldByPosition(rootPos, factoryID).orElseThrow(), "West"));
            placedOutputs.add(createOutput(fieldService.getFieldByPosition(rootPos, factoryID).orElseThrow(), "South"));
            placedOutputs.add(createOutput(fieldService.getFieldByPosition(rootPos, factoryID).orElseThrow(), "East"));

            abstractModel.setPlacedFields(placedFields);
            abstractModel.setInputs(placedInputs);
            abstractModel.setOutputs(placedOutputs);
            return true;
        } catch (NoSuchElementException e) {
            LOGGER.error("Error occurred while filling placed model lists: " + e.getMessage());
            return false;
        }
    }
}
