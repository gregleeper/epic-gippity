import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './ui/button.tsx'

type ParagraphProps = {
	id: string
	content: string
	type: string
	onInteract: (id: string) => void
}

export function InteractiveParagraph({
	id,
	content,
	type,
	onInteract,
}: ParagraphProps) {
	return (
		<div className="mb-4 rounded border p-4">
			<div className="mb-2 flex items-center justify-between">
				<span className="font-bold capitalize">{type}</span>
				<Button onClick={() => onInteract(id)}>Interact</Button>
			</div>
			<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
		</div>
	)
}
