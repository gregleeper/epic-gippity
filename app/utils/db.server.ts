// 1. Import libSQL and the Prisma libSQL driver adapter
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

// 2. Instantiate libSQL
const libsql = createClient({
	// @ts-expect-error
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
})

// 3. Instantiate the libSQL driver adapter
const adapter = new PrismaLibSQL(libsql)
// Pass the adapter option to the Prisma Client instance
export const prisma = new PrismaClient({ adapter })
