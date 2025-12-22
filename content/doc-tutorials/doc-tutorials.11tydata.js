export default {
	tags: ["docTutorials"],
	layout: "layouts/doc-tutorial.njk",
	eleventyComputed: {
		order: data => data.order || 0
	}
};
