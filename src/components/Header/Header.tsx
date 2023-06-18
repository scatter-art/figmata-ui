import style from './Header.module.css'
import brandWordPixelady from '../../images/brand-word-pixelady.svg'
import brandWordFigmata from '../../images/brand-word-figmata.svg'
import brandBannerContainer from '../../images/brand-banner-container.svg'

export const Header = () => {
	return (
		<header id={style['header']}>
			<div className={style['brand-container']}>
				<div className={style['title']}>
					<img 
                        id={style['brand-word-pixelady']} 
                        src={brandWordPixelady}
                        alt='pixeladyBrand'
                    />

					<span>AUCTION HOUSE</span>

					<img 
                        id={style['brand-word-figmata']}
                        src={brandWordFigmata}
                        alt='figmataBrand'
                    />
				</div>

				<img 
                    id={style['brand-banner-container']}
                    src={brandBannerContainer} 
                    alt='bannerBrand'
                />
			</div>
		</header>
	)
}
