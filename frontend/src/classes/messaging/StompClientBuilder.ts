import type {
  IBackendMessageEvent as IBackendMessageEvent,
  IBackendEntity
} from '@/types/backendTypes'
import { getAllEntities, getEntityInFactory } from '@/utils/backend-communication/getRequests'
//import { stompRemoveEntity } from '@/views/Factory.vue'
import type { IMessage } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'
// import {stompRemoveEntity} from '@/views/Factory.vue'

class StompClientBuilder {
  private readonly factoryID: number
  private client: Client

  constructor(factoryID: number) {
    this.factoryID = factoryID
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/stompbroker',
      connectHeaders: {
        login: 'your-username', //need security-config in backend first
        passcode: 'your-password'
      },
      debug: (str: string) => {
        console.log('STOMP: ' + str)
      },
      onConnect: () => {
        this.subscribeToTopic(this.factoryID)
      },
      onStompError: (frame: any) => {
        console.error('Broker reported error: ' + frame.headers['message'])
        console.error('Additional details: ' + frame.body)
      }
    })
  }

  private subscribeToTopic(factoryID: number): void {
    this.client.subscribe('/info/factory/' + factoryID, (message: IMessage) => {
      console.log('Received:', message.body)

      const backendMessageEvent: IBackendMessageEvent = JSON.parse(message.body)
      console.log("BackendMessageEvent: ", backendMessageEvent)


      if (backendMessageEvent.operationType == 'UPDATE') {
        
        getEntityInFactory(backendMessageEvent.eventID).then((changedPlacedModel: IBackendEntity) => {
          // dieses Entity neu laden und im FE setzen (es wurde verschoben/ rotiert/ etc wurde)
          // changedPlacedModel benutzen
        })
      } else if (backendMessageEvent.operationType == 'DELETE') {
        console.log("Ich geh in den else DELETE rein")
        // dieses Entity im FE löschen
        // delete allPlacedEntities[changedPlacedModel.id]
        // scene.remove(changedPlacedModel)     
        // const allPlacedEntities = stompRemoveEntity(1);  // die methode braucht eigentlich das model
        // changedPlacedModel benutzen
      }
      })
  }

  public activate(): void {
    this.client.activate()
  }

  public deactivate(): void {
    this.client.deactivate()
  }
}

export default StompClientBuilder
