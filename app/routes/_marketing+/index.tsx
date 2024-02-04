import { type MetaFunction } from '@remix-run/node'
import { useEffect, useState } from 'react'

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	const [showImage, setShowImage] = useState(false)

	useEffect(() => {
		setShowImage(true)
	}, [])

	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="lg:pt-18 relative px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
						<h1 className="text-center font-mono font-extrabold tracking-tight sm:text-8xl lg:text-7xl">
							<span>Gippity</span>
						</h1>
						<div
							className={`mx-auto mt-4 w-1/2 transition-opacity duration-1000 ${
								showImage ? 'opacity-100' : 'opacity-0'
							}`}
						>
							<img
								className="rounded-3xl transition-opacity duration-1000"
								alt="generatedSchool"
								src="/highschool-generated-image.png"
							/>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
