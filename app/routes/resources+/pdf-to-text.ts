import {
	type LoaderFunctionArgs,
	json,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
} from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server.ts'

export async function action({ request }: LoaderFunctionArgs) {
	// parse the form data as multipart form data
	await requireUserId(request)
	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createMemoryUploadHandler(),
	)
	const uploadBody = new FormData()
	const pdf = formData.get('pdf')
	console.log(pdf)

	if (!pdf) {
		return json({ error: 'No PDF file found' }, { status: 400 })
	}
	uploadBody.append('pdf', pdf)

	const res = await fetch(
		'https://pdf-table-extractor.fly.dev/extract-tables',
		{
			method: 'POST',
			body: uploadBody,
			headers: {
				Accept: '*/*',
				Authorization: 'Basic YWRtaW46R21sMTlzZWw=',
			},
		},
	)
	const data = await res.json()
	const mdData = jsonToMarkdown(data)
	return json({ data, markdownData: mdData })
}

function jsonToMarkdown(json: any): string {
	let markdown = ''
	for (const table of json.tables) {
		let headers = Object.keys(table)
		let rows = Object.keys(table[headers[0]])

		// Add headers
		markdown += headers.join(' | ') + '\n'
		markdown += headers.map(() => '---').join(' | ') + '\n'

		// Add rows
		for (const row of rows) {
			let cells = headers.map(header =>
				table[header][row].replace(/\n([•●])/g, '\n- ').replace(/\n/g, ' '),
			)
			markdown += cells.join(' | ') + '\n'
		}

		// Add a newline between tables
		markdown += '\n'
	}
	return markdown
}
