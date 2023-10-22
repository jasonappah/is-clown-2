import StringMatcher from '../matchers/string';
import { BBClass } from '../types';


// Copy this file and rename to classes.ts to configure your own classes
const classesS23: BBClass[] = [
	new BBClass(
		'2232-UTDAL-MATH-2413-SEC701-20352',
		'MATH 2413.701 - Differential Calculus - S23',
		[
			{
				name: 'DHW',
				weight: 0.1,
				matcher: [new StringMatcher('DHW')]
			},
			{
				name: 'GHW',
				weight: 0.15,
				matcher: [new StringMatcher('GHW', 'Assignment')]
			},
			{
				name: 'Quizzes',
				weight: 0.15,
				matcher: [new StringMatcher('Quiz', 'Q1-11')]
			},
			{
				name: 'Major Exams',
				weight: 0.36,
				matcher: [new StringMatcher('Exam', 'Exams')]
			},
			{
				name: 'Final Exam',
				weight: 0.24,
				matcher: [new StringMatcher('Final')]
			}
		]
	)
];

export default classesS23;