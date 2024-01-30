import type {ICompass} from "@/classes/placedEntities/placedEntities";

export interface IBackendEntity {
    x: number;
    y: number;
    z: number;
    path: string;
    orientation: ICompass;
    factoryid: string;
    id: number;
    modelId: string;
    inputMaterial: Map<string, string>;
    outputMaterial: Map<string, string>;
}
export interface IPlacedRequestAnswer {
    id: number;
    inputMaterial: Map<string, string>;
    outputMaterial: Map<string, string>;
}

export interface IBackendEntityPreview {
    modelFile: string;
    name: string;
    icon: string;
    id: string;
}

export interface IFactoryCreate {
    name: string;
    password: string;
    width: number;
    depth: number;
    height: number;
    author: string
}

export interface IFactoryDelete {
    id: number,
    element: any
}

/**
 * Entity Place
 */
export interface IPlaceRequest {
    x: number;
    y: number;
    z: number;
    modelId: string;
    factoryID: number;
    user: string;
}

/**
 * Manipulation Request
 */
export interface IManipulationRequest {
    x: number;
    y: number;
    z: number;
    id: number;
    orientation: string;
    factoryID: number;
}


/**
 * Entity Delete
 */
export interface IEntityDelete {
    factoryId: number;
    id: number;
}

/**
 * Entity Rotate
 */

export interface IEntityRotate {
    factoryId: number;
    id: number;
    orientation: string;
}

/**
 * Move Request
 */
export interface IEntityMove {
    factoryId: number;
    id: number;
    x: number;
    y: number;
    z: number;
}

// Model scripting
export interface IModelScripting {
    id: number;
}

export interface IFactory {
    id: number;
    name: string;
    width: number;
    depth: number;
    height: number;
    hasPassword: boolean;
    author: string;
}

export interface IUserForm {
    username: string;
    password: string;
    passwordCheck: string;
}

export interface ILoginForm {
    username: string;
    password: string;
}

export interface IBackendMessageEvent {
    eventType: string;
    eventID: number;
    operationType: string;
    gltf?: string;
    user?: string;
}

export interface ISystemProperty {
    property: string;
    value: string;
}

export interface IUserProperty {
    property: string;
    value: string;
}