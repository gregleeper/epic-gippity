import { useRef } from 'react'
import { useResize } from '#app/utils/misc.tsx'

interface Props {
	leftPanel: React.ReactNode
	rightPanel: React.ReactNode
}

export const ResizablePanels = ({ leftPanel, rightPanel }: Props) => {
	const containerRef = useRef(null)
	const panelRef = useRef(null)
	const handleWidth = 16
	const maxContainerWidth = 2400

	const { panelWidth, onResizeStart } = useResize(
		containerRef,
		panelRef,
		maxContainerWidth,
	)

	return (
		<div
			ref={containerRef}
			style={{
				width: '100%',
				maxWidth: `100%`,
				backgroundColor: '#6b7280',
			}}
		>
			<div
				ref={panelRef}
				style={{
					position: 'relative',
					width: `${panelWidth}px`,
					maxWidth: '100%',
					height: '100%',
					paddingRight: `${handleWidth}px`,
					backgroundColor: '#f1f2f4',
				}}
			>
				{leftPanel}
				<div
					className="cursor:ew-resize w- bg-gray-100"
					// style={{
					// 	position: 'absolute',
					// 	top: '0',
					// 	right: '0',
					// 	height: '100%',
					// 	width: `${handleWidth}px`,
					// 	backgroundColor: '',
					// 	borderLeft: '1px solid #e5e7eb',
					// 	cursor: 'ew-resize',
					// }}
					children={rightPanel}
					onPointerDown={onResizeStart}
				/>
			</div>
		</div>
	)
}
