package de.swtpro.factorybuilder.entity.model.machine;

import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.utility.Position;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.util.HashMap;
import java.util.Map;

@Entity
@DiscriminatorValue("ColorSprayer")
public class ColorSprayer extends AbstractMachine {
    String name = "Farbsprueher";
    String modelGltf = "/models/machines/farbsprueher.gltf";

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

}
