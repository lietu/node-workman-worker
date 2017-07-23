import 'source-map-support/register';
export interface Worker {
    (options: any): Promise<any>;
}
export interface WorkerManagerOptions {
    server: string;
}
export declare class WorkerManager {
    private _closing;
    private _connected;
    private _reconnectWait;
    private _reconnectTimeout;
    private _server;
    private _tasks;
    private _ws;
    private _outQueue;
    run(options: WorkerManagerOptions): void;
    close(): void;
    registerTask(name: string, worker: Worker): void;
    private _getTask();
    private _connect();
    private _send(data);
    private _backoff();
    private _reconnect();
    private _onOpen();
    private _onError(e);
    private _onMessage(data);
    private _onClose(code, reason);
}
export declare const worker: WorkerManager;
