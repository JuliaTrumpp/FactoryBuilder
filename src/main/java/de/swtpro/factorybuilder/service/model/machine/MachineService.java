package de.swtpro.factorybuilder.service.model.machine;

import de.swtpro.factorybuilder.entity.Model;
import de.swtpro.factorybuilder.entity.model.machine.AbstractMachine;
import de.swtpro.factorybuilder.utility.Position;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MachineService {
    ElectronicsMachineService electronicsMachineService;
    FurnaceService furnaceService;
    GrindingMachineService grindingMachineService;
    KilnService kilnService;
    MiddleAssemblyMachineService middleAssemblyMachineService;
    OreCleanerService oreCleanerService;
    PlaningMachineService planingMachineService;
    SawmillService sawmillService;
    ColorSprayerService colorSprayerService;
    @Autowired
    public MachineService( ElectronicsMachineService electronicsMachineService, FurnaceService furnaceService,
                           GrindingMachineService grindingMachineService, KilnService kilnService,
                           MiddleAssemblyMachineService middleAssemblyMachineService, OreCleanerService oreCleanerService,
                           PlaningMachineService planingMachineService, SawmillService sawmillService, ColorSprayerService colorSprayerService) {
        this.electronicsMachineService = electronicsMachineService;
        this.furnaceService = furnaceService;
        this.grindingMachineService = grindingMachineService;
        this.kilnService = kilnService;
        this.middleAssemblyMachineService = middleAssemblyMachineService;
        this.oreCleanerService = oreCleanerService;
        this.planingMachineService = planingMachineService;
        this.sawmillService = sawmillService;
        this.colorSprayerService = colorSprayerService;
    }




    public AbstractMachine createPlacedModel(Model model, Position rootPosition, long factoryID) {
        try {
            switch (model.getName()) {
                case "Brennerofen" -> {
                    return kilnService.createPlacedModel(rootPosition, factoryID);
                }
                case "Elektronikmaschine" -> {
                    return electronicsMachineService.createPlacedModel(rootPosition, factoryID);
                }
                case "Erzreiniger" -> {
                    return oreCleanerService.createPlacedModel(rootPosition, factoryID);
                }
                case "Farbsprueher" -> {
                    return colorSprayerService.createPlacedModel(rootPosition, factoryID);
                }
                case "Montagemaschine" -> {
                    return middleAssemblyMachineService.createPlacedModel(rootPosition, factoryID);
                }
                case "Planiermaschine" -> {
                    return planingMachineService.createPlacedModel(rootPosition, factoryID);
                }
                case "Saegemuehle" -> {
                    return sawmillService.createPlacedModel(rootPosition, factoryID);
                }
                case "Schleifmaschine" -> {
                    return grindingMachineService.createPlacedModel(rootPosition, factoryID);
                }
                case "Schmelzofen" -> {
                    return furnaceService.createPlacedModel(rootPosition, factoryID);
                }
                default -> throw new IllegalArgumentException("Invalid model name");
            }
        } catch (IllegalArgumentException e) {
            // TODO: REAL HANDLING
            throw new RuntimeException(e);
        }
    }

}
