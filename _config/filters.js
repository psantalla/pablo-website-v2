import { DateTime } from "luxon";
import metadata from "../_data/metadata.js";

// Single source of truth, see _data/metadata.js.
const SITE_TIMEZONE = metadata.timezone || "utc";

export default function(eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		const dt = DateTime.fromJSDate(dateObj, { zone: zone || SITE_TIMEZONE });
		return format ? dt.toFormat(format) : dt.toLocaleString(DateTime.DATE_FULL);
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: SITE_TIMEZONE }).toFormat('yyyy-LL-dd');
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
		return (tags || []).filter(tag => ["all", "posts", "projects", "projectTopics", "docTutorials", "docTopics"].indexOf(tag) === -1);
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

	eleventyConfig.addFilter("filterByDocTopic", function(docs, topic) {
		return (docs || []).filter(doc =>
			doc.data.docTopics && doc.data.docTopics.includes(topic)
		);
	});
};
