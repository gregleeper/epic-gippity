import { ClipboardCopyIcon, CheckIcon } from 'lucide-react'
import React, { useState, useCallback, useRef } from 'react'
import { Button } from '#app/components/ui/button.tsx'

interface CopyToClipboardProps {
	children: React.ReactNode
	className?: string
}

export function CopyToClipboard({ children, className }: CopyToClipboardProps) {
	const [isCopied, setIsCopied] = useState(false)
	const contentRef = useRef<HTMLDivElement>(null)

	const copyToClipboard = useCallback(() => {
		if (contentRef.current) {
			const textToCopy = contentRef.current.innerText
			navigator.clipboard.writeText(textToCopy).then(() => {
				setIsCopied(true)
				setTimeout(() => setIsCopied(false), 2000)
			})
		}
	}, [])

	return (
		<div className={`relative ${className}`}>
			<div ref={contentRef}>{children}</div>
			<Button
				onClick={copyToClipboard}
				variant="ghost"
				size="icon"
				className="absolute right-2 top-2"
			>
				{isCopied ? (
					<CheckIcon className="h-4 w-4 text-green-500" />
				) : (
					<ClipboardCopyIcon className="h-4 w-4" />
				)}
			</Button>
		</div>
	)
}
