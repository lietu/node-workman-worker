import * as WebSocket from 'ws'

class Client {
    connected: boolean = false
    private waitingNonce: string = ""
    private _server: string
    private _ws: WebSocket

    constructor(server: string) {
        this._server = server
        this._connect()
    }

    send() {
        if (this.connected && this.waitingNonce === "") {
            this.waitingNonce = (Date.now() + Math.random()).toString(16)
            const req = JSON.stringify({
                action: "RunTask",
                nonce: this.waitingNonce,
                name: "work",
                options: {
                    a: Math.random(),
                    b: Math.random()
                }
            })
            this._ws.send(req)
        }
    }

    private _connect() {
        this._ws = new WebSocket(this._server)
        this._ws.on("open", this._onOpen.bind(this))
        this._ws.on("error", this._onError.bind(this))
        this._ws.on("close", this._onClose.bind(this))
        this._ws.on("message", this._onMessage.bind(this))
    }

    private _onMessage(data: string) {
        const pkg: any = JSON.parse(data)
        if (pkg.nonce === this.waitingNonce) {
            this.waitingNonce = ""
            completedRequests += 1
        }
    }

    private _onOpen() {
        this.connected = true
        this.waitingNonce = ""
    }

    private _onError(e: Error) {
        console.warn(`WebSocket error ${e.toString()}`)
    }

    private _onClose() {
        this.connected = false
        this._connect()
    }
}

let completedRequests = 0
let lastRequestCount = 0
let lastTime = Date.now()
let clients: Client[] = []

for (let i = 0; i < 20; i += 1) {
    clients.push(new Client("ws://localhost:9999/websocket"))
}

function generateWork() {
    for (let client of clients) {
        client.send()
    }
}

function status() {
    const now = Date.now()
    const count = completedRequests
    const reqs = count - lastRequestCount
    const time = now - lastTime

    console.log(`${((reqs / time) * 1000).toFixed(2)} requests per second (${reqs} in ${time}ms)`)

    lastRequestCount = count
    lastTime = now
}

setInterval(generateWork, 1)
setInterval(status, 1000)

