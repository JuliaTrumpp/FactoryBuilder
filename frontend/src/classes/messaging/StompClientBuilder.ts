import type {
  IBackendMessageEvent as IBackendMessageEvent,
  IBackendEntity
} from '@/types/backendTypes'
import { getEntityInFactory } from '@/utils/backend-communication/getRequests'
import type { IMessage } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'

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

    //   const backendMessageEvent: IBackendMessageEvent = JSON.parse(message.body)

    //   getEntityInFactory(backendMessageEvent.eventId).then((changedPlacedModel: IBackendEntity) => {
    //     if (backendMessageEvent.messageOperationtype == 'UPDATE') {
    //       // dieses Entity neu laden und im FE setzen (es wurde verschoben/ rotiert/ etc wurde)
    //       // changedPlacedModel benutzen
    //     } else if (backendMessageEvent.messageOperationtype == 'DELETE') {
    //       // dieses Entity im FE löschen
    //       // changedPlacedModel benutzen
    //     }
    //   })
      // }
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
