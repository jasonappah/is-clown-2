import type { PlasmoCSConfig } from 'plasmo';

import classConfig from './data/classes';
import type { BBClass, GradeEntry } from './types';

export const config: PlasmoCSConfig = {
	matches: ['https://elearning.utdallas.edu/*']
};

chrome.runtime.onMessage.addListener(
	(
		request: {
			action: string;
		},
		sender,
		sendResponse
	) => {
		console.log(
			sender.tab
				? `from a content script:${sender.tab.url}`
				: 'from the extension',
			{ request }
		);
		if (request?.action === 'getGrades') {
			console.log('hey :)');
			const data = evaluate();
			console.log({ lol: data });
			sendResponse(data);
		}
	}
);

const findFrame = (classes: BBClass[]) =>
	classes.reduce<[HTMLIFrameElement | null, BBClass | null]>(
		(acc, curr) => {
			const selector = `iframe[title="${curr.name}"]`;
			const el = document.querySelector<HTMLIFrameElement>(selector);
			if (el) return [el, curr];
			return acc;
		},
		[null, null]
	);

function evaluate(): [BBClass, GradeEntry[]] | null {
	const [frame, bb] = findFrame(classConfig);

	if (!(bb && frame)) {
		console.log('no frame found', { bb, frame });
		return;
	}

	const doc = frame.contentDocument;
	if (!doc) {
		console.log('no doc found', frame);
		return;
	}

	const grades = getGradesFromDoc(doc);

	if (grades) bb.solve(grades);

	return [bb, grades];
}

const getGradesFromDoc = (doc: Document): GradeEntry[] => {
	const titleEl = doc.getElementById('pageTitleDiv');
	if (!(titleEl && titleEl.innerText.includes('My Grades'))) {
		console.log('not on grades page');
		return [];
	}

	const gradesTable = doc.getElementById('grades_wrapper');
	if (!gradesTable) {
		console.log('no grades table found');
		return [];
	}
	const grades: GradeEntry[] = [];

	const bannedClasses = ['calculatedRow'];
	for (const row of gradesTable.children) {
		if (bannedClasses.some((c) => row.classList.contains(c))) {
			continue;
		}

		if (row.children.length !== 4) {
			continue;
		}

		for (const child of row.children) {
			if (child.tagName !== 'DIV') continue;
		}

		const [items, activity, grade, status] =
			row.children as HTMLCollectionOf<HTMLDivElement>;

		if (grade.children.length !== 2) {
			continue;
		}

		if (items.children.length < 2) {
			continue;
		}

		for (const child of grade.children) {
			if (child.tagName !== 'SPAN') continue;
		}

		for (const child of items.children) {
			if (child.tagName !== 'DIV') continue;
		}

		const [points, possible] =
			grade.children as HTMLCollectionOf<HTMLDivElement>;
		if (
			!points ||
			!possible ||
			!possible.classList.contains('pointsPossible') ||
			!points.classList.contains('grade')
		) {
			continue;
		}
		const cat = items.children[items.children.length - 2];
		const DUE_SUBST = 'Due: ';
		const dueEl = items.children[1] as HTMLElement;
		const due = dueEl.innerText.substring(DUE_SUBST.length).trim();
		const nameEl = items.children[0] as HTMLElement;
		grades.push({
			name: nameEl.innerText,
			category: cat?.classList.contains('itemCat')
				? (cat as HTMLElement).innerText
				: '',
			score: Number(points.innerText) / Number(possible.innerText.substring(1)),
			dueDate: new Date(due),
			submitted: nameEl.tagName === 'A'
		});
	}

	return grades;
};
