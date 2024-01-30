package de.swtpro.factorybuilder.messaging;

public class FrontendMessageEvent {
    public enum MessageEventType {
        FACTORY, ENTITY
    }
    public enum MessageOperationType {
        ROTATE, MOVE, DELETE, ADDNEW
    }
    private MessageEventType eventType;

    private long eventID;

    private MessageOperationType operationType;

    private String gltf; 
    private String user;

    public FrontendMessageEvent(MessageEventType eventType, long eventID, MessageOperationType operationType) {
        this.eventType = eventType;
        this.eventID = eventID;
        this.operationType = operationType;
    }

    public FrontendMessageEvent(MessageEventType eventType, long eventID, MessageOperationType operationType, String gltf, String user) {
        this.eventType = eventType;
        this.eventID = eventID;
        this.operationType = operationType;
        this.gltf = gltf; 
        this.user = user;
    }
    
    public MessageEventType getEventType() {
        return eventType;
    }

    public void setEventType(MessageEventType eventType) {
        this.eventType = eventType;
    }
    public long getEventID() {
        return eventID;
    }

    public void setEventID(long eventID) {
        this.eventID = eventID;
    }

    public MessageOperationType getOperationType() {
        return operationType;
    }

    public void setOperationType(MessageOperationType operationType) {
        this.operationType = operationType;
    }

    public String getGltf() {
        return gltf;
    }

    public void setGltf(String gltf) {
        this.gltf = gltf;
    }
    public String getUser() {
        return user;
    }
    public void setUser(String user) {
        this.user = user;
    }

}
