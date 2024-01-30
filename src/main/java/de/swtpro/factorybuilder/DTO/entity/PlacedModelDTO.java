package de.swtpro.factorybuilder.DTO.entity;

import java.util.Map;

public record PlacedModelDTO(long factoryid, long id, String orientation, int x, int y, int z, String path, String modelId, Map<String, String> inputMaterial, Map<String, String> outputMaterial) {
}
