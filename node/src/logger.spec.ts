import { logger } from "./logger"

describe('logger', () => {
    // eslint-disable-next-line jest/expect-expect
    it('logs', () => {
        logger.info("test")
    })
})