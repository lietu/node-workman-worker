import * as http from 'http'

let openRequests = 0
let completedRequests = 0
let lastRequestCount = 0
let lastTime = Date.now()

async function sendRequest(): Promise<void> {
    return new Promise<void>(function (resolve: { (): void }) {
        const a = Math.random()
        const b = Math.random()
        const data = JSON.stringify({
            a: a,
            b: b
        })

        openRequests += 1
        const request = http.request({
            port: 9999,
            hostname: "127.0.0.1",
            method: "POST",
            path: "/task/work",
        }, function (res: any) {
            res.setEncoding('utf8')
            res.on("data", function() {
                // Throw away
            })
            res.on("end", function () {
                openRequests -= 1
                completedRequests += 1
                resolve()
            })
        })

        request.write(data)
        request.end()
    })
}

function generateWork() {
    while (openRequests < 10) {
        sendRequest()
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

