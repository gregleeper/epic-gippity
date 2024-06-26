import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Button } from '#app/components/ui/button.tsx'
import { useTheme } from '#app/root.tsx'

export const meta: MetaFunction = () => [{ title: 'Prosper' }]

export default function Index() {
	const [showImage, setShowImage] = useState(false)
	const theme = useTheme()

	useEffect(() => {
		setShowImage(true)
	}, [])

	return (
		<main className="relative min-h-screen  bg-gradient-to-tl from-orange-600 via-amber-300 to-stone-400 sm:flex sm:items-center sm:justify-center">
			<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
				<div className="relative px-10 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-0">
					<div className="flex items-center justify-around">
						<div className="w-1/2 rounded-3xl bg-stone-200/25 px-4 py-10">
							<h1 className="text-center font-mono font-extrabold tracking-tight sm:text-8xl lg:text-5xl">
								Help your students{' '}
								<span className="text-amber-700">Prosper</span> with the power
								of AI
							</h1>
							<div>
								<p className="mt-4 text-center text-lg font-semibold text-gray-700">
									Elevate Your Teaching with Prosper - The Innovative AI-Powered
									Platform Designed to Support Educators.
								</p>
							</div>
						</div>
						<div
							className={`mx-auto mt-4 w-1/2 transition-opacity duration-1000 ${
								showImage ? 'opacity-100' : 'opacity-0'
							}`}
						>
							{theme === 'dark' ? (
								<div className="">
									<div className=" h-full w-full rounded-full">
										<img
											className="h-full w-full rounded-3xl transition-opacity duration-1000"
											alt="generatedSchool"
											src="/prosper-logo-white-lines.png"
										/>
									</div>
								</div>
							) : (
								<img
									className="h-full w-full rounded-3xl transition-opacity duration-1000"
									alt="generatedSchool"
									src="/prosper-logo-light.png"
								/>
							)}
						</div>
					</div>
					<div className=" pb-24 pt-10">
						<p className="mx-36 mt-8 text-center text-lg font-semibold text-gray-800 ">
							Join the{' '}
							<span className=" font-mono text-xl text-amber-700">Prosper</span>{' '}
							community today and experience the transformative power of AI in
							education. Sign up now for early access and be among the first to
							revolutionize your classroom.
						</p>
						<div className="mt-8 flex justify-center">
							<Link to="/signup">
								<Button className="font-medium text-amber-700 ">
									Get Started
								</Button>
							</Link>
						</div>
					</div>
					<div className=" rounded-3xl bg-stone-200/25 px-10 py-24">
						<div className="">
							<p className="font-medium text-gray-700">
								Teaching is both an art and a science, and at Prosper, we
								believe that blending the best of human expertise with
								cutting-edge AI technology is the key to unlocking student
								potential. Our platform is designed to be an invaluable partner
								for educators, providing personalized insights, adaptive
								learning tools, and a wealth of innovative resources to enhance
								the classroom experience.
							</p>
						</div>
					</div>
					<div className="mt-36">
						<div>
							<h2 className="text-center text-4xl font-semibold text-gray-700">
								Why Choose Prosper?
							</h2>
						</div>
						<div className="mb-10 mt-8 flex justify-around gap-8">
							<div className="w-1/3 rounded-3xl bg-stone-200/25 px-3 py-4">
								<h3 className="pb-4 text-center text-2xl font-semibold ">
									Enhanced Learning
								</h3>
								<p className="text-center text-lg font-medium text-gray-900">
									Leverage AI-driven analytics to gain a deeper understanding of
									each student's strengths, weaknesses, and learning
									preferences, enabling you to tailor your teaching approach for
									maximum impact.
								</p>
							</div>
							<div className="w-1/3 rounded-3xl bg-stone-200/25 px-3 py-4">
								<h3 className="pb-4 text-center text-2xl font-semibold ">
									Adaptive Learning Tools
								</h3>
								<p className="text-center text-lg font-medium text-gray-700">
									Our AI-powered tools continuously adjust to each student's
									pace and progress, providing personalized recommendations,
									interactive exercises, and real-time feedback to ensure no one
									falls behind.
								</p>
							</div>
							<div className="w-1/3 rounded-3xl bg-stone-200/25 px-3 py-4">
								<h3 className="pb-4 text-center text-2xl font-semibold ">
									Time-Saving Automation
								</h3>
								<p className="text-center text-lg font-medium text-gray-700">
									Say goodbye to administrative burdens with our AI-driven
									automation features, freeing up valuable time for you to focus
									on what truly matters: engaging your students and nurturing
									their love of learning.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
