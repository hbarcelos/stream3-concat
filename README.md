# stream3-concat
Dead simple stream concatenator for node stream 3 API

## Installation

```shellscript
npm install --save stream3-concat
```

## Usage

### Creating a new stream


```javascript
const Concat = require('stream3-concat')

// Concatenates N streams
const myConcat = new Concat([stream1, stream2, ...])

// Just pass through 1 single stream
const myConcat = new Concat(stream1)

// Start with an empty stream
const myConcat = new Concat()

// Call function as a factory also works!
const myConcat = Concat()
```

### Adding streams to an existing one


```javascript
myConcat = new Concat()
myConcat.add(stream1)
myConcat.add(stream2)
```

### Removing streams from an existing one


```javascript
myConcat = new Concat([stream1, stream2])
//...
myConcat.remove(stream1)
```

**Notice**: this method **might** trigger the `end` event on the stream if the stream being removed is the last one.

### Clearing streams


```javascript
myConcat = new Concat([stream1, stream2])
//...
myConcat.clear()
```

**Notice**: this method **will** trigger the `end` event on the stream.

### Closing streams


```javascript
myConcat = new Concat([stream1, stream2])
//...
myConcat.close()
```

**Notice**: this method **will** trigger the `end` and the `close` events on the stream. Once a stream is closed, it can't be used anymore.

### Methods are chainable
```javascript
myConcat.add(stream1)
        .add(stream2)
        .add(stream3)
        .remove(stream2)
        .clear()
        .add(stream3)
```

### Events

`stream3-concat` is a [`Transform`](https://nodejs.org/api/stream.html#stream_class_stream_transform) stream and therefore it can emit any events its base class can.

## Important Notes

### Synchronous streams

If you try to concatenate synchronous streams, they will run in series, that is, one stream will only start to send data after the other finishes.

For example: 

```javascript
const Readable = require('stream').Readable

const stream1 = new Readable({
    objectMode: true,
    highWaterMark: 1,
    read: function () {
        this.push({
            'a' : Math.random()
        })
    }
})

const stream2 = new Readable({
    objectMode: true,
    highWaterMark: 1,
    read: function () {
        this.push({
            'b' : 1
        })
    }
})


const concat = new Concat([stream1, stream2])
concat.on('data', function (data) {
    console.log(data)
})
```

In the code above, `stream2` data will never be read, since both stream are infinite and synchronous. If you want to run two streams in parallel, you should defer them:

```javascript
const Readable = require('stream').Readable

const stream1 = new Readable({
    objectMode: true,
    highWaterMark: 1,
    read: function () {
        setImmediate(() => {
            this.push({
                'a' : Math.random()
            })
        })
    }
})

const stream2 = new Readable({
    objectMode: true,
    highWaterMark: 1,
    read: function () {
        setImmediate(() => {
            this.push({
                'b' : 1
            })
        })
    }
})


const concat = new Concat([stream1, stream2])
concat.on('data', function (data) {
    console.log(data)
})
```
