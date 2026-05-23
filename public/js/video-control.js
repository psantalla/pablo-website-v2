(function () {
	const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
	const instances = [];

	const io = 'IntersectionObserver' in window
		? new IntersectionObserver((entries) => {
			for (const entry of entries) {
				const inst = entry.target.__vc;
				if (!inst) continue;
				inst.inView = entry.isIntersecting;
				inst.sync();
			}
		}, { threshold: 0.25 })
		: null;

	document.querySelectorAll('[data-video-control]').forEach((wrap) => {
		const video = wrap.querySelector('video');
		const btn = wrap.querySelector('[data-video-control-btn]');
		if (!video || !btn) return;

		const inst = {
			wrap, video, btn,
			userPaused: motionQuery.matches,
			inView: !io,
			tabHidden: document.hidden,
			sync() {
				const shouldPlay = !this.userPaused && this.inView && !this.tabHidden;
				if (shouldPlay && this.video.paused) this.video.play().catch(() => {});
				else if (!shouldPlay && !this.video.paused) this.video.pause();
			},
			setLabel(paused) {
				this.wrap.classList.toggle('is-paused', paused);
				this.btn.ariaLabel = paused ? 'Play animation' : 'Pause animation';
			},
		};

		wrap.__vc = inst;
		instances.push(inst);
		inst.setLabel(inst.userPaused);

		btn.addEventListener('click', () => {
			inst.userPaused = !video.paused;
			inst.setLabel(inst.userPaused);
			inst.sync();
		});

		if (io) io.observe(wrap);
		else inst.sync();
	});

	document.addEventListener('visibilitychange', () => {
		for (const inst of instances) {
			inst.tabHidden = document.hidden;
			inst.sync();
		}
	});

	motionQuery.addEventListener('change', () => {
		if (!motionQuery.matches) return;
		for (const inst of instances) {
			inst.userPaused = true;
			inst.setLabel(true);
			inst.sync();
		}
	});
})();
