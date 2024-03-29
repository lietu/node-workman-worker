# Worker for Work(er) Man(ager)

Worker library for [node-workman](https://github.com/lietu/node-workman).

Written in TypeScript and the definitions (`.d.ts` -files) are published in NPM
with the rest of the files.


## Usage

Add the library with [yarn](https://yarnpkg.com/lang/en/)

```bash
yarn add node-workman-worker
```

Or with NPM

```bash
npm install node-workman-worker
```

Then import the library in your code

```typescript
import {worker} from "node-workman-worker"
```

Create your task handlers

```typescript
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
```

And register them before running the core worker logic.

```typescript
worker.registerTask("work", work)
worker.registerTask("wait", waitAndWork)
worker.run({
    server: "ws://localhost:9999/worker"
})
```

That's it. Nothing more required. Simple, right?

You can check the full example [src/test-worker.ts](src/test-worker.ts)


## Well how about JavaScript

Fine, this was written in TypeScript but nothing is stopping you from using
plain JavaScript as long as you can live with the fact that I'm probably
disgusted with you.

Here's a simple example:

```javascript
const worker = require('node-workman-worker').worker;

async function work(options) {
    return options.a + options.b
}

worker.registerTask("work", work)

worker.run({
    server: "ws://localhost:9999/worker"
})
```


## Contributing

Pull requests and issues are open for any good ideas, but please keep in mind
that this is supposed to stay fairly simple. If in doubt, open an issue to ask
if your proposed idea would be accepted.


### Development

To run the typescript compiler and the test worker (`src/test-worker.ts`) just
run:

```bash
yarn dev
```

## Licensing

MIT. Need a more open license? Just ask.


# Financial support

This project has been made possible thanks to [Cocreators](https://cocreators.ee) and [Lietu](https://lietu.net). You can help us continue our open source work by supporting us on [Buy me a coffee](https://www.buymeacoffee.com/cocreators).

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/cocreators)
