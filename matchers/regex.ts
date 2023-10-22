import type { CategoryMatcher } from '../types';

// TODO: implement
class RegexMatcher implements CategoryMatcher {
	nameRegex: RegExp;

	categoryRegex: RegExp;

	constructor(nameRegex: string, categoryRegex = /.*/) {
		// this.nameRegex = nameRegex;
		this.categoryRegex = categoryRegex;
	}

	matches(name: string, category: string): boolean {
		return this.nameRegex.test(name) && this.categoryRegex.test(category);
	}
}

export default RegexMatcher;
