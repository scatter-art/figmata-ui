import React from 'react'
import style from './Polaroid.module.css'
import Tilt from 'react-parallax-tilt'

export const Polaroid = () => {
	const min = -80
	const max = 80
	const randomNum = Math.floor(Math.random() * (max - min + 1)) + min

	return (
		<Tilt
			className={style['polaroid-wrapper']}
			perspective={1000}
			glareEnable={true}
			scale={1.125}
			glarePosition={'all'}
			glareReverse={true}
			glareMaxOpacity={0.72}
			transitionSpeed={1200}
			tiltAngleXInitial={randomNum}
			tiltAngleYInitial={randomNum}
		>
			<div className={style['polaroid']}>
				<div className={style['image-container']}>
					<div className={style['image']} />
				</div>

				<div className={style['visint']} />
			</div>
		</Tilt>
	)
}
