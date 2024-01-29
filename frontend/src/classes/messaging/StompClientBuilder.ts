import type {
  IBackendMessageEvent as IBackendMessageEvent
} from '@/types/backendTypes'
import type { IMessage } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'
import type { PlacedEntities } from '../placedEntities/placedEntities'
import {type Ref, ref} from "vue";
import { useSessionUser } from '@/utils/composition-functions/useSessionUser';

class StompClientBuilder {
  private readonly factoryID: number
  private client: Client
  private placedEntites = ref<PlacedEntities>()

  constructor(factoryID: number, placedEntites: Ref<PlacedEntities | undefined>) {
    this.placedEntites = placedEntites
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
      console.log(backendMessageEvent.user)
      if(backendMessageEvent.user === useSessionUser().sessionUser.value) return;
      this.placedEntites.value!!.updateByID(backendMessageEvent.eventID, backendMessageEvent.operationType, backendMessageEvent.gltf)
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
