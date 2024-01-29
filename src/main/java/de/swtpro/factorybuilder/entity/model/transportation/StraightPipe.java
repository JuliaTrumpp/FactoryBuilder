package de.swtpro.factorybuilder.entity.model.transportation;

import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.utility.Position;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("StraightPipe")
public class StraightPipe extends AbstractTransportation {
    String name = "Röhre";
    String modelGltf = "/models/transportation/roehre.gltf";

    public StraightPipe(Factory factory, Position rootPosition) {
        super(factory, rootPosition);
    }

    public StraightPipe() {

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
