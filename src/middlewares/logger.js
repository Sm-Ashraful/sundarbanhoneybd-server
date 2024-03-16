import { format } from 'date-fns'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import { promises } from 'fs';
import path from "path"


const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss')
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`

    try {
        if (!fs.existsSync(path.join("__dirname", '..', 'logs'))) {
            await promises.mkdir(path.join("__dirname", '..', 'logs'))
        }
        await promises.appendFile(path.join("__dirname", '..', 'logs', logFileName), logItem)
    } catch (err) {
        console.log(err)
    }
}

const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log')
    console.log(`${req.method} ${req.path}`)
    next()
}

export { logger, logEvents }