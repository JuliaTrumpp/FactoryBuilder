package de.swtpro.factorybuilder.entity.model.machine;

import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.utility.Position;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ColorSprayer")
public class ColorSprayer extends AbstractMachine {
    String name = "Farbsprüher";
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
