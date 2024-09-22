import * as Headless from '@headlessui/react'
import { Link as RouterLink, type LinkProps } from '@remix-run/react'
import { forwardRef } from 'react'

export const Link = forwardRef(function Link(
	props: LinkProps & React.ComponentPropsWithoutRef<'a'>,
	to: string,
) {
	return (
		<Headless.DataInteractive>
			<RouterLink to={to} {...props} />
		</Headless.DataInteractive>
	)
})
