"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const WebSocket = require("ws");
const log_1 = require("./log");
class WorkerManager {
    constructor() {
        this._closing = false;
        this._connected = false;
        this._reconnectWait = 0;
        this._reconnectTimeout = -1;
        this._server = "";
        this._tasks = new Map();
        this._outQueue = [];
    }
    run(options) {
        this._server = options.server;
        this._connect();
    }
    close() {
        this._closing = true;
        this._ws.close();
    }
    registerTask(name, worker) {
        this._tasks[name] = worker;
    }
    _getTask() {
        this._send({ action: "GetTask" });
    }
    _connect() {
        log_1.log.info(`Connecting to node-workman at ${this._server}`);
        try {
            this._ws = new WebSocket(this._server);
        }
        catch (e) {
            console.log(e);
            return;
        }
        this._ws.on("error", this._onError.bind(this));
        this._ws.on("open", this._onOpen.bind(this));
        this._ws.on("message", this._onMessage.bind(this));
        this._ws.on("close", this._onClose.bind(this));
    }
    _send(data) {
        if (this._connected) {
            this._ws.send(JSON.stringify(data));
        }
        else {
            this._outQueue.push(data);
        }
    }
    _backoff() {
        const min = 125;
        const max = 2000;
        if (this._reconnectWait === 0) {
            this._reconnectWait = min;
        }
        else {
            this._reconnectWait *= 2;
            if (this._reconnectWait > max) {
                this._reconnectWait = max;
            }
        }
    }
    _reconnect() {
        log_1.log.info(`Reconnecting to ${this._server} in ${this._reconnectWait}ms`);
        if (this._reconnectTimeout !== -1) {
            clearTimeout(this._reconnectTimeout);
        }
        this._reconnectTimeout = setTimeout(this._connect.bind(this), this._reconnectWait);
        this._backoff();
    }
    _onOpen() {
        log_1.log.info(`Connected to node-workman at ${this._server}`);
        this._connected = true;
        this._reconnectTimeout = -1;
        for (let data of this._outQueue) {
            this._send(data);
        }
        for (let name of Object.keys(this._tasks)) {
            this._send({ action: "RegisterTask", name: name });
        }
        this._getTask();
    }
    _onError(e) {
        log_1.log.info(`Connection to node-workman got WebSocket error: ${e.toString()}`);
    }
    _onMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data === "") {
                // Empty responses from server
                return;
            }
            let workPackage;
            workPackage = JSON.parse(data);
            const worker = this._tasks[workPackage.name];
            if (worker === undefined) {
                log_1.log.error(`Got work for task ${workPackage.name}, which we can't process!`);
                this._send({
                    action: "SendResult",
                    nonce: workPackage.nonce,
                    result: {
                        error: `Unknown job ${workPackage.name}`
                    }
                });
                return;
            }
            const start = Date.now();
            this._send({
                action: "SendResult",
                nonce: workPackage.nonce,
                result: yield worker(workPackage.options)
            });
            const end = Date.now();
            log_1.log.info(`Processed ${workPackage.name} task in ${end - start}ms`);
            this._getTask();
        });
    }
    _onClose(code, reason) {
        this._connected = false;
        log_1.log.info(`WebSocket connection to node-workman closed with code ${code}: ${reason}`);
        if (!this._closing) {
            this._reconnect();
        }
    }
}
exports.WorkerManager = WorkerManager;
exports.worker = new WorkerManager();
//# sourceMappingURL=index.js.map