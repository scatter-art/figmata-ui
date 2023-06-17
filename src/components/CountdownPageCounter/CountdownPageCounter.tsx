import Countdown, { CountdownRendererFn } from 'react-countdown'
import { pageSwapObserver } from '../../state/observerStore'
import style from './CountdownPageCounter.module.css'

export const defaultCountdownRenderer: CountdownRendererFn = ({
    completed, hours, minutes, seconds
}) => {
    if (completed) return <>'Finished'</>
    return <>{hours}:{minutes}:{seconds}</>
}

export const CountdownPageCounter = () => {
    
    const changePage = pageSwapObserver(s => s.notifyObservers)

	return (
		<div id={style['counter-container']}>
			<div className={style['counter-outer']}>
				<div className={style['counter-inner']}>
					{/* Please make correct date here ser TODO TODO TODO */}
                    <Countdown
                        date={Date.now() + 5000} 
                        //renderer={defaultCountdownRenderer}
                        onComplete={changePage}
                        daysInHours
                    />

				</div>
			</div>
		</div>
	)
}
