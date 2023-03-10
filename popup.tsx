import { useEffect, useState } from 'react';

function IndexPopup() {
	const [data, setData] = useState('');
	useEffect(() => {
		console.log('Hello from popup.tsx');
		const run = async () => {
			const [tab] = await chrome.tabs.query({
				active: true,
				lastFocusedWindow: true
			});
			const response = await chrome.tabs.sendMessage(tab.id, {
				action: 'getGrades'
			});
			console.log({ response });
		};
		run();
	}, []);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				padding: 16
			}}
		>
			<h2>
				Welcome to your{' '}
				<a href="https://www.plasmo.com" target="_blank">
					Plasmo
				</a>{' '}
				Extension!
			</h2>
			<p>{data}</p>
			<a href="https://docs.plasmo.com" target="_blank">
				View Docs
			</a>
		</div>
	);
}

export default IndexPopup;
