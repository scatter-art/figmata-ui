import { useEffect, useState } from 'react'
import { PROVIDER_DOWN_MESSAGE, useParallelAuctionState } from '../../../state/autoAuctionStore'
import style from './PlaceBidButton.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { AuctionConfigStruct, LineStateStruct } from '../../../types/IHoldsParallelAutoAuctionData'
import { fromWei } from '../../../utils/web3'
import { ethers } from 'ethers'
import { useUserStore } from '../../../state/userStore'
import { reRenderSidePanelObserver } from '../../../state/observerStore'
import toast from 'react-hot-toast'

const calcMinPriceForLine = (line: O.Option<LineStateStruct>, config: O.Option<AuctionConfigStruct>): string => {
	const newPrice = pipe(
		O.Do,
		O.bind('line', () => line),
		O.bind('config', () => config),
		O.flatMap(({ line, config }) => O.of(
            line.currentWinner.toString() === '0x' + '0'.repeat(40)
				? ethers.getBigInt(config.startingPrice)
				: ethers.getBigInt(line.currentPrice) + ethers.getBigInt(config.bidIncrement)
			)
		)
	)

	return pipe(newPrice, O.map(fromWei), O.getOrElse(PROVIDER_DOWN_MESSAGE))
}

// TODO ??? Fix this, the state is all over the place.
export const PlaceBidButton = () => {
	const line = useParallelAuctionState(s => s.getCurrentSelectedLine)()
	const lineIndex = useParallelAuctionState(s => s.currentLineIndex)
	const reRenderSidePanel = reRenderSidePanelObserver(s => s.notifyObservers)

	const updateLine = useParallelAuctionState(s => s.updateLine)
	const setCurrentSelectedIndex = useParallelAuctionState(s => s.setCurrentSelectedIndex)
    const getIsVipId = useParallelAuctionState(s => s.getCurrentLineIsVipId)

	const config = useParallelAuctionState(s => s.getAuctionConfig)()
	const createBid = useParallelAuctionState(s => s.createBid)

	const userConnected = useUserStore(s => s.userConnected)
	const connection = useUserStore(s => s.connectUser)
	const getIsRightChainId = useUserStore(s => s.isRightChainId)

	const minPrice = calcMinPriceForLine(line, config)

	const currentBid = useParallelAuctionState(s => s.getFormattedCurrentBid)(lineIndex)

	const [inputValue, setInputValue] = useState<number>(0)

    const getIsVip = useParallelAuctionState(s => s.getIsVip)

	const handleNewInput = (newValue: number) => {
		if (isNaN(newValue) || newValue < parseFloat(minPrice)) setInputValue(parseFloat(minPrice))
		else setInputValue(newValue)
	}

	useEffect(() => setInputValue(parseFloat(minPrice)) , [minPrice])

	const getModal = () => pipe(
        O.fromNullable(document.getElementById('bidModal')),
        O.flatMap(modal => O.tryCatch(() => modal as HTMLDialogElement))
	)

	const handleModalOppening = async () => {
		pipe(
			getModal(),
			O.map(modal => modal.showModal()),
		)
        
        await updateLine(lineIndex)
        reRenderSidePanel()
    }

	const handleModalClosing = async () => {
		pipe(
			getModal(),
			O.map(modal => modal.close())
        )

        await updateLine(lineIndex)
        reRenderSidePanel()
    }

	const handleBidConfirmation = async () => {
        
        if(!(await getIsRightChainId())) {
            toast.error('Connect to ethereum!')
            return
        }

        if(getIsVipId() && !(await getIsVip())) {
            toast.error('Not a VIP!')
            return
        }

		const toastAwaiting = toast.loading('Awaiting signature...')

		const tx = await createBid(inputValue)

		toast.dismiss(toastAwaiting)

		if (O.isNone(tx)) {
			toast.error('Transaction error')
			return
		}

		const toastTxPending = toast.loading('Transaction pending...')

		const receipt = await tx.value.wait()

		toast.dismiss(toastTxPending)
		toast.success('Transaction succesful!', {
			duration: 8000
		})

		console.log({ ...receipt })

		await updateLine(lineIndex)

        // NOTE This call might be confusing...
		setCurrentSelectedIndex(lineIndex)
		handleModalClosing()
	}

	const handleModalWalletConnection = () => {
		if (!userConnected) connection()
	}

	return (
		<>
			<div id={style['place-bid-button-container']} onClick={handleModalOppening}>
				<div id={style['place-bid-button']}>
					<span>PLACE YOUR BID</span>
				</div>
			</div>
			<dialog id="bidModal">
				<h2>Place Bid</h2>
				<div id={style['current-bid-detail']}>
					<span>Current bid: </span>
					<span>{currentBid}</span>
				</div>
				<input
					id={style['bid-input']}
					type="number"
					placeholder={minPrice}
					min={minPrice}
					step='0.025' // FIXME This shouldn't be hardcoded
					onChange={(event) => handleNewInput(parseFloat(event.target.value))}
					value={inputValue}
				/>
				<div>
					{userConnected ? (
						<div className={style['action-row']}>
							<button id={style['cancel-modal']} onClick={handleModalClosing}>
								Cancel
							</button>
							<button id={style['confirm-modal']} onClick={handleBidConfirmation}>
								Confirm
							</button>
						</div>
					) : (
						<div className={style['action-row']}>
                            <button id={style['cancel-modal']} onClick={handleModalClosing}>
                                Cancel
                            </button>
                            <button id={style['confirm-modal']} onClick={handleModalWalletConnection}>
                                Connect
                            </button>
						</div>
					)}
				</div>
			</dialog>
		</>
	)
}
