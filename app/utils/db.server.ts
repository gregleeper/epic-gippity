// 1. Import libSQL and the Prisma libSQL driver adapter
import { remember } from '@epic-web/remember'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'

// 2. Instantiate libSQL
const libsql = createClient({
	// @ts-expect-error
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
	syncUrl: process.env.TURSO_DATABASE_URL,
})

// 3. Instantiate the libSQL driver adapter
const adapter = new PrismaLibSQL(libsql)
// Pass the adapter option to the Prisma Client instance
async function sync() {
	return libsql.sync()
}

export const prisma = remember('prisma', () => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	// Feel free to change this log threshold to something that makes sense for you
	const logThreshold = 20
	sync()
	const client = new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'stdout' },
			{ level: 'warn', emit: 'stdout' },
		],
		adapter,
	})
	client.$on('query', async e => {
		if (e.duration < logThreshold) return
		const color =
			e.duration < logThreshold * 1.1
				? 'green'
				: e.duration < logThreshold * 1.2
				  ? 'blue'
				  : e.duration < logThreshold * 1.3
				    ? 'yellow'
				    : e.duration < logThreshold * 1.4
				      ? 'redBright'
				      : 'red'
		const dur = chalk[color](`${e.duration}ms`)
		console.info(`prisma:query - ${dur} - ${e.query}`)
	})
	void client.$connect()
	return client
})
