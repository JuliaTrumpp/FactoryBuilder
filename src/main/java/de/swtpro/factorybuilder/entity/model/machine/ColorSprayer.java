package de.swtpro.factorybuilder.entity.model.machine;

import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.utility.Position;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;

import java.util.HashMap;
import java.util.Map;

@Entity
@DiscriminatorValue("ColorSprayer")
public class ColorSprayer extends AbstractMachine {
    String name = "Farbsprueher";
    String modelGltf = "/models/machines/farbsprueher.gltf";

    @ElementCollection
    Map<String, String> inputMaterial;
    @ElementCollection
    Map<String, String> outputMaterial;

    public ColorSprayer(Factory factory, Position rootPosition) {
        super(factory, rootPosition);
    }

    public ColorSprayer() {

    }
    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getModelGltf() {
        return modelGltf;
    }

    public Map<String, String> getInputMaterial() {
        return inputMaterial;
    }
    public void setInputMaterial(Map<String, String> inputMaterial) {
        this.inputMaterial = inputMaterial;
    }
    public Map<String, String> getOutputMaterial() {
        return outputMaterial;
    }
    public void setOutputMaterial(Map<String, String> outputMaterial) {
        this.outputMaterial = outputMaterial;
    }
}
