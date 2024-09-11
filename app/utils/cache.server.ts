// import fs from 'node:fs'
// import {
// 	cachified as baseCachified,
// 	verboseReporter,
// 	mergeReporters,
// 	type CacheEntry,
// 	type Cache as CachifiedCache,
// 	type CachifiedOptions,
// 	type Cache,
// 	totalTtl,
// 	type CreateReporter,
// } from '@epic-web/cachified'
// import { remember } from '@epic-web/remember'
// import { LRUCache } from 'lru-cache'
// import { z } from 'zod'
// import { cachifiedTimingReporter, type Timings } from './timing.server.ts'

// const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL

// const lru = remember(
// 	'lru-cache',
// 	() => new LRUCache<string, CacheEntry<unknown>>({ max: 5000 }),
// )

// export const lruCache = {
// 	name: 'app-memory-cache',
// 	set: (key, value) => {
// 		const ttl = totalTtl(value?.metadata)
// 		lru.set(key, value, {
// 			ttl: ttl === Infinity ? undefined : ttl,
// 			start: value?.metadata?.createdTime,
// 		})
// 		return value
// 	},
// 	get: key => lru.get(key),
// 	delete: key => lru.delete(key),
// } satisfies Cache

// const cacheEntrySchema = z.object({
// 	metadata: z.object({
// 		createdTime: z.number(),
// 		ttl: z.number().nullable().optional(),
// 		swr: z.number().nullable().optional(),
// 	}),
// 	value: z.unknown(),
// })
// const cacheQueryResultSchema = z.object({
// 	metadata: z.string(),
// 	value: z.string(),
// })

// export const cache: CachifiedCache = {
// 	name: 'SQLite cache',
// 	get(key) {
// 		const result = cacheDb
// 			.prepare('SELECT value, metadata FROM cache WHERE key = ?')
// 			.get(key)
// 		const parseResult = cacheQueryResultSchema.safeParse(result)
// 		if (!parseResult.success) return null

// 		const parsedEntry = cacheEntrySchema.safeParse({
// 			metadata: JSON.parse(parseResult.data.metadata),
// 			value: JSON.parse(parseResult.data.value),
// 		})
// 		if (!parsedEntry.success) return null
// 		const { metadata, value } = parsedEntry.data
// 		if (!value) return null
// 		return { metadata, value }
// 	},
// 	async set(key, entry) {
// 		const { currentIsPrimary, primaryInstance } = await getInstanceInfo()
// 		if (currentIsPrimary) {
// 			cacheDb
// 				.prepare(
// 					'INSERT OR REPLACE INTO cache (key, value, metadata) VALUES (@key, @value, @metadata)',
// 				)
// 				.run({
// 					key,
// 					value: JSON.stringify(entry.value),
// 					metadata: JSON.stringify(entry.metadata),
// 				})
// 		} else {
// 			// fire-and-forget cache update
// 			void updatePrimaryCacheValue({
// 				key,
// 				cacheValue: entry,
// 			}).then(response => {
// 				if (!response.ok) {
// 					console.error(
// 						`Error updating cache value for key "${key}" on primary instance (${primaryInstance}): ${response.status} ${response.statusText}`,
// 						{ entry },
// 					)
// 				}
// 			})
// 		}
// 	},
// 	async delete(key) {
// 		const { currentIsPrimary, primaryInstance } = await getInstanceInfo()
// 		if (currentIsPrimary) {
// 			cacheDb.prepare('DELETE FROM cache WHERE key = ?').run(key)
// 		} else {
// 			// fire-and-forget cache update
// 			void updatePrimaryCacheValue({
// 				key,
// 				cacheValue: undefined,
// 			}).then(response => {
// 				if (!response.ok) {
// 					console.error(
// 						`Error deleting cache value for key "${key}" on primary instance (${primaryInstance}): ${response.status} ${response.statusText}`,
// 					)
// 				}
// 			})
// 		}
// 	},
// }

// export async function getAllCacheKeys(limit: number) {
// 	return {
// 		sqlite: cacheDb
// 			.prepare('SELECT key FROM cache LIMIT ?')
// 			.all(limit)
// 			.map(row => (row as { key: string }).key),
// 		lru: [...lru.keys()],
// 	}
// }

// export async function searchCacheKeys(search: string, limit: number) {
// 	return {
// 		sqlite: cacheDb
// 			.prepare('SELECT key FROM cache WHERE key LIKE ? LIMIT ?')
// 			.all(`%${search}%`, limit)
// 			.map(row => (row as { key: string }).key),
// 		lru: [...lru.keys()].filter(key => key.includes(search)),
// 	}
// }

// export async function cachified<Value>(
// 	{
// 		timings,
// 		...options
// 	}: CachifiedOptions<Value> & {
// 		timings?: Timings
// 	},
// 	reporter: CreateReporter<Value> = verboseReporter<Value>(),
// ): Promise<Value> {
// 	return baseCachified(
// 		options,
// 		mergeReporters(cachifiedTimingReporter(timings), reporter),
// 	)
// }
