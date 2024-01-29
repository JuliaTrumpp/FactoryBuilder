import type {
  IBackendMessageEvent as IBackendMessageEvent,
  IBackendEntity
} from '@/types/backendTypes'
import { getAllEntities, getEntityInFactory } from '@/utils/backend-communication/getRequests'
import type { IMessage } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'
import {stompRemoveEntity} from '@/views/Factory.vue'
import type { PlacedEntities } from '../placedEntities/placedEntities'
import type { Ref } from 'vue'

class StompClientBuilder {
  private readonly factoryID: number
  private client: Client
  private placedEntites: PlacedEntities

  constructor(factoryID: number, placedEntites: any) {
    this.placedEntites = placedEntites!!
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


      this.placedEntites.updateByID(backendMessageEvent.eventID, backendMessageEvent.operationType)
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
