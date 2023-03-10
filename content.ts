import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['https://elearning.utdallas.edu/*']
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log(
		sender.tab
			? 'from a content script:' + sender.tab.url
			: 'from the extension'
	);

	console.log({ request });
	if (request?.action == 'getGrades') {
		console.log('hey :)');
		const lol = main();
		console.log({ lol });
		sendResponse(lol);
	}
});

// view-source:https://elearning.utdallas.edu/webapps/bb-mygrades-BB6093de9f52e1b/myGrades?course_id=_316601_1&stream_name=mygrades&is_stream=false
class BBClass {
	// BB Course ID (ex: 2232-UTDAL-CS-2337-SEC001-25088)
	id: string;
	// BB Course Name (ex: CS 2337.001 - Computer Science II - S23)
	name: string;
	categories: Category[];
	overallGrade: { checked: true; num: number } | { checked: false };
	categoryGrades: { [key: Category['name']]: number };

	constructor(id: string, name: string, categories: Category[]) {
		this.id = id;
		this.name = name;
		this.categories = categories;
		this.overallGrade = { checked: false };
		this.categoryGrades = {};
	}

	solve(entries: GradeEntry[]) {
		this.categoryGrades = this.categories.reduce((acc, curr) => {
			const localEntries = entries.filter(
				(e) =>
					!Number.isNaN(e.score) && curr.matcher.matches(e.name, e.category)
			);
			console.log({ localEntries, curr });
			acc[curr.name] =
				localEntries.length > 0
					? localEntries.reduce((acc, curr) => acc + curr.score, 0) /
					  localEntries.length
					: 0;
			return acc;
		}, {});

		this.overallGrade = {
			checked: true,
			num: this.categories.reduce((acc, curr) => {
				return acc + curr.weight * this.categoryGrades[curr.name];
			}, 0)
		};
	}
}

interface Category {
	// Category name (ex: Daily Homeworks)
	name: string;
	// Number between 0-1 inclusive denoting the percentage weight of a category
	weight: number;
	matcher: CategoryMatcher;
}

interface CategoryMatcher {
	matches(name: string, category: string): boolean;
}

// export class RegexMatcher implements CategoryMatcher {
//     nameRegex: RegExp
//     categoryRegex: RegExp

//     constructor(nameRegex: string, categoryRegex: RegExp = /.*/) {
//         this.nameRegex = nameRegex
//         this.categoryRegex = categoryRegex
//     }
//     matches(name: string, category: string): boolean {
//         return this.nameRegex.test(name) && this.categoryRegex.test(category)
//     }
// }

export class StringMatcher implements CategoryMatcher {
	name: string;
	category: string;

	constructor(name: string, category: string = '') {
		this.name = name;
		this.category = category;
	}
	matches(name: string, category: string): boolean {
		return name.includes(this.name) && category.includes(this.category);
	}
}

const classes = [
	new BBClass(
		'2232-UTDAL-MATH-2413-SEC701-20352',
		'MATH 2413.701 - Differential Calculus - S23',
		[
			{
				name: 'DHW',
				weight: 0.1,
				matcher: new StringMatcher('DHW')
			},
			{
				name: 'GHW',
				weight: 0.15,
				matcher: new StringMatcher('GHW', 'Assignment')
			},
			{
				name: 'Quizzes',
				weight: 0.15,
				matcher: new StringMatcher('Quiz', 'Q1-11')
			},
			{
				name: 'Major Exams',
				weight: 0.36,
				matcher: new StringMatcher('Exam', 'Exams')
			},
			{
				name: 'Final Exam',
				weight: 0.24,
				matcher: new StringMatcher('Final')
			}
		]
	)
] satisfies BBClass[];

interface GradeEntry {
	name: string;
	category: string;
	score: number;
}

const findFrame = (classes: BBClass[]) => {
	return classes.reduce<[HTMLIFrameElement | null, BBClass | null]>(
		(acc, curr) => {
			const selector = `iframe[title="${curr.name}"]`;
			const el = document.querySelector<HTMLIFrameElement>(selector);
			if (el) return [el, curr];
			return acc;
		},
		[null, null]
	);
};

function main() {
	const [frame, bb] = findFrame(classes);

	if (!(bb && frame)) {
		console.log('no frame found', { bb, frame });
		return;
	}

	const doc = frame.contentDocument;
	if (!doc) {
		console.log('no doc found', frame);
		return;
	}

	const titleEl = doc.getElementById('pageTitleDiv');
	if (!(titleEl && titleEl.innerText.includes('My Grades'))) {
		console.log('not on grades page');
		return;
	}

	const gradesTable = doc.getElementById('grades_wrapper');
	if (!gradesTable) {
		console.log('no grades table found');
		return;
	}

	const grades: GradeEntry[] = [];

	const bannedClasses = ['calculatedRow'];
	for (const row of gradesTable.children) {
		if (bannedClasses.some((c) => row.classList.contains(c))) {
			continue;
		}

		if (row.children.length != 4) {
			continue;
		}

		for (const child of row.children) {
			if (child.tagName !== 'DIV') continue;
		}

		const [items, activity, grade, status] =
			row.children as HTMLCollectionOf<HTMLDivElement>;

		if (grade.children.length != 2) {
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
		grades.push({
			name: (items.children[0] as HTMLElement).innerText,
			category: cat?.classList.contains('itemCat')
				? (cat as HTMLElement).innerText
				: '',
			score: Number(points.innerText) / Number(possible.innerText.substring(1))
		});
	}

	bb.solve(grades);

	return [bb, grades];
}
