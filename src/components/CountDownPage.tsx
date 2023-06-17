import React from 'react'
import { Header } from './Header/Header'
import { Polaroid } from './Polaroid/Polaroid'
import { CountdownPageCounter } from './CountdownPageCounter/CountdownPageCounter'

export const CountDownPage: React.FC = () => {
	return (
		<>
			<div id="motif-border"></div>
			<div id="motif-border"></div>

			<main>
				<Header />
				<div id="countdown-body">
					<Polaroid />
					<Polaroid />
					<Polaroid />
					<Polaroid />
					<Polaroid />
					<Polaroid />

					<CountdownPageCounter />
				</div>
			</main>
		</>
	)
}
