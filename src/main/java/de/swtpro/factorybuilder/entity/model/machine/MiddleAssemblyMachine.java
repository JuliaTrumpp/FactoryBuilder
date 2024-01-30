package de.swtpro.factorybuilder.entity.model.machine;

import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.utility.Position;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("MiddleAssemblyMachine")
public class MiddleAssemblyMachine extends AbstractMachine {
    String name = "Montagemaschine";
    String modelGltf = "/models/machines/montagemaschine.gltf";

    public MiddleAssemblyMachine(Factory factory, Position rootPosition) {
        super(factory, rootPosition);
    }

    public MiddleAssemblyMachine() {

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
