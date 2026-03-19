import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class EventPublisherService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(eventName: string, payload: any) {
    this.eventEmitter.emit(eventName, payload);
  }
}
