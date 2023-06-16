import React from 'react'
import style from './Counter.module.css'
import Countdown from 'react-countdown'

export const Counter = () => {
	return (
		<div id={style['counter-container']}>
			<div className={style['counter-outer']}>
				<div className={style['counter-inner']}>
					{/* Please make correct date here ser */}
					<Countdown date={Date.now() + 10000000} />
				</div>
			</div>
		</div>
	)
}
