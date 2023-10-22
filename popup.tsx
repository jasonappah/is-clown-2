import { useEffect, useState } from 'react';

import type { BBClass, GradeEntry } from './types';

import 'water.css/out/dark.min.css';

type Res = [BBClass, GradeEntry[]];

function IndexPopup() {
	const [data, setData] = useState<Res | null>(null);
	useEffect(() => {
		// TODO: react query &| plasmo messaging?
		console.log('Hello from popup.tsx');
		const run = async () => {
			const [tab] = await chrome.tabs.query({
				active: true,
				lastFocusedWindow: true
			});
			const response = (await chrome.tabs.sendMessage(tab.id, {
				action: 'getGrades'
			})) as Res;
			console.log({ response });
			setData(response);
		};
		run();
	}, []);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				padding: 16,
				width: 500
			}}
		>
			<h1>Blackboard Grade Summary</h1>
			{data ? <Content data={data} /> : 'Loading... (check console lol)'}
		</div>
	);
}

const Content = (props: { data: Res }) => {
	const { data } = props;
	const [classInfo, assignments] = data;
	return (
		<div>
			{data && (
				<div>
					<h2>{classInfo.name}</h2>
					<table>
						<thead>
							<tr>
								<th>Category</th>
								<th>Weight</th>
								<th>Grade</th>
							</tr>
						</thead>
						<tbody>
							{classInfo.categories.map((cat) => (
								<tr key={cat.name}>
									<td>{cat.name}</td>
									<td>{gradeToDisplayString(cat.weight)}</td>
									<td>
										{gradeToDisplayString(classInfo.categoryGrades[cat.name])}
									</td>
								</tr>
							))}
						</tbody>
						{classInfo.overallGrade.checked && (
							<tfoot>
								<tr>
									<td>Total</td>
									<td>100%</td>
									<td>{gradeToDisplayString(classInfo.overallGrade.num)}</td>
								</tr>
							</tfoot>
						)}
					</table>
					<details>
						<summary>Assignments</summary>

						<table>
							<thead>
								<tr>
									<th>Assignment</th>
									<th>Grade</th>
								</tr>
							</thead>
							<tbody>
								{assignments.map((grade) => (
									<tr key={grade.name}>
										<td>{grade.name}</td>
										<td>{gradeToDisplayString(grade.score)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</details>
				</div>
			)}
		</div>
	);
};

const gradeToDisplayString = (g: number) =>
	`${(g * 100).toLocaleString(undefined, {
		maximumFractionDigits: 2
	})}%`;

export default IndexPopup;
