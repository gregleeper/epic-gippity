'use client'

import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from '@headlessui/react'
import { Bars2Icon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { motion } from 'framer-motion'
// import { Logo } from './logo.tsx'
import { PlusGrid, PlusGridItem, PlusGridRow } from './plus-grid.tsx'
import { ProsperLogo } from './ProsperLogo.tsx'

const links = [
	{ href: '/about', label: 'About' },
	{ href: '/privacy', label: 'Privacy' },
	{ href: '/blog', label: 'Blog' },
	{ href: '/login', label: 'Login' },
]

function DesktopNav() {
	return (
		<nav className="relative hidden lg:flex">
			{links.map(({ href, label }) => (
				<PlusGridItem key={href} className="relative flex">
					<Link
						to={href}
						className="flex items-center px-4 py-3 text-base font-medium text-gray-950 bg-blend-multiply data-[hover]:bg-black/[2.5%]"
					>
						{label}
					</Link>
				</PlusGridItem>
			))}
		</nav>
	)
}

function MobileNavButton() {
	return (
		<DisclosureButton
			className="flex size-12 items-center justify-center self-center rounded-lg data-[hover]:bg-black/5 lg:hidden"
			aria-label="Open main menu"
		>
			<Bars2Icon className="size-6" />
		</DisclosureButton>
	)
}

function MobileNav() {
	return (
		<DisclosurePanel className="lg:hidden">
			<div className="flex flex-col gap-6 py-4">
				{links.map(({ href, label }, linkIndex) => (
					<motion.div
						initial={{ opacity: 0, rotateX: -90 }}
						animate={{ opacity: 1, rotateX: 0 }}
						transition={{
							duration: 0.15,
							ease: 'easeInOut',
							rotateX: { duration: 0.3, delay: linkIndex * 0.1 },
						}}
						key={href}
					>
						<Link to={href} className="text-base font-medium text-gray-950">
							{label}
						</Link>
					</motion.div>
				))}
			</div>
			<div className="absolute left-1/2 w-screen -translate-x-1/2">
				<div className="absolute inset-x-0 top-0 border-t border-black/5" />
				<div className="absolute inset-x-0 top-2 border-t border-black/5" />
			</div>
		</DisclosurePanel>
	)
}

export function Navbar({ banner }: { banner?: React.ReactNode }) {
	return (
		<Disclosure as="header" className="pt-12 sm:pt-16">
			<PlusGrid>
				<PlusGridRow className="relative flex justify-between">
					<div className="relative flex gap-6">
						<PlusGridItem className="py-3">
							<Link to="/" title="Home">
								<div className="h-12 w-auto">
									<ProsperLogo className="h-full w-full" />
								</div>
							</Link>
						</PlusGridItem>
						{banner && (
							<div className="relative hidden items-center py-3 lg:flex">
								{banner}
							</div>
						)}
					</div>
					<DesktopNav />
					<MobileNavButton />
					<MobileNav />
				</PlusGridRow>
			</PlusGrid>
		</Disclosure>
	)
}
