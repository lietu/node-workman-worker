import 'source-map-support/register'
import * as WebSocket from 'ws'
import {log} from "./log"

export interface Worker {
    (options: any): Promise<any>
}

export interface WorkerManagerOptions {
    server: string
}

interface WorkPackage {
    name: string
    options: any
    nonce: string
}

export class WorkerManager {
    private _closing = false
    private _connected: boolean = false
    private _reconnectWait: number = 0
    private _reconnectTimeout: number = -1
    private _server: string = ""
    private _tasks: Map<string, Worker> = new Map<string, Worker>()
    private _ws: WebSocket
    private _outQueue: any[] = []

    run(options: WorkerManagerOptions) {
        this._server = options.server
        this._connect()
    }

    close() {
        this._closing = true
        this._ws.close()
    }

    registerTask(name: string, worker: Worker) {
        this._tasks[name] = worker
    }

    private _getTask() {
        this._send({action: "GetTask"})
    }

    private _connect() {
        log.info(`Connecting to node-workman at ${this._server}`)

        try {
            this._ws = new WebSocket(this._server)
        } catch (e) {
            console.log(e)
            return
        }

        this._ws.on("error", this._onError.bind(this))
        this._ws.on("open", this._onOpen.bind(this))
        this._ws.on("message", this._onMessage.bind(this))
        this._ws.on("close", this._onClose.bind(this))
    }

    private _send(data: any) {
        if (this._connected) {
            this._ws.send(JSON.stringify(data))
        } else {
            this._outQueue.push(data)
        }
    }

    private _backoff() {
        const min = 125
        const max = 2000
        if (this._reconnectWait === 0) {
            this._reconnectWait = min
        } else {
            this._reconnectWait *= 2
            if (this._reconnectWait > max) {
                this._reconnectWait = max
            }
        }
    }

    private _reconnect() {
        log.info(`Reconnecting to ${this._server} in ${this._reconnectWait}ms`)
        if (this._reconnectTimeout !== -1) {
            clearTimeout(this._reconnectTimeout)
        }
        this._reconnectTimeout = setTimeout(this._connect.bind(this), this._reconnectWait)
        this._backoff()
    }

    private _onOpen() {
        log.info(`Connected to node-workman at ${this._server}`)
        this._connected = true
        this._reconnectTimeout = -1

        for (let data of this._outQueue) {
            this._send(data)
        }

        for (let name of Object.keys(this._tasks)) {
            this._send({action: "RegisterTask", name: name})
        }

        this._getTask()
    }

    private _onError(e: Error) {
        log.info(`Connection to node-workman got WebSocket error: ${e.toString()}`)
    }

    private async _onMessage(data: string) {
        if (data === "") {
            // Empty responses from server
            return
        }

        let workPackage: WorkPackage
        workPackage = JSON.parse(data)

        const worker = this._tasks[workPackage.name]
        if (worker === undefined) {
            log.error(`Got work for task ${workPackage.name}, which we can't process!`)
            this._send({
                action: "SendResult",
                nonce: workPackage.nonce,
                result: {
                    error: `Unknown job ${workPackage.name}`
                }
            })
            return
        }

        const start = Date.now()
        this._send({
            action: "SendResult",
            nonce: workPackage.nonce,
            result: await worker(workPackage.options)
        })
        const end = Date.now()
        log.info(`Processed ${workPackage.name} task in ${end - start}ms`)

        this._getTask()
    }

    private _onClose(code: number, reason: string) {
        this._connected = false
        log.info(`WebSocket connection to node-workman closed with code ${code}: ${reason}`)

        if (!this._closing) {
            this._reconnect()
        }
    }

}

export const worker = new WorkerManager()
