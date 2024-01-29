package de.swtpro.factorybuilder.entity.model.transportation;

import de.swtpro.factorybuilder.entity.Factory;
import de.swtpro.factorybuilder.utility.Position;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("TwoWaySwitch")
public class TwoWaySwitch extends AbstractTransportation {
    String name = "Weiche(3)";
    String modelGltf = "/models/transportation/weiche(3).gltf";

    public TwoWaySwitch(Factory factory, Position rootPosition) {
        super(factory, rootPosition);
    }

    public TwoWaySwitch() {

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
