export type CategoryMatcher = {
	matches(name: string, category: string): boolean;
};

export type Category = {
	// Category name (ex: Daily Homeworks)
	name: string;
	// Number between 0-1 inclusive denoting the percentage weight of a category
	weight: number;
	matcher: CategoryMatcher[];
	drops?: number;
};

export type GradeEntry = {
	name: string;
	category: string;
	score: number;
	dueDate: Date;
	submitted: boolean;
};

// view-source:https://elearning.utdallas.edu/webapps/bb-mygrades-BB6093de9f52e1b/myGrades?course_id=_316601_1&stream_name=mygrades&is_stream=false
export class BBClass {
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
		const now = new Date();
		const categoriesWithGrades: { [key: string]: GradeEntry[] } = {};
		this.categoryGrades = this.categories.reduce((obj, cat) => {
			const localEntries = entries
				.filter(
					(e) =>
						(!Number.isNaN(e.score) || (Number.isNaN(e.score) && !e.submitted && e.dueDate < now)) &&
						cat.matcher.some((m) => m.matches(e.name, e.category))
				)
				.toSorted((a, b) => a.score - b.score)
				.slice(cat.drops || 0);
			console.log({ localEntries });
			obj[cat.name] =
				localEntries.length > 0
					? localEntries.reduce((sum, entry) => sum + entry.score, 0) /
					  localEntries.length
					: 0;
			categoriesWithGrades[cat.name] = localEntries;
			return obj;
		}, {});

		const totalWeight = Object.entries(categoriesWithGrades).reduce(
			(acc, [cat, e]) =>
				e.length > 0
					? acc + this.categories.find((c) => c.name === cat).weight
					: acc,
			0
		);

		this.overallGrade = {
			checked: true,
			num: this.categories.reduce(
				(acc, curr) =>
					acc + (curr.weight / totalWeight) * this.categoryGrades[curr.name],
				0
			)
		};
	}
}
