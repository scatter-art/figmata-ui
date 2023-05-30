import React from 'react'
import style from './Footer.module.css'

export const Footer = () => {
	return (
		<footer id={style['footer']}>
			<div id={style['gallery-button-container']}>
				<button id={style['gallery-button']}>Gallery</button>
			</div>

			<div id={style['social-button-container']}>
				<div></div>
				<div></div>
				<div></div>
			</div>
		</footer>
	)
}
