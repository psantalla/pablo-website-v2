import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft) {
			data.title = `${data.title} (draft)`;
		}

		if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});

	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/"
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl")
		.addPassthroughCopy("./content/**/*.mp4")
		.addPassthroughCopy("./content/**/*.webp");

	eleventyConfig.addWatchTarget("css/**/*.css");
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");

	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "style",
	});

	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "script",
	});

	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "RSS",
				parent: "footer",
				order: 2,
				blank: true
			}
		},
		collection: {
			name: "posts",
			limit: 10,
		},
		metadata: {
			language: "en",
			title: "Pablo Santalla's Blog",
			subtitle: "Sharing struggles, while juggling perfectionism, growth, and joy, of a web developer with a vast amount of interests.",
			base: "https://pablosantalla.com/blog",
			author: {
				name: "Pablo Santalla"
			}
		}
	});

	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		formats: ["avif", "webp", "auto"],

		failOnError: false,
		svgShortCircuit: true,
		htmlOptions: {
			imgAttributes: {
				loading: "lazy",
				decoding: "async",
			}
		},

		sharpOptions: {
			animated: true,
		},
	});

	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addCollection("projectTopics", function(collectionApi) {
		const allTopics = new Set();
		const projects = collectionApi.getFilteredByTag("projects");

		projects.forEach(project => {
			if (project.data.projectTopics) {
				project.data.projectTopics.forEach(topic => allTopics.add(topic));
			}
		});

		return Array.from(allTopics).sort();
	});

	eleventyConfig.addCollection("docTopics", function(collectionApi) {
		const allTopics = new Set();
		const docs = collectionApi.getFilteredByTag("docTutorials");

		docs.forEach(doc => {
			if (doc.data.docTopics) {
				doc.data.docTopics.forEach(topic => allTopics.add(topic));
			}
		});

		return Array.from(allTopics).sort();
	});

	eleventyConfig.addPlugin(IdAttributePlugin, {});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	});
};

export const config = {
	templateFormats: [
		"md",
		"njk",
		"html",
		"liquid",
		"11ty.js",
	],

	markdownTemplateEngine: "njk",
	htmlTemplateEngine: "njk",

	dir: {
		input: "content",
		includes: "../_includes",
		data: "../_data",
		output: "_site"
	},
};
