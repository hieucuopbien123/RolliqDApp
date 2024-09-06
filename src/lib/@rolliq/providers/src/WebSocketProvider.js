import { WebSocketProvider as EthersWebSocketProvider } from "@ethersproject/providers";

export class WebSocketProvider extends EthersWebSocketProvider {
  get isReady() {
    return this._websocket.readyState === WebSocket.OPEN;
  }

  set onClose(closeListener) {
    this._websocket.onclose = closeListener;
  }

  close(code) {
    this._websocket.close(code);
  }

  async detectNetwork() {
    return this.network;
  }
}
