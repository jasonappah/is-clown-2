import type { CategoryMatcher } from '../types';

class StringMatcher implements CategoryMatcher {
	name: string;

	category: string;

	constructor(name: string, category = '') {
		this.name = name;
		this.category = category;
	}

	matches(name: string, category: string): boolean {
		return name.includes(this.name) && category.includes(this.category);
	}
}

export default StringMatcher;
