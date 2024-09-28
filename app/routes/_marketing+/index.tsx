import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { ChevronRightIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BentoCard } from '#app/components/bento-card.tsx'
import { Button as ProsperButton } from '#app/components/button.tsx'
import { Container } from '#app/components/container.tsx'
import { Gradient } from '#app/components/gradient.tsx'
import { Map } from '#app/components/map.tsx'
import { Navbar } from '#app/components/navbar.tsx'
import { Screenshot } from '#app/components/screenshot.tsx'
import { Heading, Subheading } from '#app/components/text.tsx'
import ss from '../../screenshots/proser-submission-ss.png'
import { Footer } from '#app/components/footer.tsx'

export const meta: MetaFunction = () => [
	{ title: 'Prosper Education - AI Powered' },
	{
		description:
			'Prosper Education is an AI-powered platform designed to support educators in transforming the classroom experience. Our platform leverages AI-driven analytics, adaptive learning tools, and automation to enhance student engagement, personalize learning paths, and save valuable time for educators.',
	},
	{
		keywords:
			'Prosper Education, AI-powered platform, educator support, personalized learning, time-saving automation, student engagement, adaptive learning tools, real-time feedback, AI-driven analytics, educational technology',
	},
]
function BentoSection() {
	return (
		<Container>
			<Subheading>Features</Subheading>
			<Heading as="h3" className="mt-2 max-w-3xl">
				Tools for educators.
			</Heading>

			<div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
				<BentoCard
					eyebrow="Unit Planning"
					title="Create a unit plan"
					description="Use our AI to create a unit plan for your students."
					graphic={
						<div className="h-80 bg-[url(/screenshots/unit-plan-ss.png)] bg-[size:1000px_550px] bg-[left_-0px_top_-20px] bg-no-repeat" />
					}
					fade={['bottom']}
					className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl"
				/>
				<BentoCard
					eyebrow="From broad unit plans"
					title="Use your unit plans"
					description="Use your unit plans to get a broad overview of the unit and the standards it covers."
					graphic={
						<div className="absolute inset-0 bg-[url(/screenshots/farenheit-unit-plan-ss.png)] bg-[size:1100px_650px] bg-[left_-10px_top_-35px] bg-no-repeat" />
					}
					fade={['bottom']}
					className="lg:col-span-3 lg:rounded-tr-4xl"
				/>
				<BentoCard
					eyebrow="To more specific lesson plans"
					title="Lesson planning made easy"
					description="Use Prosper to create lesson plans that are tailored to your students and the standards they need to learn."
					graphic={
						<div className="absolute inset-0 bg-[url(/screenshots/lesson-plan-ss.png)] bg-[size:600px_350px] bg-[left_-50px_top_-25px] bg-no-repeat" />
					}
					fade={['bottom']}
					className="lg:col-span-2 lg:rounded-tr-4xl"
				/>
				<BentoCard
					eyebrow="Upload your pdf rubrics"
					title="Use your rubrics"
					description="Use the rubrics you already have to save time grading. A simple upload and AI takes over."
					graphic={
						<div className="absolute inset-0 bg-[url(/screenshots/rubric-upload-ss.png)] bg-[size:800px_350px] bg-[left_-50px_top_-25px] bg-no-repeat transition-all duration-300 hover:bg-[size:800px_350px] hover:bg-[left_-100px_top_-25px]" />
					}
					fade={['bottom']}
					className="lg:col-span-2 lg:rounded-tr-4xl"
				/>
				<BentoCard
					eyebrow="Limitless"
					title="Useful for all educators"
					description="Prosper is useful for all educators, from elementary to high school, and beyond."
					graphic={<Map />}
					className="max-lg:rounded-b-4xl lg:col-span-2 lg:rounded-br-4xl"
				/>
			</div>
		</Container>
	)
}

function Hero() {
	return (
		<div className="relative">
			<Gradient className="absolute inset-2 bottom-0 rounded-4xl ring-1 ring-inset ring-black/5" />
			<Container className="relative">
				<Navbar
					banner={
						<Link
							to="/blog/radiant-raises-100m-series-a-from-tailwind-ventures"
							className="flex items-center gap-1 rounded-full bg-fuchsia-950/35 px-3 py-0.5 text-sm/6 font-medium text-white data-[hover]:bg-fuchsia-950/30"
						>
							Prosper Education is now live!
							<ChevronRightIcon className="size-4" />
						</Link>
					}
				/>
				<div className="pb-24 pt-16 sm:pb-32 sm:pt-24 md:pb-48 md:pt-32">
					<h1 className="font-display text-balance text-6xl/[0.9] font-medium tracking-tight text-gray-950 sm:text-8xl/[0.8] md:text-9xl/[0.8]">
						Save time.
					</h1>
					<p className="mt-8 max-w-lg text-balance text-xl/7 font-medium text-gray-950/75 sm:text-2xl/8">
						Prosper Education is an AI-powered platform for educators.
					</p>
					<div className="mt-12 flex flex-col gap-x-6 gap-y-4 sm:flex-row">
						<Link to="/signup">
							<ProsperButton>Get started</ProsperButton>
						</Link>
						{/* <Link to="/pricing">
							<ProsperButton variant="secondary">See pricing</ProsperButton>
						</Link> */}
					</div>
				</div>
			</Container>
		</div>
	)
}
function FeatureSection() {
	return (
		<div className="overflow-hidden">
			<Container className="pb-24">
				<Heading as="h2" className="max-w-3xl">
					Super charge your feedback process.
				</Heading>
				<Screenshot
					width={1216}
					height={768}
					src={ss}
					className="mt-16 h-[36rem] sm:h-auto sm:w-[76rem]"
				/>
			</Container>
		</div>
	)
}

export default function Index() {
	return (
		<div className="overflow-hidden">
			<Hero />
			<main className="">
				<div className="bg-gradient-to-b from-white from-50% to-gray-100 py-32">
					<FeatureSection />
					<BentoSection />
				</div>
			</main>
			<Footer />
		</div>
	)
}
// <div className="relative px-10 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-0">
// 	<div className="flex items-center justify-around">
// 		<div className="w-1/2 rounded-3xl bg-stone-200/25 px-4 py-10">
// 			<h1 className="text-center font-mono font-extrabold tracking-tight sm:text-8xl lg:text-5xl">
// 				Help your students{' '}
// 				<span className="text-amber-700">Prosper</span> with the power
// 				of AI
// 			</h1>
// 			<div>
// 				<p className="mt-4 text-center text-lg font-semibold text-gray-700">
// 					Elevate Your Teaching with Prosper - The Innovative AI-Powered
// 					Platform Designed to Support Educators.
// 				</p>
// 			</div>
// 		</div>
// 		<div
// 			className={`mx-auto mt-4 w-1/2 transition-opacity duration-1000 ${
// 				showImage ? 'opacity-100' : 'opacity-0'
// 			}`}
// 		>
// 			{theme === 'dark' ? (
// 				<div className="">
// 					<div className=" h-full w-full rounded-full">
// 						<img
// 							className="h-full w-full rounded-3xl transition-opacity duration-1000"
// 							alt="generatedSchool"
// 							src="/prosper-logo-white-lines.png"
// 						/>
// 					</div>
// 				</div>
// 			) : (
// 				<img
// 					className="h-full w-full rounded-3xl transition-opacity duration-1000"
// 					alt="generatedSchool"
// 					src="/prosper-logo-light.png"
// 				/>
// 			)}
// 		</div>
// 	</div>
// 	<div className=" pb-24 pt-4 ">
// 		<p className="mx-36 mt-8 text-center text-xl font-semibold text-gray-800 ">
// 			Join{' '}
// 			<span className=" font-mono text-2xl text-amber-700">
// 				Prosper
// 			</span>{' '}
// 			today. Harness AI to transform your classroom. Sign up for early
// 			access now.
// 		</p>
// 		<div className="mt-8 flex justify-center">
// 			<Link to="/signup">
// 				<Button className="border-2 border-amber-800 bg-amber-600/85 px-8 py-6 text-2xl font-medium text-amber-950 shadow-lg transition-all duration-300 hover:scale-105 hover:border-amber-500 hover:bg-amber-600/90 hover:text-white hover:shadow-xl">
// 					Get Started
// 				</Button>
// 			</Link>
// 		</div>
// 	</div>
// 	<div className=" rounded-3xl bg-stone-200/40 px-10 py-24 text-lg leading-relaxed">
// 		<div className="">
// 			<p className="font-medium text-gray-900">
// 				Teaching is both an art and a science, and at Prosper, we
// 				believe that blending the best of human expertise with
// 				cutting-edge AI technology is the key to unlocking student
// 				potential. Our platform is designed to be an invaluable partner
// 				for educators, providing personalized insights, adaptive
// 				learning tools, and a wealth of innovative resources to enhance
// 				the classroom experience.
// 			</p>
// 		</div>
// 	</div>
// 	<div className="mt-36">
// 		<div>
// 			<h2 className="text-center text-4xl font-semibold text-gray-900">
// 				Why Choose Prosper?
// 			</h2>
// 		</div>
// 		<div className=" space-y-8 lg:mb-10 lg:mt-8 lg:flex lg:w-full lg:flex-row lg:justify-around lg:gap-8 lg:space-y-0">
// 			<div className="mt-8 rounded-3xl bg-stone-200/25 px-3 py-4 lg:mt-0 lg:w-1/3">
// 				<h3 className="pb-4 text-center text-2xl font-semibold ">
// 					Enhanced Learning
// 				</h3>
// 				<p className="text-center text-lg font-medium text-gray-950">
// 					Leverage AI-driven analytics to gain a deeper understanding of
// 					each student's strengths, weaknesses, and learning
// 					preferences, enabling you to tailor your teaching approach for
// 					maximum impact.
// 				</p>
// 			</div>
// 			<div className="rounded-3xl bg-stone-200/25 px-3 py-4 lg:w-1/3">
// 				<h3 className="pb-4 text-center text-2xl font-semibold ">
// 					Adaptive Learning Tools
// 				</h3>
// 				<p className="text-center text-lg font-medium text-gray-950">
// 					Our AI-powered tools continuously adjust to each student's
// 					pace and progress, providing personalized recommendations,
// 					interactive exercises, and real-time feedback to ensure no one
// 					falls behind.
// 				</p>
// 			</div>
// 			<div className="rounded-3xl bg-stone-200/25 px-3 py-4 lg:w-1/3">
// 				<h3 className="pb-4 text-center text-2xl font-semibold ">
// 					Time-Saving Automation
// 				</h3>
// 				<p className="text-center text-lg font-medium text-gray-950">
// 					Say goodbye to administrative burdens with our AI-driven
// 					automation features, freeing up valuable time for you to focus
// 					on what truly matters: engaging your students and nurturing
// 					their love of learning.
// 				</p>
// 			</div>
// 		</div>
// 	</div>
// </div>
