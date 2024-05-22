import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function PrivacyRoute() {
	return (
		<div className="container pb-10">
			<div className=" prose prose-lg  h-full  max-w-none overflow-y-scroll p-10 dark:prose-invert ">
				<Markdown
					remarkPlugins={[remarkGfm]}
					children={` 
# Privacy Policy

Last updated: May 11, 2024

Prosper Education ("we", "us", or "our") is committed to protecting the privacy and security of the personal information of our users. This Privacy Policy outlines how we collect, use, disclose, and safeguard the personal information provided through our web application Prosper (the "Application").

## Information We Collect

When you use our Application, we may collect the following types of information:

1. **User Account Information**: When you create an account with our Application, we may collect your name, email address, and other account registration details.

2. **Usage Information**: We may collect information about how you use our Application, including the features you access, the time and duration of your sessions, and other usage data.

3. **Technical Information**: We may collect technical information about the device you use to access our Application, such as the device type, operating system, browser type, and IP address.

We do not collect any personally identifiable information (PII) related to students through our Application.

## How We Use Your Information

We may use the information we collect for the following purposes:

1. **To provide and maintain our Application**: We use the information to operate, maintain, and improve our Application, including troubleshooting and addressing technical issues.

2. **To communicate with you**: We may use your contact information to send you updates, notifications, and other communications related to our Application.

3. **For analytics and improvement**: We may analyze usage data to understand how users interact with our Application and to improve its features and functionality.

4. **To comply with legal obligations**: We may use and disclose your information as required by applicable laws, regulations, or legal processes.

## Data Security

We implement appropriate technical and organizational measures to protect the personal information we collect against unauthorized access, disclosure, alteration, or destruction. However, please note that no method of data transmission or storage is 100% secure.

## Data Retention

We will retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.

## Changes to this Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this Privacy Policy periodically for any changes.

## Contact Us

If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at [Insert Contact Information].`}
				/>
			</div>
		</div>
	)
}
