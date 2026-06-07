import { EventEmitter } from 'events';

// Global variable to persist the EventEmitter across hot reloads in development
let globalEvents: EventEmitter;

if (process.env.NODE_ENV === 'production') {
  globalEvents = new EventEmitter();
} else {
  if (!(global as any)._serverEventEmitter) {
    (global as any)._serverEventEmitter = new EventEmitter();
  }
  globalEvents = (global as any)._serverEventEmitter;
}

// Increase max listeners just in case many SSE connections are open simultaneously
globalEvents.setMaxListeners(100);

export const serverEvents = globalEvents;
