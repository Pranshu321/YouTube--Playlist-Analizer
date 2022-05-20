const puppeteer = require("puppeteer");
const pdf = require("pdfkit");
const fs = require("fs");
let Ctab;
let PlaylistLink =
	"https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj";
(async function () {
	try {
		let browserOpen = puppeteer.launch({
			headless: false,
			slowMo: true,
			defaultViewport: null,
            args: ["--start-maximized"]
		});

		let browserInstance = await browserOpen;
		let alltabsArr = await browserInstance.pages();
		Ctab = alltabsArr[0];
		await Ctab.goto(PlaylistLink);

		await Ctab.waitForSelector("h1#title");
		let name = await Ctab.evaluate((select) => {
			return document.querySelector(select).innerText;
		}, "h1#title");

		let DataNeddedForPdf = await Ctab.evaluate(
			getData,
			"#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer"
		);

		console.log(name, DataNeddedForPdf.NoOfViews, DataNeddedForPdf.noOfvideoes);

		let totalVideos = DataNeddedForPdf.noOfvideoes.split(" ")[0];

		let currentVideoes = await GetCurrentVideosLength();

		while (totalVideos - currentVideoes >= 20) {
			await scrolltobottom();
			currentVideoes = await GetCurrentVideosLength();
		}

		let FinalList = await getStats();
		let PlaylistPdf = new pdf();
		PlaylistPdf.pipe(fs.createWriteStream("PlaylistInfo.pdf"));
		PlaylistPdf.text(JSON.stringify(FinalList));
		PlaylistPdf.end();
	} catch (err) {
		console.log(err);
	}
})();

function getData(selector) {
	let allElements = document.querySelectorAll(selector);
	let noOfvideoes = allElements[0].innerText;
	let NoOfViews = allElements[1].innerText;

	return {
		noOfvideoes,
		NoOfViews,
	};
}

async function GetCurrentVideosLength() {
	let length = await Ctab.evaluate(
		getlength,
		"#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer"
	);

	return length;
}

async function scrolltobottom() {
	await Ctab.evaluate(gotobottom);
	function gotobottom() {
		window.scrollBy(0, window.innerHeight);
	}
}

async function getStats() {
	let stats = Ctab.evaluate(
		getNumberAndDuration,
		"#video-title",
		"#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer"
	);

	return stats;
}

function getlength(durationSelect) {
	let durationEle = document.querySelectorAll(durationSelect);
	return durationEle.length;
}

function getNumberAndDuration(videoSelector, durationSelector) {
	let videoEle = document.querySelectorAll(videoSelector);
	let duroEle = document.querySelectorAll(durationSelector);

	let goingList = [];

	for (let i = 0; i < duroEle.length; i++) {
		let videoTitle = videoEle[i].innerText;
		let duration = videoEle[i].innerText;
		goingList.push({ videoTitle, duration });
	}

	return goingList;
}
