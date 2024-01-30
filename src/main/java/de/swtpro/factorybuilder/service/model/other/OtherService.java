package de.swtpro.factorybuilder.service.model.other;

import de.swtpro.factorybuilder.entity.Model;
import de.swtpro.factorybuilder.entity.model.other.AbstractOther;
import de.swtpro.factorybuilder.utility.Position;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OtherService {
    GoodsIssueService goodsIssueService;
    PillarService pillarService;
    RawMaterialIntakeService rawMaterialIntakeService;
    SignService signService;
    @Autowired
    public OtherService(GoodsIssueService goodsIssueService, PillarService pillarService,
                        RawMaterialIntakeService rawMaterialIntakeService, SignService signService) {
        this.goodsIssueService = goodsIssueService;
        this.pillarService = pillarService;
        this.rawMaterialIntakeService = rawMaterialIntakeService;
        this.signService = signService;
    }

    public AbstractOther createPlacedModel(Model model, Position rootPosition, long factoryID) {
        try {
            switch (model.getName()) {
                case "Warenausgabe" -> {
                    return goodsIssueService.createPlacedModel(rootPosition, factoryID);
                }
                case "Saeule" -> {
                    return pillarService.createPlacedModel(rootPosition, factoryID);
                }
                case "Schild" -> {
                    return signService.createPlacedModel(rootPosition, factoryID);
                }
                case "Rohstoffannahme" -> {
                    return rawMaterialIntakeService.createPlacedModel(rootPosition, factoryID);
                }
                default -> throw new IllegalArgumentException("Invalid model name");
            }
        } catch (IllegalArgumentException e) {
            // TODO: REAL HANDLING
            throw new RuntimeException(e);
        }
    }
}