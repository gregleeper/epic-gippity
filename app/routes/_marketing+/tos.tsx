import { Container } from '#app/components/container.tsx'
import { Footer } from '#app/components/footer.tsx'
import { GradientBackground } from '#app/components/gradient.tsx'
import { Navbar } from '#app/components/navbar.tsx'
import { Heading } from '#app/components/text.tsx'

export default function TermsOfServiceRoute() {
	return (
		<main className="overflow-hidden">
			<GradientBackground />
			<Container>
				<Navbar />
			</Container>
			<Container>
				<div className="prose mt-16">
					<Heading as="h1">Terms of Service</Heading>
					<p>Last updated: {new Date('2024-05-01').toLocaleDateString()}</p>
					<p>
						Welcome to Prosper Education! These Terms of Service outline the
						rules and regulations for the use of our website and services.
					</p>
					<p>
						By accessing this website, we assume you accept these terms. Do not
						continue to use Prosper Education if you do not agree to take all of
						the terms and conditions stated on this page.
					</p>
					<p>
						The following terminology applies to these Terms of Service:
						"Client", "You" and "Your" refers to you, the person accessing this
						website and accepting the Company's terms and conditions. "The
						Company", "Ourselves", "We", "Our" and "Us", refers to our Company.
						"Party", "Parties", or "Us", refers to both the Client and
						ourselves. All terms refer to the offer, acceptance and
						consideration of payment necessary to undertake the process of our
						assistance to the Client in the most appropriate manner.
					</p>
					<p>
						Any use of the above terminology or other words in the singular,
						plural, capitalization and/or they are taken as interchangeable and
						therefore as referring to same.
					</p>
					<h2>1. Intellectual Property Rights</h2>
					<p>
						Unless otherwise stated, we or our licensors own the intellectual
						property rights for all material on Prosper Education. All
						intellectual property rights are reserved. You may access this from
						Prosper Education for your own personal use subjected to
						restrictions set in these terms and conditions.
					</p>
					<p>
						You must not:
						<ul>
							<li>Republish material from Prosper Education</li>
							<li>Sell, rent or sub-license material from Prosper Education</li>
							<li>
								Reproduce, duplicate or copy material from Prosper Education
							</li>
							<li>Redistribute content from Prosper Education</li>
						</ul>
					</p>
					<h2>2. Restrictions</h2>
					<p>
						You are specifically restricted from all of the following:
						<ul>
							<li>Publishing any Website material in any other media</li>
							<li>
								Selling, sublicensing and/or otherwise commercializing any
								website material
							</li>
						</ul>
					</p>
					<h2>3. Intellectual Property Rights</h2>
					<p>
						Unless otherwise stated, we or our licensors own the intellectual
						property rights for all material on Prosper Education. All
						intellectual property rights are reserved. You may access this from
						Prosper Education for your own personal use subjected to
						restrictions set in these terms and conditions.
					</p>
					<h2>4. Restrictions</h2>
					<p>
						You are specifically restricted from all of the following:
						<ul>
							<li>Publishing any Website material in any other media</li>
							<li>
								Selling, sublicensing and/or otherwise commercializing any
								website material
							</li>
						</ul>
					</p>
				</div>
			</Container>
			<Footer />
		</main>
	)
}
