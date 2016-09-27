module.exports = Concat

const stream      = require('stream')
const PassThrough = stream.PassThrough
const Readable    = stream.Readable
const inherits    = require('util').inherits

const defaultOptions = {
    objectMode: true
}

/**
 * Constructor for a concat stream
 *
 * If invokaed as a function, will automatically call itself with `new` and 
 * return the new stream.
 *
 * You can pass either a single stream or and Array of streams as the first 
 * parameter of this constructor. In this case, the streams will be added to
 * the concat stream and automatically piped to it.
 *
 * If you don't want to specify any streams during the call of the constructor,
 * you can just skip this parameter and pass only the `options` parameter as
 * the first one.
 *
 * @param {mixed = undefined} streams the streams to concat
 * @param {Object = undefined} options the streams options that will be
 *      forwarded to the underlying stream implementations. For further details,
 *      @see @link {https://nodejs.org/api/stream.html}
 * @returns {Concat|undefined} if called as a function (without the `new` 
 *      operator), automatically returns calling `new` 
 * @throws {Error} when any of the `streams` is not an instance of
 *  `stream.Readabe`
 */
function Concat(streams, options) {
    if (!(this instanceof Concat)) {
        return new Concat(options)
    }

    // Single stream as first argument
    if (isReadableStream(streams)) {
        streams = [streams]
    // No stream as first argument, but options passed
    } else if (isObject(streams) && options === undefined) {
        options = streams
        streams = []
    }

    streams = streams || []
    options = Object.assign(options || {}, defaultOptions)

    PassThrough.call(this, options)

    this.setMaxListeners(+options.maxListeners || 0)

    this._closed = false
    this._sources = []

    streams.forEach(this.add.bind(this))

    this.on('unpipe', this.remove.bind(this))
}

inherits(Concat, PassThrough)

/**
 * Adds a stream to the Concat stream
 *
 * @param {Array|stream.Readable} source the stream(s) to add
 * @return {Concat} this
 * @throws {Error}  if the concat stream is closed
 */
Concat.prototype.add = function (source) {
    if (this._closed === true) {
        throw new Error('Stream is closed')
    }

    if (isArray(source)) {
        source.forEach(this.add.bind(this))
        return this
    }

    if (!isReadableStream(source)) {
        throw new Error('Invalid readable stream')
    }

    this._sources.push(source)

    source.once('end', this.remove.bind(this, source))
    setImmediate(() => {
        source.pipe(this, {end : false})
    }) 

    return this
}

/**
 * Removes a stream from the Concat stream
 *
 * @param {Array|stream.Readable} source the stream(s) to add
 * @return {Concat} this
 */
Concat.prototype.remove = function (source) {
    source.unpipe(this)

    this._sources = this._sources.filter(item => item !== source)

    if (this._sources.length === 0 && this.readable) {
        this.end()
    }

    return this
}

/**
 * Removes all sources from the concat stream.
 * **Notice**: this will cause an `end` being emitted
 *
 * @return {Concat} this
 */
Concat.prototype.clear = function () {
    this._sources.forEach(source => {
        this.remove(source)
    })

    return this
}

/**
 * Closes the concat stream so no more events will be emitted.
 *
 * @return {Concat} this
 */
Concat.prototype.close = function () {
    if (this._closed) {
        return
    }

    this._closed = true
    this.clear()

    setImmediate(() => {
        // Must pause before emitting the `close` event
        this.pause()
        this.emit('close')
    })

    return this
}

/**
 * Helper function to check if a given arg is an `Object`
 *
 * @returns {bool}
 */
function isObject(arg) {
    return Object.prototype.toString.call(arg) === '[object Object]'
}

/**
 * Helper function to check if a given arg is an `Array`
 *
 * @returns {bool}
 */
function isArray(arg) {
    return Array.isArray(arg)
}

/**
 * Helper function to check if a given arg is a readable stream
 *
 * @returns {bool}
 */
function isReadableStream(arg) {
    return arg instanceof stream.Readable 
        && typeof arg._read === 'function' 
        && typeof arg._readableState === 'object' 
}
