import {
	MultipartParseError,
	parseMultipartRequest,
} from '@mjackson/multipart-parser'
import * as fs from 'fs'

import tmp from 'tmp'

async function writeFile(filename: string, stream: ReadableStream<Uint8Array>) {
	let file = fs.createWriteStream(filename)
	let bytesWritten = 0

	for await (let chunk of stream) {
		file.write(chunk)
		bytesWritten += chunk.byteLength
	}

	file.end()

	return bytesWritten
}

export async function handleMultipartRequest(request: Request) {
	let parts = []
	try {
		// The parser `yield`s each MultipartPart as it becomes available
		for await (let part of parseMultipartRequest(request)) {
			if (part.isFile) {
				let tmpfile = tmp.fileSync()
				let byteLength = await writeFile(tmpfile.name, part.body)

				// Or, if you'd prefer to buffer you can do it like this:
				// let bytes = await part.bytes()
				// fs.writeFileSync(tmpfile.name, bytes, 'binary')
				// let byteLength = bytes.byteLength
				console.log(part)
				parts.push({
					name: part.name,
					filename: part.filename,
					mediaType: part.mediaType,
					size: byteLength,
					file: tmpfile.name,
				})
			} else {
				console.log(part.name)
				console.log(part.filename)
				console.log(part.mediaType)

				parts.push({
					name: part.name,
					value: await part.text(),
				})
			}
		}
		return parts
	} catch (error) {
		if (error instanceof MultipartParseError) {
			console.error('Failed to parse multipart request:', error.message)
		} else {
			console.error('An unexpected error occurred:', error)
		}
	}
}
