import {worker} from "./index"

// In Node v7 unhandled promise rejections will terminate the process
if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
    process.on('unhandledRejection', function (reason) {
        throw reason
    })
    // Avoid memory leak by adding too many listeners
    process.env.LISTENING_TO_UNHANDLED_REJECTION = "true"
}

interface Calculation {
    a: number
    b: number
}

async function work(data: Calculation): Promise<any> {
    return data.a + data.b
}

async function waitAndWork(data: Calculation): Promise<any> {
    return new Promise<any>(function(resolve: {(result: any): void}) {
        setTimeout(function() {
            resolve(data.a + data.b)
        }, 1000)
    })
}

worker.registerTask("work", work)
worker.registerTask("wait", waitAndWork)
worker.run({
    server: "ws://localhost:9999/worker"
})
