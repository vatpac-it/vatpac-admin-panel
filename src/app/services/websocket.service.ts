import { Injectable } from '@angular/core';
import {Observable, Observer, Subject} from "rxjs";
import {AnonymousSubject} from "rxjs/internal-compatibility";
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor(private userService: UserService) { }

  private subject: Subject<MessageEvent>;

  public connect(url, binaryType: BinaryType = null): Subject<MessageEvent> {
    if (!this.subject || this.subject.isStopped) {
      this.subject = this.create(url, binaryType);
      console.log("Successfully connected: " + url);
    }
    return this.subject;
  }

  private create(url, binaryType: BinaryType = null): Subject<MessageEvent> {
    let ws = new WebSocket(url);

    const authMsg = {
      type: 'authentication',
      payload: {token: this.userService.currentJWT.token}
    }
    ws.onopen = function (evt) {
      ws.send(JSON.stringify(authMsg));
    };

    if (binaryType !== null) {
      ws.binaryType = binaryType;
    }

    let observable = new Observable((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });
    let observer: Observer<MessageEvent> = {
      complete: function () {
        console.log('I\'m done');
      }, error: function (p1: any) {
      },
      next: (ev: MessageEvent | string | ArrayBuffer) => {
        waitForConnection(ws, function () {
          if (ws.readyState === WebSocket.OPEN) {
            if (typeof ev === 'string' || ev instanceof ArrayBuffer) return ws.send(ev);
          }
        });
      }
    };

    function waitForConnection(socket, callback) {
      setTimeout(function () {
        if (socket.readyState === WebSocket.OPEN) {
          if (callback !== null) callback();
        } else {
          waitForConnection(socket, callback);
        }
      }, 5);
    }


    return new AnonymousSubject(observer, observable);
  }
}
