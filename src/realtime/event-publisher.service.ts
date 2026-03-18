import EventEmitter2 from 'eventemitter2';

export class EventPublisherService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(eventName: string, payload: any) {
    this.eventEmitter.emit(eventName, payload);
  }
}
