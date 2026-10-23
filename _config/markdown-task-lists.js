// GitHub-style task lists: `- [ ]` / `- [x]` -> disabled checkbox in a label.
// markdown-it plugin; register via eleventyConfig.amendLibrary("md", md => md.use(...)).

const marker = /^\[([ xX])\] /;

export default function taskLists(md) {
	md.core.ruler.after("inline", "task-lists", (state) => {
		const tokens = state.tokens;
		for (let i = 2; i < tokens.length; i++) {
			const inline = tokens[i];
			if (inline.type !== "inline") continue;
			if (tokens[i - 1].type !== "paragraph_open") continue;
			if (tokens[i - 2].type !== "list_item_open") continue;
			const m = marker.exec(inline.content);
			if (!m) continue;

			todoify(inline, m[1] !== " ", state.Token);
			addClass(tokens[i - 2], "task-list-item");
			const list = parentToken(tokens, i - 2);
			if (list >= 0) addClass(tokens[list], "contains-task-list");
		}
	});
}

function todoify(token, checked, Token) {
	// slice 3 (not 4): keep the space separating checkbox from text
	token.children[0].content = token.children[0].content.slice(3);
	token.content = token.content.slice(3);

	const box = new Token("html_inline", "", 0);
	box.content = `<input class="task-list-item-checkbox"${checked ? ' checked=""' : ""} disabled type="checkbox">`;
	const open = new Token("html_inline", "", 0);
	open.content = "<label>";
	const close = new Token("html_inline", "", 0);
	close.content = "</label>";
	token.children.unshift(open, box);
	token.children.push(close);
}

function parentToken(tokens, index) {
	const target = tokens[index].level - 1;
	for (let i = index - 1; i >= 0; i--) {
		if (tokens[i].level === target) return i;
	}
	return -1;
}

function addClass(token, cls) {
	const i = token.attrIndex("class");
	if (i < 0) return token.attrPush(["class", cls]);
	const classes = token.attrs[i][1].split(" ");
	if (!classes.includes(cls)) token.attrs[i][1] = `${token.attrs[i][1]} ${cls}`;
}
