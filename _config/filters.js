import { DateTime } from "luxon";

export default function(eleventyConfig) {
	// Changed default to DateTime.DATE_MED for more natural date formatting (e.g., "Dec 12, 2024")
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		const dt = DateTime.fromJSDate(dateObj, { zone: zone || "utc" });
		return format ? dt.toFormat(format) : dt.toLocaleString(DateTime.DATE_MED);
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter(tag => ["all", "posts", "projects"].indexOf(tag) === -1);
	});

	eleventyConfig.addFilter("sortAlphabetically", strings =>
		(strings || []).sort((b, a) => b.localeCompare(a))
	);

	eleventyConfig.addFilter("unique", array => {
		return [...new Set(array)];
	});

	eleventyConfig.addFilter("filterByProjectTopic", function(projects, topic) {
		return (projects || []).filter(project =>
			project.data.projectTopics && project.data.projectTopics.includes(topic)
		);
	});
};
